const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res) => {
  let { email, subject, message } = req.body;

  // Create a transporter object using the custom SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'mail.gbox.rw', // Custom SMTP server
    port: 587, // Common port for SMTP - adjust if necessary
    secure: false, // true for 465 (SSL), false for other ports
    auth: {
      user: 'info@gbox.rw', // SMTP username
      pass: 'multanlahore@123@' // SMTP password
    }
  });

  // Setup email data
  let mailOptions = {
    from: '"My REDD Web App" <test@MYREDD.NET>', // Update sender address
    to: email, // List of receivers
    subject: subject, // Subject line
    text: message, // Plain text body
    html: `<b>${message}</b>` // HTML body content
  };

  // Send mail with defined transport object
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return res.status(200).send('Message sent successfully!');
  } catch (error) {
    console.error('Error sending email: ', error);
    return res.status(500).send('Failed to send message.');
  }

};
