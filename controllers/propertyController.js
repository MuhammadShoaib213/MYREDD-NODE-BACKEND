const Property = require('../models/Property'); // Make sure this path is correct
const Customer = require('../models/Customer'); 

exports.addProperty = async (req, res) => {
  try {
    // 1. Log uploaded files
    console.log('Uploaded files:', req.files);

    // 2. Log the raw body
    console.log('--- Raw req.body ---', req.body);

    // 3. Parse nested JSON fields where necessary
    const parsedBody = {};
    Object.entries(req.body).forEach(([key, value]) => {
      try {
        parsedBody[key] = JSON.parse(value);
      } catch (err) {
        parsedBody[key] = value;
      }
    });

    console.log('--- Parsed req.body ---', parsedBody);

    const {
      userId,
      cnicNumber,
      selectedCountry,
      city,
      district,
      phaseBlock,
      detectedAddress,
      size,
      sizeUnit,
      coveredWidth,
      coveredLength,
      coveredDepth,
      coveredUnit,
      landWidth,
      landLength,
      landDepth,
      landUnit,
      propertyNumber,
      streetName,
      Streetwidth,
      StreetwidthUnit,
      propertyCondition,
      demand,
      contractTerm,
      mainOption,
      areaSociety,
      inquiryType,
      propertyType,
      propertySubType,
      facilities,
      floors,
      budget,
      advancePayment, // Changed from advanceAmount
      priority,
      commission,
      addedValue,
    } = parsedBody;

    // 4. Validate required fields
    if (!cnicNumber) {
      return res.status(400).json({ message: 'CNIC number is required' });
    }

    // 5. Fetch the customer using the CNIC number
    const customer = await Customer.findOne({ cnicNumber });
    if (!customer) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // 6. Get the highest propertyNumber and increment it
    const lastProperty = await Property.findOne().sort({ propertyNumber: -1 }).exec();
    const newPropertyNumber = lastProperty?.propertyNumber
      ? (parseInt(lastProperty.propertyNumber, 10) + 1).toString()
      : '1';

    // 7. Ensure customer.customerId exists; fallback to _id if undefined
    const customerId = customer.customerId || customer._id.toString();

    // 8. Create the property code
    const propertyCode = `${customerId}${newPropertyNumber}`;

    // 9. Transform `facilities` into an array of { name, value }
    const transformedFacilities = Array.isArray(facilities)
      ? facilities.map((facility) => ({
          name: facility.name?.trim() || 'Unknown',
          value: ['Y', 'N'].includes(facility.value) ? facility.value : 'N',
        }))
      : [];

    // 10. Transform `floors` into an array of { name, features }
    const transformedFloors = Array.isArray(floors)
      ? floors.map((floor) => ({
          name: floor.name?.trim() || 'Unnamed Floor',
          features: floor.features
            ? Object.fromEntries(
                Object.entries(floor.features).map(([featureName, featureValue]) => [
                  featureName?.trim() || 'Unnamed Feature',
                  Number(featureValue) || 0,
                ])
              )
            : {},
        }))
      : [];

    // 11. Transform budget, commission, and addedValue
    const transformedBudget = {
      min: budget?.min ? Number(budget.min) : 0,
      max: budget?.max ? Number(budget.max) : 0,
    };

    const transformedCommission = {
      type: ['percentage', 'fixed'].includes(commission?.type) ? commission.type : 'percentage',
      value: commission?.value ? Number(commission.value) : 0,
    };

    const transformedAddedValue = {
      type: ['percentage', 'fixed'].includes(addedValue?.type) ? addedValue.type : 'percentage',
      value: addedValue?.value ? Number(addedValue.value) : 0,
    };

    // 12. Handle file uploads
    const frontPictures = req.files?.frontPictures?.map((file) => file.path) || [];
    const propertyPictures = req.files?.propertyPictures?.map((file) => file.path) || [];
    const images = [...frontPictures, ...propertyPictures];
    const video = req.files?.video?.[0]?.path || '';

    // 13. Prepare the new property data
    const newPropertyData = {
      userId, // Reference to the user
      cnicNumber,
      selectedCountry,
      city,
      district,
      phaseBlock,
      detectedAddress,
      size: size ? Number(size) : 0,
      sizeUnit,
      coveredWidth: coveredWidth ? Number(coveredWidth) : 0,
      coveredLength: coveredLength ? Number(coveredLength) : 0,
      coveredDepth: coveredDepth ? Number(coveredDepth) : 0,
      coveredUnit,
      landWidth: landWidth ? Number(landWidth) : 0,
      landLength: landLength ? Number(landLength) : 0,
      landDepth: landDepth ? Number(landDepth) : 0,
      landUnit,
      propertyNumber,
      streetName,
      Streetwidth: Streetwidth ? Number(Streetwidth) : 0,
      StreetwidthUnit,
      propertyCondition,
      demand: demand ? Number(demand) : 0,
      contractTerm, // Added contractTerm
      mainOption,
      areaSociety, // Ensure frontend sends this or handle accordingly
      inquiryType,
      propertyType,
      propertySubType,
      facilities: transformedFacilities,
      floors: transformedFloors,
      budget: transformedBudget,
      advancePayment: advancePayment ? Number(advancePayment) : 0, // Changed from advanceAmount
      priority,
      commission: transformedCommission,
      addedValue: transformedAddedValue,
      frontPictures,
      propertyPictures,
      video,
      propertyCode,
      status: 'New',
    };

    // 14. Create and save the property
    const newProperty = new Property(newPropertyData);
    await newProperty.save();

    // 15. Return success response
    res.status(201).json({
      message: 'Property added successfully',
      propertyId: newProperty._id,
      propertyCode,
    });
  } catch (error) {
    console.error('Error adding property:', error);

    // Handle validation errors explicitly
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error occurred',
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }

    // Handle MongoDB unique key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate key error',
        details: error.keyValue,
      });
    }

    // General error handling
    res.status(500).json({
      message: 'An unexpected error occurred while adding the property',
      error: error.message,
    });
  }
};

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

exports.fetchleads = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`Fetching properties for user ID: ${userId}`);

    // Find all properties that belong to this user
    const properties = await Property.find({ userId: userId });
    console.log(`Number of properties found: ${properties.length}`);

    if (!properties.length) {
      console.log("No properties found for this user.");
      return res.status(404).json({ message: "No properties found for this user." });
    }

    // Map through each property to include additional details (like the customer name)
    const propertiesWithCustomerNames = await Promise.all(
      properties.map(async property => {
        console.log(`Processing property ID: ${property._id}`);

        // Fetch the customer using the CNIC number
        const customer = await Customer.findOne({ cnicNumber: property.cnicNumber });

        return {
          _id: property._id,
          propertyCode: property.propertyCode,
          cnicNumber: property.cnicNumber,
          status: property.status,
          inquiryType: property.inquiryType,
          propertyType: property.propertyType,
          propertySubType: property.propertySubType,
          city: property.city,
          district: property.district,               // New field
          phaseBlock: property.phaseBlock,
          detectedAddress: property.detectedAddress,   // New field
          size: property.size,
          sizeUnit: property.sizeUnit,
          // Covered dimensions
          coveredWidth: property.coveredWidth,
          coveredLength: property.coveredLength,
          coveredDepth: property.coveredDepth,
          coveredUnit: property.coveredUnit,
          // Land dimensions
          landWidth: property.landWidth,
          landLength: property.landLength,
          landDepth: property.landDepth,
          landUnit: property.landUnit,
          propertyNumber: property.propertyNumber,
          streetName: property.streetName,
          Streetwidth: property.Streetwidth,
          StreetwidthUnit: property.StreetwidthUnit,
          propertyCondition: property.propertyCondition,
          demand: property.demand,
          contractTerm: property.contractTerm,
          mainOption: property.mainOption,
          areaSociety: property.areaSociety,
          facilities: property.facilities,       // Array of facilities (each with a name and value)
          floors: property.floors,                 // Array of floors
          budget: property.budget,
          advancePayment: property.advancePayment,
          priority: property.priority,
          commission: property.commission,         // Commission object (with type and value)
          addedValue: property.addedValue,         // Added value object
          frontPictures: property.frontPictures,   // Array of image paths for front pictures
          propertyPictures: property.propertyPictures, // Array of property image paths
          video: property.video,
          dateAdded: property.createdAt,
          customerName: customer ? customer.fullName : 'Unknown'  // Assuming Customer has a fullName field
        };
      })
    );

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
