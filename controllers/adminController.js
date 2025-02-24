// // backend/controllers/adminController.js
// const Admin = require('../models/Admin');
// const User = require('../models/User');
// const Property = require('../models/Property');
// const Transaction = require('../models/Transaction');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');

// // Helper function to generate token
// const generateToken = (admin) => {
//     return jwt.sign(
//         { id: admin._id, email: admin.email, role: 'admin' },
//         process.env.JWT_SECRET,
//         { expiresIn: '24h' }
//     );
// };

// // Helper function to get date range
// const getDateRange = (timeRange) => {
//     const now = new Date();
//     switch (timeRange) {
//         case 'week':
//             return new Date(now - 7 * 24 * 60 * 60 * 1000);
//         case 'month':
//             return new Date(now - 30 * 24 * 60 * 60 * 1000);
//         case 'year':
//             return new Date(now - 365 * 24 * 60 * 60 * 1000);
//         default:
//             return new Date(now - 7 * 24 * 60 * 60 * 1000);
//     }
// };

// const adminController = {
//     // Admin login
//     login: async (req, res) => {
//         try {
//             const { email, password } = req.body;
//             console.log('Login attempt for:', email);
            
//             const admin = await Admin.findOne({ email });
//             if (!admin) {
//                 console.log('Admin not found');
//                 return res.status(401).json({ error: 'Invalid credentials' });
//             }

//             const isPasswordValid = await admin.comparePassword(password);
//             if (!isPasswordValid) {
//                 console.log('Invalid password');
//                 return res.status(401).json({ error: 'Invalid credentials' });
//             }

//             // Update last login
//             admin.lastLogin = new Date();
//             await admin.save();

//             const token = generateToken(admin);
//             console.log('Login successful for:', email);
            
//             res.json({
//                 token,
//                 user: {
//                     id: admin._id,
//                     email: admin.email,
//                     firstName: admin.firstName,
//                     lastName: admin.lastName,
//                     role: 'admin'
//                 }
//             });
//         } catch (error) {
//             console.error('Login error:', error);
//             res.status(500).json({ error: error.message });
//         }
//     },

//     // Get dashboard data
//     getDashboardData: async (req, res) => {
//         try {
//             const timeRange = req.query.timeRange || 'week';
//             const startDate = getDateRange(timeRange);

//             // Get basic stats
//             const [totalUsers, totalProperties, activeUsers] = await Promise.all([
//                 User.countDocuments(),
//                 Property.countDocuments(),
//                 User.countDocuments({
//                     lastLogin: { $gte: startDate }
//                 })
//             ]);

//             // Get transactions (if any exist)
//             let totalRevenue = 0;
//             let totalProfit = 0;
//             try {
//                 const recentTransactions = await Transaction.find({
//                     createdAt: { $gte: startDate },
//                     status: 'completed'
//                 });
//                 totalRevenue = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
//                 totalProfit = totalRevenue * 0.2; // Assuming 20% profit margin
//             } catch (error) {
//                 console.log('No transactions found or error fetching transactions');
//             }

//             const timeSeriesData = await generateTimeSeriesData(startDate, timeRange);

//             res.json({
//                 stats: {
//                     totalUsers,
//                     activeUsers,
//                     totalCustomers: totalUsers,
//                     totalProperties,
//                     totalRevenue,
//                     totalProfit
//                 },
//                 chartData: timeSeriesData
//             });
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     },

//     // Create initial admin
//     createInitialAdmin: async (req, res) => {
//         try {
//             const adminExists = await Admin.findOne();
//             if (adminExists) {
//                 return res.status(400).json({ error: 'Admin already exists' });
//             }

//             const admin = new Admin({
//                 email: 'admin1@gmail.com',
//                 password: await bcrypt.hash('Pakistan@2021', 12),
//                 firstName: 'Admin',
//                 lastName: 'User'
//             });

//             await admin.save();
//             res.status(201).json({ message: 'Initial admin created successfully' });
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }
// };

// // Helper function to generate time series data
// async function generateTimeSeriesData(startDate, timeRange) {
//     const data = [];
//     const now = new Date();
//     let interval;
//     let format;

//     switch (timeRange) {
//         case 'week':
//             interval = 24 * 60 * 60 * 1000; // 1 day
//             format = date => date.toLocaleDateString('en-US', { weekday: 'short' });
//             break;
//         case 'month':
//             interval = 24 * 60 * 60 * 1000 * 2; // 2 days
//             format = date => date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
//             break;
//         case 'year':
//             interval = 24 * 60 * 60 * 1000 * 30; // 30 days
//             format = date => date.toLocaleDateString('en-US', { month: 'short' });
//             break;
//     }

//     for (let date = startDate; date <= now; date = new Date(date.getTime() + interval)) {
//         const nextDate = new Date(date.getTime() + interval);
        
//         const [users, activeUsers] = await Promise.all([
//             User.countDocuments({ createdAt: { $lte: nextDate } }),
//             User.countDocuments({ lastLogin: { $gte: date, $lt: nextDate } })
//         ]);

//         let revenue = 0;
//         let profit = 0;
//         try {
//             const transactions = await Transaction.find({
//                 createdAt: { $gte: date, $lt: nextDate },
//                 status: 'completed'
//             });
//             revenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
//             profit = revenue * 0.2;
//         } catch (error) {
//             console.log('No transactions found for this period');
//         }

//         data.push({
//             date: format(date),
//             users,
//             activeUsers,
//             revenue,
//             profit
//         });
//     }

//     return data;
// }

// module.exports = adminController;

const Admin = require('../models/Admin');
const User = require('../models/User');
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper: Generate a JWT token for the admin
const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Helper: Get a start date based on the provided time range (week, month, year)
const getDateRange = (timeRange) => {
  const now = new Date();
  switch (timeRange) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
};

// Dummy: Generate time series chart data (replace with your actual implementation)
const generateTimeSeriesData = async (startDate, timeRange) => {
  return [];
};

const adminController = {
  // Admin login method
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt for:', email);
      
      const admin = await Admin.findOne({ email });
      if (!admin) {
        console.log('Admin not found');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        console.log('Invalid password');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last login timestamp
      admin.lastLogin = new Date();
      await admin.save();
      
      const token = generateToken(admin);
      console.log('Login successful for:', email);
      
      res.json({
        token,
        user: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: 'admin'
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get dashboard data with revised revenue and profit logic
  getDashboardData: async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'week';
      const startDate = getDateRange(timeRange);

      // Basic stats
      const [totalUsers, totalProperties, activeUsers] = await Promise.all([
        User.countDocuments(),
        Property.countDocuments(),
        User.countDocuments({ lastLogin: { $gte: startDate } })
      ]);

      // Fetch properties created after startDate (adjust the filter as needed)
      const properties = await Property.find({ createdAt: { $gte: startDate } });
      let totalRevenue = 0;
      let totalProfit = 0;

      properties.forEach(property => {
        // Determine revenue: use demand if available; otherwise, use budget.max.
        let revenueForProperty = 0;
        if (property.demand) {
          revenueForProperty = property.demand;
        } else if (property.budget && property.budget.max) {
          revenueForProperty = property.budget.max;
        }
        totalRevenue += revenueForProperty;

        // Calculate profit for this property if both commission and addedValue exist.
        let propertyProfit = 0;
        if (property.commission && property.addedValue) {
          // If both values are fixed, simply add them.
          if (property.commission.type === 'fixed' && property.addedValue.type === 'fixed') {
            propertyProfit = (property.commission.value || 0) + (property.addedValue.value || 0);
          }
          // If both values are percentages, apply the percentages on the revenue.
          else if (property.commission.type === 'percentage' && property.addedValue.type === 'percentage') {
            propertyProfit = revenueForProperty * ((property.commission.value + property.addedValue.value) / 100);
          }
          // For mixed types, handle each one separately.
          else {
            if (property.commission.type === 'fixed') {
              propertyProfit += property.commission.value || 0;
            } else if (property.commission.type === 'percentage') {
              propertyProfit += revenueForProperty * ((property.commission.value || 0) / 100);
            }
            if (property.addedValue.type === 'fixed') {
              propertyProfit += property.addedValue.value || 0;
            } else if (property.addedValue.type === 'percentage') {
              propertyProfit += revenueForProperty * ((property.addedValue.value || 0) / 100);
            }
          }
        }
        totalProfit += propertyProfit;
      });

      // Revised logic for properties using percentages:
      // If all properties use percentages exclusively, then you could compute:
      // totalProfit = totalRevenue * ((sum of commission percentages + sum of added value percentages) / (100 * numberOfProperties))
      // However, to maintain revenue weighting, we compute profit per property and then sum.

      // Generate chart data (if needed)
      const timeSeriesData = await generateTimeSeriesData(startDate, timeRange);

      res.json({
        stats: {
          totalUsers,
          activeUsers,
          totalCustomers: totalUsers, // Adjust if you have a separate customer collection
          totalProperties,
          totalRevenue,
          totalProfit
        },
        chartData: timeSeriesData
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = adminController;
