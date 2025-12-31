// controllers/authController.js
const User = require('../models/User');
const SECRET_KEY = process.env.JWT_SECRET;  
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService'); // Adjust the path as necessary
const path = require('path');
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const Invitation = require('../models/Invitation');
const { limiter } = require('../middleware/rateLimiter');

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

    const newUser = new User({
      firstName,
      lastName,
      email,
      // Password hashing is handled in User model pre('save') hook.
      password,
      userRole,
      cnic,
      phoneNumber,
      country,
      city,
      agencyId: userRole === 'agent' ? agencyId : null
    });



    let invitation;

    if (email) {
      invitation = await Invitation.findOne({ inviteeEmail: email, status: 'pending' });
    } else if (phoneNumber) {
      // Ensure phoneNumber is formatted consistently
      const phoneNumberObj = parsePhoneNumberFromString(phoneNumber);
      const formattedNumber = phoneNumberObj.number;
      invitation = await Invitation.findOne({ inviteePhone: formattedNumber, status: 'pending' });
    }

    // if (invitation) {
    //   // Update the invitation status
    //   invitation.status = 'accepted';
    //   invitation.acceptedAt = new Date();
    //   await invitation.save();

    //   // Notify the inviter
    //   const inviter = await User.findById(invitation.inviter);
    //   if (inviter) {
    //     // Send notification (we'll implement this in the next step)
    //     notifyInviter(inviter, user); // user is the newly registered user
    //   }
    // }

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
    const user = await User.findOne({ email }).select('+password +country');
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
          // profilePicture: user.profilePicture, 
          whatsappNumber: user.whatsappNumber,
      },
      SECRET_KEY,
      { expiresIn: '12h' }
  );

    res.status(200).json({ message: 'Login successful', token });
    console.log('Fetched user data:', user);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error', error: error.toString() });
  }  
};

exports.getAllAgents = async (req, res) => {
  // Extracting agencyId from the URL parameter
  const agencyId = req.params.agencyId;

  if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'agency') {
      return res.status(403).json({ message: 'Access denied' });
  }
  if (req.user.role === 'agency' && req.user.agencyId !== agencyId) {
      return res.status(403).json({ message: 'Access denied' });
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
      if (req.user.role !== 'admin' && req.user.role !== 'agency') {
          return res.status(403).json({ message: 'Access denied' });
      }

      console.log(`Attempting to update agent with ID: ${id}`);
      
      const query = (req.user.role === 'admin')
          ? { _id: id }
          : { _id: id, agencyId: req.user.agencyId };

      const agent = await User.findOneAndUpdate(
          query,
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
      if (req.user.role !== 'admin' && req.user.role !== 'agency') {
          return res.status(403).json({ message: 'Access denied' });
      }

      console.log(`Attempting to delete agent with ID: ${id}`);

      const query = (req.user.role === 'admin')
          ? { _id: id }
          : { _id: id, agencyId: req.user.agencyId };

      const agent = await User.findOneAndDelete(query);

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
  const user = await User.findOne({ email }).select('+otp +otp_expiration');
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000); // 6 digits OTP
  const otpExpiration = new Date(Date.now() + 20*60*1000); // OTP valid for 20 minutes

  user.otp = otp;
  user.otp_expiration = otpExpiration;
  await user.save();

  try {
  await sendEmail(email, `Your OTP is: ${otp}`, 'Verify Your Email');
  res.json({ message: 'OTP sent to your email.' });
} catch (error) {
  console.error('Failed to send OTP email:', error);
  res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
}
};

// Function to verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email }).select('+otp +otp_expiration');

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

const normalizeUploadPath = (req, value) => {
  if (!value) return value;
  if (typeof value !== 'string') return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  const filename = path.basename(value);
  const relative = value.startsWith('/uploads/')
    ? value
    : `/uploads/${filename}`;
  if (!req) return relative;
  const base = `${req.protocol}://${req.get('host')}`;
  return encodeURI(`${base}${relative}`);
};


exports.getProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

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
      profilePicture:
        normalizeUploadPath(req, user.profilePicture) ||
        "https://via.placeholder.com/150",
      businessLogo:
        normalizeUploadPath(req, user.businessLogo) ||
        "https://via.placeholder.com/150",
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
      is_verified: user.is_verified,
      profileCompletion : user.profileCompletion
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


function calculateProfileCompletion(user) {
  const optionalFields = [
    'whatsappNumber', 'profilePicture', 'country', 'city', 'location', 
     'businessName', 'businessOwnerName', 
    'businessWorkingArea', 'businessNTN', 'residential', 'commercial', 
    'land', 'experience', 'skills', 'dateOfBirth', 'age'
  ];

  let filledFields = 0;
  optionalFields.forEach(field => {
    if (user[field] && user[field] !== '---' && user[field] !== 'https://via.placeholder.com/150') {
      filledFields++;
    }
  });

  // Calculate percentage of filled fields, only considering the optional fields
  const completionPercentage = (filledFields / optionalFields.length) * 100;
  return Math.round(completionPercentage);
}



exports.updateProfile = async (req, res) => {
  const userId = req.params.id;
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const allowedFields = new Set([
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'whatsappNumber',
    'country',
    'city',
    'location',
    'businessInfo',
    'businessName',
    'businessOwnerName',
    'businessWorkingArea',
    'businessNTN',
    'residential',
    'commercial',
    'land',
    'experience',
    'skills',
    'dateOfBirth',
    'age',
    'cnic',
    'businessLogo',
    'profilePicture'
  ]);

  const updates = {};
  Object.keys(req.body || {}).forEach((key) => {
    if (allowedFields.has(key)) {
      updates[key] = req.body[key];
    }
  });

  // Add image URLs if files were uploaded
  if (req.files?.['profilePicture']) {
    const file = req.files['profilePicture'][0];
    const filename = file.filename || path.basename(file.path);
    updates.profilePicture = `/uploads/${filename}`;
  }
  if (req.files?.['businessLogo']) {
    const file = req.files['businessLogo'][0];
    const filename = file.filename || path.basename(file.path);
    updates.businessLogo = `/uploads/${filename}`;
  }

  try {
    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate the profile completion after update
    const profileCompletion = calculateProfileCompletion(user);
    user.profilePicture = normalizeUploadPath(req, user.profilePicture);
    user.businessLogo = normalizeUploadPath(req, user.businessLogo);

    // Update the profile completion in the database
    await User.findByIdAndUpdate(userId, { profileCompletion });

    res.json({ message: 'Profile updated successfully', user: {...user, profileCompletion} });
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




// Function to generate OTP for password reset and send email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    console.log(`Forgot Password: No user found with email ${email}`);
    return res.status(404).json({ message: 'User not found' });
  }

  const passOtp = Math.floor(100000 + Math.random() * 900000);  // 6 digits OTP
  const passOtpExpiration = new Date(Date.now() + 20 * 60 * 1000);  // OTP valid for 20 minutes

  user.passOtp = passOtp;
  user.passOtpExpiration = passOtpExpiration;
  await user.save();
  sendEmail(email, `Your OTP for password reset is: ${passOtp}`, 'Reset Your Password');

  res.json({ message: 'OTP sent to your email. Please check your inbox.' });
};




exports.verifyOtpPass = async (req, res) => {
  const { email, passOtp } = req.body;
  
  try {
    const user = await User.findOne({ email }).select(
      '+passOtp +passOtpExpiration',
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.passOtpExpiration || new Date(user.passOtpExpiration) <= new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    
    if (user.passOtp !== passOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    // ✅ Generate a secure reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.passOtp = null;
    user.passOtpExpiration = null;
    
    await user.save();
    
    // Return the token to the client (they must include it in reset request)
    res.json({ 
      message: 'OTP verified successfully',
      resetToken: resetToken // Client must store and send this with password reset
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to reset password
exports.resetPassword = async (req, res) => {
  const { email, newPassword, resetToken } = req.body;
  
  // Validate inputs
  if (!email || !newPassword || !resetToken) {
    return res.status(400).json({ message: 'Email, new password, and reset token are required' });
  }
  
  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // ✅ VERIFY the reset token (you'll need to store this when OTP is verified)
    if (!user.passwordResetToken || user.passwordResetToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Check if reset token has expired (e.g., 15 minutes)
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }
    
    // Password hashing is handled in User model pre('save') hook.
    user.password = newPassword;
    
    // Clear reset tokens after successful reset
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passOtp = undefined;
    user.passOtpExpiration = undefined;
    
    await user.save();
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to invite a new user by SMS
exports.inviteBySMS = async (req, res) => {
  const { phoneNumber } = req.body;
  const inviterId = req.user.id; // Assuming you have the inviter's ID from authentication middleware

  try {
    // Validate the phone number
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    // Use parsePhoneNumberFromString instead of parsePhoneNumber
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber);

    if (!phoneNumberObj || !phoneNumberObj.isValid()) {
      return res.status(400).json({ message: 'Invalid phone number format.' });
    }

    const formattedNumber = phoneNumberObj.number; // E.164 format

    // Check if the user already exists
    const userExists = await User.findOne({ phoneNumber: formattedNumber });
    if (userExists) {
      return res.status(409).json({ message: 'Phone number is already registered.' });
    }

    // Generate an invite link
    const inviteLink = `https://myredd.net/signup?invite=${encodeURIComponent(formattedNumber)}`;
    const smsBody = `You're invited to join our platform! Sign up here: ${inviteLink}`;

    // Send the SMS invite using Twilio
    await client.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    });

        // Create an Invitation record
        const invitation = new Invitation({
          inviter: inviterId,
          inviteePhone: formattedNumber,
          inviteMethod: 'sms',
        });
        await invitation.save();

    // Respond with a success message
    res.status(200).json({ message: `Invitation sent successfully to ${formattedNumber}` });
  } catch (error) {
    console.error('SMS Invite Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// Function to invite a new user by email
exports.invite = async (req, res) => {
  const { email } = req.body;
  const inviterId = req.user.id; // Assuming you have the inviter's ID from authentication middleware

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'Email is already registered.' }); // 409 Conflict
    }

    // Generate an invite link
    const inviteToken = encodeURIComponent(email);
    const inviteLink = `https://yourwebsite.com/signup?invite=${inviteToken}`;
    const emailSubject = 'You are invited to join our platform!';
    const emailBody = `Hello,\n\nYou have been invited to register at our platform. Please click the following link to sign up: ${inviteLink}\n\nBest regards,\nYour Team`;

    // Send the invite email
    sendEmail(email, emailBody, emailSubject);

    // Create an Invitation record
    const invitation = new Invitation({
      inviter: inviterId,
      inviteeEmail: email,
      inviteMethod: 'email',
    });
    await invitation.save();

    // Respond with success message
    res.status(200).json({ message: 'Invitation sent successfully to ' + email });
  } catch (error) {
    console.error('Invite Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

