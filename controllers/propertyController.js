const Property = require('../models/Property'); // Make sure this path is correct

// exports.addProperty = async (req, res) => {
//   console.log('Received request to add property:', req.body);

//   try {
//     console.log('Processing uploaded files for images and videos.');
//     const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
//     const video = req.files['video'] ? req.files['video'][0].path : null;

//     console.log(`Images processed: ${images.length} images found.`);
//     console.log(`Video processed: ${video ? '1 video found.' : 'No video uploaded.'}`);

//     const newProperty = new Property({
//       ...req.body,
//       images,
//       video,
//       userId: req.body.userId 
//     });

//     console.log('Attempting to save new property to the database.');
//     await newProperty.save();
//     console.log('New property added successfully:', newProperty);

//     res.status(201).json({ message: "Property added successfully", property: newProperty });
//   } catch (error) {
//     console.error('Error adding property:', error);
//     res.status(500).json({ message: "Failed to add property", error: error.message });
//   }
// };


exports.addProperty = async (req, res) => {
  try {
    const {
      userId,
      cnicNumber,
      purpose,
      inquiryType,
      propertyType,
      propertySubType,
      city,
      area,
      phaseBlock,
      category,
      features,
      bedrooms,
      budget,
      advancePayment,
      timeForPayment
    } = req.body;

    // Handle file uploads
    const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
    const video = req.files['video'] ? req.files['video'][0].path : '';

    const newProperty = new Property({
      userId,
      cnicNumber,
      purpose,
      inquiryType,
      propertyType,
      propertySubType,
      city,
      area,
      phaseBlock,
      category,
      features,
      bedrooms,
      budget,
      advancePayment,
      timeForPayment,
      images,
      video
    });

    await newProperty.save();
    res.status(201).json({ message: "Inquiry submitted successfully", property: newProperty });
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ message: "Failed to add property", error: error.message });
  }
};


// Fetch all properties from the database
// exports.fetchAllProperties = async (req, res) => {
//   try {
//     const properties = await Property.find({}); // Fetch all properties without any conditions
//     res.status(200).json(properties); // Send the fetched properties back to the client
//   } catch (error) {
//     console.error('Failed to fetch properties:', error);
//     res.status(500).json({ message: "Failed to fetch properties", error: error.message });
//   }
// };


// Assuming 'Property' is your Mongoose model for the properties collection

exports.fetchAllProperties = async (req, res) => {
  try {
    const userId = req.query.userId;  // Get user ID from query parameters
    const properties = await Property.find({ userId: userId });  // Filter properties by user ID
    res.status(200).json(properties);  // Send the filtered properties back to the client
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ message: "Failed to fetch properties", error: error.message });
  }
};
