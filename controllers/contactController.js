const nodemailer = require('nodemailer');

exports.sendEmail = async (req, res) => {
  let { senderEmail, subject, message } = req.body;

  // Create a transporter object using the custom SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com', // Custom SMTP server
    port: 465, // Common port for SMTP - adjust if necessary
    secure: true, // true for 465 (SSL), false for other ports
    auth: {
      user: 'contactform@myredd.net', // SMTP username
      pass: 'Con@Riyadh123' // SMTP password
    }
  });

  // Setup email data
  let mailOptions = {
    from: '"My REDD Web App" <contactform@myredd.net>', // Fixed sender address
    to: 'contactform@myredd.net', // Replace with your email address to receive the messages
    subject: subject, // Subject line
    text: `Message from: ${senderEmail}\n\n${message}`, // Include user's email in the message content
    html: `<p><b>Message from:</b> ${senderEmail}</p><p>${message}</p>` // Include user's email in the HTML content
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
