const Property = require('../models/Property'); // Make sure this path is correct
const Customer = require('../models/Customer'); 


// Example modification to include JSON parsing
exports.addProperty = async (req, res) => {
  try {
    // Parse JSON fields if they exist and are strings
    const parseJSON = (data) => {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data; // return as is if parsing fails
      }
    };

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
      timeForPayment,
      status,
      expected,
      length,
      width,
      closingDate,
      priority,
      commission
    } = req.body;

    const parsedInquiryType = parseJSON(inquiryType);
    const parsedPropertyType = parseJSON(propertyType);
    const parsedPropertySubType = parseJSON(propertySubType);
    const parsedFeatures = parseJSON(features);

    // Handle file uploads
    const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
    const video = req.files['video'] ? req.files['video'][0].path : '';

    const newProperty = new Property({
      userId,
      cnicNumber,
      purpose,
      inquiryType: parsedInquiryType,
      propertyType: parsedPropertyType,
      propertySubType: parsedPropertySubType,
      city,
      area,
      phaseBlock,
      category,
      features: parsedFeatures,
      bedrooms,
      budget,
      advancePayment,
      timeForPayment,
      images,
      video,
      status,
      expected,
      length,
      width,
      closingDate,
      priority,
      commission
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


// Fetch a single property by ID
exports.fetchPropertyById = async (req, res) => {
  try {
      const propertyId = req.params.id;  // Get property ID from URL params
      const property = await Property.findById(propertyId);
      
      if (!property) {
          return res.status(404).json({ message: "Property not found" });
      }

      res.status(200).json(property);
  } catch (error) {
      console.error('Failed to fetch property:', error);
      res.status(500).json({ message: "Failed to fetch property", error: error.message });
  }
};


exports.fetchPropertyByyId = async (req, res) => {
  try {
    const propertyId = req.params.id;  // Get property ID from URL params
    console.log(`Fetching property for ID: ${propertyId}`);

    const property = await Property.findById(propertyId);
    if (!property) {
        console.log("Property not found.");
        return res.status(404).json({ message: "Property not found" });
    }

    console.log(`Property found: ${property._id}`);

    // Fetch the customer name using the CNIC number
    const customer = await Customer.findOne({ cnicNumber: property.cnicNumber });
    const customerName = customer ? customer.fullName : 'Unknown'; // Assuming the customer model has a fullName field
    const customerId = customer ? customer._id : 'Unknown';

    const propertyWithCustomerName = {
      _id: property._id,
      cnicNumber: property.cnicNumber,
      purpose: property.purpose,
      status: property.status,
      inquiryType: property.inquiryType,
      propertyType: property.propertyType,
      propertySubType: property.propertySubType,
      city: property.city,
      area: property.area,
      phaseBlock: property.phaseBlock,
      category: property.category,
      features: property.features,
      bedrooms: property.bedrooms,
      length: property.length,
      width: property.width,
      budget: property.budget,
      advancePayment: property.advancePayment,
      expected: property.expected,
      closingDate: property.closingDate,
      timeForPayment: property.timeForPayment,
      images: property.images,
      video: property.video,
      dateAdded: property.createdAt,
      customerName: customerName, // Add the customer name to the response
      customerId: customerId,
      priority: property.priority,
      commission: property.commission 
    };

    console.log("Property with customer name prepared for response");
    res.status(200).json(propertyWithCustomerName);
  } catch (error) {
    console.error('Failed to fetch property:', error);
    res.status(500).json({ message: "Failed to fetch property", error: error.message });
  }
};

exports.fetchUserPropertiesWithInquiryType = async (req, res) => {
  try {
    const userId = req.params.userId; // Assuming you are passing user ID as a URL parameter
    console.log(`Fetching properties for user ID: ${userId}`); // Log the user ID being queried

    // Fetch all properties associated with the user ID
    const properties = await Property.find({ userId: userId });
    console.log(`Number of properties found: ${properties.length}`); // Log the count of properties found

    if (!properties.length) {
      console.log("No properties found for this user."); // Log if no properties are found
      return res.status(404).json({ message: "No properties found for this user." });
    }

    // Extracting the inquiry types from each property
    const propertiesWithInquiryType = properties.map(property => {
      console.log(`Processing property ID: ${property._id}`); // Log the processing of each property
      return {
        _id: property._id,
        inquiryType: property.inquiryType,
        description: property.description, // Add other fields you may need to return
        propertySubType: property.propertySubType,
        propertyType: property.propertyType,
        dateAdded: property.createdAt, // Returning the date the property was added to the database
        status: property.status,
        advancePayment: property.advancePayment,
        propertySubType: property.propertySubType
        // Other fields can be added here if needed
      };
    });

    console.log(`Properties with inquiry types prepared for response`); // Log when data is ready to be sent back
    // Return the properties with their inquiry types
    res.status(200).json(propertiesWithInquiryType);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ message: "Failed to fetch properties", error: error.message });
  }
};




// exports.fetchleads = async (req, res) => {
//   try {
//     const userId = req.params.userId; // Assuming you are passing user ID as a URL parameter
//     console.log(`Fetching properties for user ID: ${userId}`); // Log the user ID being queried

//     // Fetch all properties associated with the user ID
//     const properties = await Property.find({ userId: userId });
//     console.log(`Number of properties found: ${properties.length}`); // Log the count of properties found

//     if (!properties.length) {
//       console.log("No properties found for this user."); // Log if no properties are found
//       return res.status(404).json({ message: "No properties found for this user." });
//     }

//     // Extracting the inquiry types from each property
//     const propertiesWithInquiryType = properties.map(property => {
//       console.log(`Processing property ID: ${property._id}`); // Log the processing of each property
//       return {
//         _id: property._id,
//         inquiryType: property.inquiryType,
//         description: property.description, // Add other fields you may need to return
//         propertySubType: property.propertySubType,
//         propertyType: property.propertyType,
//         dateAdded: property.createdAt, // Returning the date the property was added to the database
//         status: property.status,
//         advancePayment: property.advancePayment,
//         propertySubType: property.propertySubType,
//         expected: property.expected,
//         length:property.length,
//         width: property.width,
//         features: property.features,
//         closingDate: property.closingDate
//         // Other fields can be added here if needed
//       };
//     });

//     console.log(`Properties with inquiry types prepared for response`); // Log when data is ready to be sent back
//     // Return the properties with their inquiry types
//     res.status(200).json(propertiesWithInquiryType);
//   } catch (error) {
//     console.error('Failed to fetch properties:', error);
//     res.status(500).json({ message: "Failed to fetch properties", error: error.message });
//   }
// };


exports.fetchleads = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching properties for user ID: ${userId}`);

    const properties = await Property.find({ userId: userId });
    console.log(`Number of properties found: ${properties.length}`);

    if (!properties.length) {
      console.log("No properties found for this user.");
      return res.status(404).json({ message: "No properties found for this user." });
    }

    // Map through each property to fetch customer names
    const propertiesWithCustomerNames = await Promise.all(properties.map(async property => {
      console.log(`Processing property ID: ${property._id}`);

      // Fetch the customer name using the CNIC number
      const customer = await Customer.findOne({ cnicNumber: property.cnicNumber });

      return {
        _id: property._id,
        cnicNumber: property.cnicNumber,
        purpose: property.purpose,
        status: property.status,
        inquiryType: property.inquiryType,
        propertyType: property.propertyType,
        propertySubType: property.propertySubType,
        city: property.city,
        area: property.area,
        phaseBlock: property.phaseBlock,
        category: property.category,
        features: property.features,
        bedrooms: property.bedrooms,
        length: property.length,
        width: property.width,
        budget: property.budget,
        advancePayment: property.advancePayment,
        expected: property.expected,
        closingDate: property.closingDate,
        timeForPayment: property.timeForPayment,
        images: property.images,
        video: property.video,
        dateAdded: property.createdAt,
        customerName: customer ? customer.fullName : 'Unknown' // Assuming the customer model has a fullName field
      };
    }));

    console.log("Properties with customer names prepared for response");
    res.status(200).json(propertiesWithCustomerNames);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ message: "Failed to fetch properties", error: error.message });
  }
};


exports.updatePropertyStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
      return res.status(400).json({ message: "Status is required" });
  }

  try {
      const property = await Property.findById(id);
      if (!property) {
          return res.status(404).json({ message: "Property not found" });
      }

      property.status = status;
      await property.save();
      res.status(200).json({ message: "Status updated successfully", property });
  } catch (error) {
      console.error('Error updating property status:', error);
      res.status(500).json({ message: "Failed to update property status", error: error.message });
  }
};