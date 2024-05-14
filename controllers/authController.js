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
  const { firstName, lastName, email, password, userRole, cnic, phoneNumber, agencyId } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
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
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
          userId: user._id, 
          email: user.email, 
          role: user.userRole, 
          firstName: user.firstName, 
          lastName: user.lastName,
          agencyId: user.agencyId 
      },
      SECRET_KEY,
      { expiresIn: '1h' }
  );
  
  

    res.status(200).json({ message: 'Login successful', token });
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