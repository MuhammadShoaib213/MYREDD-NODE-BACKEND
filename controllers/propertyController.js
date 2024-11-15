const Property = require('../models/Property'); // Make sure this path is correct
const Customer = require('../models/Customer'); 


// Example modification to include JSON parsing
// exports.addProperty = async (req, res) => {
//   try {
//     // Parse JSON fields if they exist and are strings
//     const parseJSON = (data) => {
//       try {
//         return JSON.parse(data);
//       } catch (e) {
//         return data; // return as is if parsing fails
//       }
//     };

//     const {
//       userId,
//       cnicNumber,
//       purpose,
//       inquiryType,
//       propertyType,
//       propertySubType,
//       city,
//       area,
//       phaseBlock,
//       category,
//       features,
//       bedrooms,
//       budget,
//       advancePayment,
//       timeForPayment,
//       status,
//       expected,
//       length,
//       width,
//       closingDate,
//       priority,
//       commission
//     } = req.body;

//     const parsedInquiryType = parseJSON(inquiryType);
//     const parsedPropertyType = parseJSON(propertyType);
//     const parsedPropertySubType = parseJSON(propertySubType);
//     const parsedFeatures = parseJSON(features);

//     // Handle file uploads
//     const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
//     const video = req.files['video'] ? req.files['video'][0].path : '';

//     const newProperty = new Property({
//       userId,
//       cnicNumber,
//       purpose,
//       inquiryType: parsedInquiryType,
//       propertyType: parsedPropertyType,
//       propertySubType: parsedPropertySubType,
//       city,
//       area,
//       phaseBlock,
//       category,
//       features: parsedFeatures,
//       bedrooms,
//       budget,
//       advancePayment,
//       timeForPayment,
//       images,
//       video,
//       status,
//       expected,
//       length,
//       width,
//       closingDate,
//       priority,
//       commission
//     });

//     await newProperty.save();
//     res.status(201).json({ message: "Inquiry submitted successfully", property: newProperty });
//   } catch (error) {
//     console.error('Error adding property:', error);
//     res.status(500).json({ message: "Failed to add property", error: error.message });
//   }
// };

// exports.addProperty = async (req, res) => {
//   console.log('Uploaded files:', req.files);

//   try {
//     // Parse JSON fields if they exist and are strings
//     const parseJSON = (data) => {
//       try {
//         return JSON.parse(data);
//       } catch (e) {
//         return data; // return as is if parsing fails
//       }
//     };

//     const {
//       userId,
//       cnicNumber,
//       purpose,
//       inquiryType,
//       propertyType,
//       propertySubType,
//       city,
//       area,
//       phaseBlock,
//       category,
//       features,
//       bedrooms,
//       budget,
//       advancePayment,
//       timeForPayment,
//       status,
//       expected,
//       length,
//       width,
//       closingDate,
//       priority,
//       commission
//     } = req.body;

//     const parsedInquiryType = parseJSON(inquiryType);
//     const parsedPropertyType = parseJSON(propertyType);
//     const parsedPropertySubType = parseJSON(propertySubType);
//     const parsedFeatures = parseJSON(features);

//     // Handle file uploads
//     const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
//     const video = req.files['video'] ? req.files['video'][0].path : '';

//     const newProperty = new Property({
//       userId,
//       cnicNumber,
//       purpose,
//       inquiryType: parsedInquiryType,
//       propertyType: parsedPropertyType,
//       propertySubType: parsedPropertySubType,
//       city,
//       area,
//       phaseBlock,
//       category,
//       features: parsedFeatures,
//       bedrooms,
//       budget,
//       advancePayment,
//       timeForPayment,
//       images,
//       video,
//       status,
//       expected,
//       length,
//       width,
//       closingDate,
//       priority,
//       commission
//     });

//     await newProperty.save();
//     res.status(201).json({ 
//       message: "Inquiry submitted successfully", 
//       propertyId: newProperty._id  // Returning the property ID
//     });
//   } catch (error) {
//     console.error('Error adding property:', error);
//     res.status(500).json({ message: "Failed to add property", error: error.message });
//   }
// };

// exports.addProperty = async (req, res) => {
//   console.log('Uploaded files:', req.files);

//   try {
//     // Parse JSON fields if they exist and are strings
//     const parseJSON = (data) => {
//       try {
//         return JSON.parse(data);
//       } catch (e) {
//         return data; // return as is if parsing fails
//       }
//     };

//     const {
//       userId,
//       cnicNumber,
//       purpose,
//       inquiryType,
//       propertyType,
//       propertySubType,
//       city,
//       area,
//       phaseBlock,
//       category,
//       features,
//       bedrooms,
//       budget,
//       advancePayment,
//       timeForPayment,
//       status,
//       expected,
//       length,
//       width,
//       closingDate,
//       priority,
//       commission
//     } = req.body;

//     const parsedInquiryType = parseJSON(inquiryType);
//     const parsedPropertyType = parseJSON(propertyType);
//     const parsedPropertySubType = parseJSON(propertySubType);
//     const parsedFeatures = parseJSON(features);

//     // Handle file uploads
//     const images = req.files['images'] ? req.files['images'].map(file => file.path) : [];
//     const video = req.files['video'] ? req.files['video'][0].path : '';

//     // Fetch the property with the highest propertyNumber and increment it for the new property
//     const lastProperty = await Property.findOne().sort({ propertyNumber: -1 }).exec();
//     let newPropertyNumber = 1; // Default starting number if no previous property exists

//     if (lastProperty && lastProperty.propertyNumber) {
//       newPropertyNumber = lastProperty.propertyNumber + 1;
//     }

//     // Create the new property with the incremented propertyNumber
//     const newProperty = new Property({
//       userId,
//       cnicNumber,
//       purpose,
//       inquiryType: parsedInquiryType,
//       propertyType: parsedPropertyType,
//       propertySubType: parsedPropertySubType,
//       city,
//       area,
//       phaseBlock,
//       category,
//       features: parsedFeatures,
//       bedrooms,
//       budget,
//       advancePayment,
//       timeForPayment,
//       images,
//       video,
//       status,
//       expected,
//       length,
//       width,
//       closingDate,
//       priority,
//       commission,
//       propertyNumber: newPropertyNumber // Assign the new propertyNumber
//     });

//     await newProperty.save();
//     res.status(201).json({ 
//       message: "Inquiry submitted successfully", 
//       propertyId: newProperty._id,
//       propertyNumber: newPropertyNumber // Returning the propertyNumber
//     });
//   } catch (error) {
//     console.error('Error adding property:', error);
//     res.status(500).json({ message: "Failed to add property", error: error.message });
//   }
// };

exports.addProperty = async (req, res) => {
  console.log('Uploaded files:', req.files);

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

    // Fetch the Customer using only the cnicNumber
    const customer = await Customer.findOne({ cnicNumber: cnicNumber });
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Get the highest propertyNumber and increment it
    const lastProperty = await Property.findOne().sort({ propertyNumber: -1 }).exec();
    let newPropertyNumber = 1; // Default starting number if no previous property exists

    if (lastProperty && lastProperty.propertyNumber) {
      newPropertyNumber = lastProperty.propertyNumber + 1;
    }

    // Create the property code
    const propertyCode = `${customer.customerId}${newPropertyNumber}`;

    // Create the new property with the generated propertyCode and propertyNumber
    const newProperty = new Property({
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
      commission,
      propertyNumber: newPropertyNumber,
      propertyCode: propertyCode // Set the property code
    });

    await newProperty.save();
    res.status(201).json({ 
      message: "Inquiry submitted successfully", 
      propertyId: newProperty._id,
      propertyCode: propertyCode // Return the property code
    });
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

exports.fetchPropertyAd = async (req, res) => {
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


// Helper function to determine the opposite inquiry type
function getOppositeInquiryType(inquiryType) {
  const mappings = {
    forSale: 'forPurchase',
    forPurchase: 'forSale',
    forRent: 'onRent',
    onRent: 'forRent'
  };

  return mappings[inquiryType] || null;
}

// Function to find matches for a property
exports.findMatches = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const oppositeInquiryType = getOppositeInquiryType(property.inquiryType);
    
    if (!oppositeInquiryType) {
      return res.status(400).json({ message: "Invalid inquiry type for matching" });
    }
    
    const matches = await Property.find({ 
      inquiryType: oppositeInquiryType,
      propertyType: property.propertyType,
      propertySubType: property.propertySubType,
      area: property.area,
      city: property.city
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error('Failed to find matches:', error);
    res.status(500).json({ message: "Failed to process request", error: error.message });
  }
};


// Helper function to parse JSON fields
const parseJSON = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data; // Return as-is if parsing fails
  }
};

// // Update Property Controller
// exports.updateProperty = async (req, res) => {
//   console.log('Received request to update property:', req.params.id);
//   console.log('Uploaded files:', req.files);

//   try {
//     const propertyId = req.params.id;

//     // Fetch the existing property
//     const property = await Property.findById(propertyId);
//     if (!property) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     // Extract fields from request body
//     const {
//       userId,
//       cnicNumber,
//       purpose,
//       inquiryType,
//       propertyType,
//       propertySubType,
//       city,
//       area,
//       phaseBlock,
//       category,
//       features,
//       bedrooms,
//       budget,
//       advancePayment,
//       timeForPayment,
//       status,
//       expected,
//       length,
//       width,
//       closingDate,
//       priority,
//       commission
//     } = req.body;

//     // Parse JSON fields if necessary
//     const parsedInquiryType = inquiryType ? parseJSON(inquiryType) : property.inquiryType;
//     const parsedPropertyType = propertyType ? parseJSON(propertyType) : property.propertyType;
//     const parsedPropertySubType = propertySubType ? parseJSON(propertySubType) : property.propertySubType;
//     const parsedFeatures = features ? parseJSON(features) : property.features;



//     // Update the property fields
//     property.userId = userId || property.userId;
//     property.cnicNumber = cnicNumber || property.cnicNumber;
//     property.purpose = purpose || property.purpose;
//     property.inquiryType = parsedInquiryType;
//     property.propertyType = parsedPropertyType;
//     property.propertySubType = parsedPropertySubType;
//     property.city = city || property.city;
//     property.area = area || property.area;
//     property.phaseBlock = phaseBlock || property.phaseBlock;
//     property.category = category || property.category;
//     property.features = parsedFeatures;
//     property.bedrooms = bedrooms !== undefined ? bedrooms : property.bedrooms;
//     property.budget = budget !== undefined ? budget : property.budget;
//     property.advancePayment = advancePayment !== undefined ? advancePayment : property.advancePayment;
//     property.timeForPayment = timeForPayment || property.timeForPayment;
//     property.status = status || property.status;
//     property.expected = expected || property.expected;
//     property.length = length !== undefined ? length : property.length;
//     property.width = width !== undefined ? width : property.width;
//     property.closingDate = closingDate || property.closingDate;
//     property.priority = priority || property.priority;
//     property.commission = commission !== undefined ? commission : property.commission;


//     // Save the updated property
//     await property.save();

//     res.status(200).json({ message: "Property updated successfully", property });
//   } catch (error) {
//     console.error('Error updating property:', error);
//     res.status(500).json({ message: "Failed to update property", error: error.message });
//   }
// };

// Update Property Controller
exports.updateProperty = async (req, res) => {
  console.log('Received request to update property:', req.params.id);
  console.log('Request body:', req.body);
  console.log('Uploaded files:', req.files);

  try {
    const propertyId = req.params.id;
    console.log(`Looking for property with ID: ${propertyId}`);

    // Fetch the existing property
    const property = await Property.findById(propertyId);
    console.log('Existing property data:', property);

    if (!property) {
      console.log(`No property found with ID: ${propertyId}`);
      return res.status(404).json({ message: "Property not found" });
    }

    // Extract fields from request body
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

    console.log('Parsed request body fields:', {
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
    });

    // Helper function to parse JSON fields safely
    const parseJSON = (field, fieldName) => {
      try {
        return field ? JSON.parse(field) : undefined;
      } catch (parseError) {
        console.error(`Failed to parse JSON for ${fieldName}:`, parseError);
        return undefined;
      }
    };

    // Parse JSON fields if necessary
    const parsedInquiryType = parseJSON(inquiryType, 'inquiryType') || property.inquiryType;
    const parsedPropertyType = parseJSON(propertyType, 'propertyType') || property.propertyType;
    const parsedPropertySubType = parseJSON(propertySubType, 'propertySubType') || property.propertySubType;
    const parsedFeatures = parseJSON(features, 'features') || property.features;

    // Update the property fields
    console.log('Updating property fields...');
    if (userId !== undefined) {
      console.log(`Changing userId from ${property.userId} to ${userId}`);
      property.userId = userId;
    }
    if (cnicNumber !== undefined) {
      console.log(`Changing cnicNumber from ${property.cnicNumber} to ${cnicNumber}`);
      property.cnicNumber = cnicNumber;
    }
    if (purpose !== undefined) {
      console.log(`Changing purpose from ${property.purpose} to ${purpose}`);
      property.purpose = purpose;
    }
    if (inquiryType !== undefined || parsedInquiryType !== property.inquiryType) {
      console.log(`Changing inquiryType from ${property.inquiryType} to ${parsedInquiryType}`);
      property.inquiryType = parsedInquiryType;
    }
    if (propertyType !== undefined || parsedPropertyType !== property.propertyType) {
      console.log(`Changing propertyType from ${property.propertyType} to ${parsedPropertyType}`);
      property.propertyType = parsedPropertyType;
    }
    if (propertySubType !== undefined || parsedPropertySubType !== property.propertySubType) {
      console.log(`Changing propertySubType from ${property.propertySubType} to ${parsedPropertySubType}`);
      property.propertySubType = parsedPropertySubType;
    }
    if (city !== undefined) {
      console.log(`Changing city from ${property.city} to ${city}`);
      property.city = city;
    }
    if (area !== undefined) {
      console.log(`Changing area from ${property.area} to ${area}`);
      property.area = area;
    }
    if (phaseBlock !== undefined) {
      console.log(`Changing phaseBlock from ${property.phaseBlock} to ${phaseBlock}`);
      property.phaseBlock = phaseBlock;
    }
    if (category !== undefined) {
      console.log(`Changing category from ${property.category} to ${category}`);
      property.category = category;
    }
    if (features !== undefined || parsedFeatures !== property.features) {
      console.log(`Changing features from ${JSON.stringify(property.features)} to ${JSON.stringify(parsedFeatures)}`);
      property.features = parsedFeatures;
    }
    if (bedrooms !== undefined) {
      console.log(`Changing bedrooms from ${property.bedrooms} to ${bedrooms}`);
      property.bedrooms = bedrooms;
    }
    if (budget !== undefined) {
      console.log(`Changing budget from ${property.budget} to ${budget}`);
      property.budget = budget;
    }
    if (advancePayment !== undefined) {
      console.log(`Changing advancePayment from ${property.advancePayment} to ${advancePayment}`);
      property.advancePayment = advancePayment;
    }
    if (timeForPayment !== undefined) {
      console.log(`Changing timeForPayment from ${property.timeForPayment} to ${timeForPayment}`);
      property.timeForPayment = timeForPayment;
    }
    if (status !== undefined) {
      console.log(`Changing status from ${property.status} to ${status}`);
      property.status = status;
    }
    if (expected !== undefined) {
      console.log(`Changing expected from ${property.expected} to ${expected}`);
      property.expected = expected;
    }
    if (length !== undefined) {
      console.log(`Changing length from ${property.length} to ${length}`);
      property.length = length;
    }
    if (width !== undefined) {
      console.log(`Changing width from ${property.width} to ${width}`);
      property.width = width;
    }
    if (closingDate !== undefined) {
      console.log(`Changing closingDate from ${property.closingDate} to ${closingDate}`);
      property.closingDate = closingDate;
    }
    if (priority !== undefined) {
      console.log(`Changing priority from ${property.priority} to ${priority}`);
      property.priority = priority;
    }
    if (commission !== undefined) {
      console.log(`Changing commission from ${property.commission} to ${commission}`);
      property.commission = commission;
    }

    // Save the updated property
    console.log('Saving updated property...');
    const updatedProperty = await property.save();
    console.log('Property updated successfully:', updatedProperty);

    res.status(200).json({ message: "Property updated successfully", property: updatedProperty });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: "Failed to update property", error: error.message });
  }
};
