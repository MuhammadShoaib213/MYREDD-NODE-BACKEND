const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
<<<<<<< HEAD
  host: '', // SMTP Host
  port: 465, // SMTP Port (commonly 587 for secure connection)
  secure: true, // true for 465, false for other ports
  auth: {
    user: '', // SMTP username
    pass: '' // SMTP password
=======
  host: '', // SMTP Host
  port: 465, // SMTP Port (commonly 587 for secure connection)
  secure: false, // true for 465, false for other ports
  auth: {
    user: '', // SMTP username
    pass: ' // SMTP password
>>>>>>> 2fbf7e53e53a86213158b87789fc314d12a558ab
  },
  tls: {
    rejectUnauthorized: false // Only use this option during development to bypass certain TLS restrictions.
  }
});

exports.sendEmail = (to, body, subject) => {
  const mailOptions = {
    from: 'otpverification@myredd.net', // sender address must be the same as the authenticated user
    to: to,
    subject: subject,
    text: body
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};
