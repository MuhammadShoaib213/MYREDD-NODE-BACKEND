// controllers/authController.js
const User = require('../models/User');
const SECRET_KEY = 'SECRET_KEY';  
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService'); // Adjust the path as necessary



// function validatePassword(password) {
//   const regex = /^(?=.\d)(?=.[a-z])(?=.[A-Z])(?=.[a-zA-Z]).{8,}$/; // Regex for validation
//   return regex.test(password);
// }



// exports.signup = async (req, res) => {
//   const { firstName, lastName, email, password, userRole, cnic, phoneNumber } = req.body;
//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email is already registered' });
//     }
    
//     // if (!validatePassword(password)) {
//     //   return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
//     // }

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const newUser = new User({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//       userRole,
//       cnic,
//       phoneNumber
//     });
    

//     await newUser.save();
//     res.status(201).json({ message: 'User created successfully' });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };


exports.signup = async (req, res) => {
  const { firstName, lastName, email, password, userRole, cnic, phoneNumber, agencyId, country, city } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const existingUserByCnic = await User.findOne({ cnic });
    if (existingUserByCnic) {
      return res.status(400).json({ message: 'CNIC is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userRole,
      cnic,
      phoneNumber,
      country,
      city,
      agencyId: userRole === 'agent' ? agencyId : null
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+country');;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Your account is not verified. Please verify your OTP.' });
    }

    const token = jwt.sign(
      { 
          userId: user._id, 
          email: user.email, 
          role: user.userRole, 
          firstName: user.firstName, 
          lastName: user.lastName,
          agencyId: user.agencyId, 
          country: user.country,
          profilePicture: user.profilePicture, 
      },
      SECRET_KEY,
      { expiresIn: '12h' }
  );
  
  console.log('JWT Token:', token);


    res.status(200).json({ message: 'Login successful', token });
    console.log('Fetched user data:', user);
    console.log('JWT Token:', token);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllAgents = async (req, res) => {
  // Extracting agencyId from the URL parameter
  const agencyId = req.params.agencyId;

  if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access' });
  }


  try {
      const agents = await User.find({ agencyId: agencyId });
      res.json(agents);
  } catch (error) {
      console.error('Failed to fetch agents:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateAgent = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phoneNumber, cnic } = req.body;
  
  console.log("Update Agent Request:", { id, firstName, lastName, email, phoneNumber, cnic });

  try {
      console.log(`Attempting to update agent with ID: ${id}`);
      
      const agent = await User.findOneAndUpdate(
          { _id: id },
          { firstName, lastName, email, phoneNumber, cnic },
          { new: true, runValidators: true }
      );

      if (!agent) {
          console.log(`No agent found for ID: ${id}`);
          return res.status(404).json({ message: 'Agent not found' });
      }

      console.log("Agent updated successfully:", agent);
      res.json({ message: 'Agent updated successfully', agent });
  } catch (error) {
      console.error('Failed to update agent:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


exports.deleteAgent = async (req, res) => {
  const { id } = req.params;

  console.log("Delete Agent Request:", { id });

  try {
      console.log(`Attempting to delete agent with ID: ${id}`);

      const agent = await User.findOneAndDelete({ _id: id });

      if (!agent) {
          console.log(`No agent found for ID: ${id}`);
          return res.status(404).json({ message: 'Agent not found' });
      }

      console.log("Agent deleted successfully:", { id });
      res.status(204).json({ message: 'Agent deleted successfully' });
  } catch (error) {
      console.error('Failed to delete agent:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



// Function to send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // 6 digits OTP
  const otpExpiration = new Date(Date.now() + 20*60*1000); // OTP valid for 20 minutes

  user.otp = otp;
  user.otp_expiration = otpExpiration;
  await user.save();

  // Implement a function to send email
  sendEmail(email, `Your OTP is: ${otp}`, 'Verify Your Email');

  res.json({ message: 'OTP sent to your email.' });
};

// Function to verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user.otp_expiration < new Date()) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (user.otp !== otp.toString()) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  user.is_verified = true;
  user.otp = undefined;
  user.otp_expiration = undefined;
  await user.save();

  res.json({ message: 'Email verified successfully!' });
};


exports.getProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).lean();  // Use .lean() for performance if you don't need a full Mongoose document
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Default empty values for optional fields
    const defaultEmptyValue = "---";

    const userProfile = {
      firstName: user.firstName || defaultEmptyValue,
      lastName: user.lastName || defaultEmptyValue,
      email: user.email || defaultEmptyValue,
      phoneNumber: user.phoneNumber || defaultEmptyValue,
      whatsappNumber: user.whatsappNumber || defaultEmptyValue,
      profilePicture: user.profilePicture || "https://via.placeholder.com/150",
      businessLogo: user.businessLogo || "https://via.placeholder.com/150",
      country: user.country || defaultEmptyValue,
      city: user.city || defaultEmptyValue,
      location: user.location || defaultEmptyValue,
      businessInfo: user.businessInfo || defaultEmptyValue,
      businessName: user.businessName || defaultEmptyValue,
      businessOwnerName: user.businessOwnerName || defaultEmptyValue,
      businessWorkingArea: user.businessWorkingArea || defaultEmptyValue,
      businessNTN: user.businessNTN || defaultEmptyValue,
      residential: user.residential || defaultEmptyValue,
      commercial: user.commercial || defaultEmptyValue,
      land: user.land || defaultEmptyValue,
      experience: user.experience || 0,
      skills: user.skills || [],
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().substring(0, 10) : defaultEmptyValue, // Format date for easy handling in HTML input
      age: user.age || defaultEmptyValue,
      cnic: user.cnic || defaultEmptyValue,
      userRole: user.userRole,
      agencyId: user.agencyId,
      is_verified: user.is_verified
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// // exports.updateProfile = async (req, res) => {
// //   const userId = req.params.id;
// //   const updates = req.body;

// //   // Fields that are allowed to be updated
// //   const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'whatsappNumber', 'country', 'city', 'location', 'businessInfo', 'businessLogo', 'businessName', 'businessOwnerName', 'businessWorkingArea', 'businessNTN', 'residential', 'commercial', 'land', 'experience', 'skills', 'dateOfBirth', 'age'];
// //   const actualUpdates = {};

// //   // Filter out any field that is not allowed to be updated
// //   Object.keys(updates).forEach(key => {
// //     if (allowedUpdates.includes(key) && updates[key] != null) { // Ensure the field is allowed and not null
// //       actualUpdates[key] = updates[key];
// //     }
// //   });

// //   try {
// //     const user = await User.findByIdAndUpdate(userId, actualUpdates, { new: true, runValidators: true });
// //     if (!user) {
// //       return res.status(404).json({ message: 'User not found' });
// //     }
// //     res.json({ message: 'Profile updated successfully', user });
// //   } catch (error) {
// //     console.error('Error updating user profile:', error);
// //     res.status(500).json({ message: 'Internal server error', error: error.message });
// //   }
// // };

// exports.updateProfile = async (req, res) => {
//   const userId = req.params.id;
//   const updates = req.body; // This contains the text fields

//   // Add image URLs if files were uploaded
//   if (req.files['profilePicture']) {
//     updates.profilePicture = req.files['profilePicture'][0].path;
//   }
//   if (req.files['businessLogo']) {
//     updates.businessLogo = req.files['businessLogo'][0].path;
//   }

//   try {
//     const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json({ message: 'Profile updated successfully', user });
//     await user.save();
//   } catch (error) {
//     console.error('Error updating user profile:', error);
//     res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// };

exports.updateProfile = async (req, res) => {
  const userId = req.params.id;
  const updates = req.body; // This contains the text fields

  // Add image URLs if files were uploaded
  if (req.files['profilePicture']) {
    updates.profilePicture = req.files['profilePicture'][0].path;
  }
  if (req.files['businessLogo']) {
    updates.businessLogo = req.files['businessLogo'][0].path;
  }

  try {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully', user });
    await user.save();
  } catch (error) {
    console.error('Error updating user profile:', error);

    let errorMessage = 'Internal server error';
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + error.message;
    } else if (error.name === 'CastError') {
      errorMessage = `Invalid value for ${error.path}: ${error.value}`;
    }

    res.status(500).json({ message: errorMessage, error: error.message });
  }
};


exports.searchUsers = async (req, res) => {
  const { query } = req.query; // Get the search query from query parameters

  if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
  }

  try {
      const users = await User.find({
          $or: [
              { email: { $regex: query, $options: 'i' } },
              { cnic: { $regex: query, $options: 'i' } },
              { phoneNumber: { $regex: query, $options: 'i' } }
          ]
      }).select('firstName lastName email cnic phoneNumber _id profilePicture ');  // Now including _id in the results

      if (!users.length) {
          return res.status(404).json({ message: 'No users found matching the criteria' });
      }

      res.json({ users });
  } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
