const nodemailer = require('nodemailer');

// Configure the transporter
const transporter = nodemailer.createTransport({
  host: 'mail.gbox.rw', // SMTP Host
  port: 587, // SMTP Port (commonly 587 for secure connection)
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'info@gbox.rw', // SMTP username
    pass: 'multanlahore@123@' // SMTP password
  },
  tls: {
    rejectUnauthorized: false // Only use this option during development to bypass certain TLS restrictions.
  }
});

exports.sendEmail = (to, body, subject) => {
  const mailOptions = {
    from: 'info@gbox.rw', // sender address must be the same as the authenticated user
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
