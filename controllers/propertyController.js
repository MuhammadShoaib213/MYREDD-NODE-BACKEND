const Property = require('../models/Property'); // Make sure this path is correct
const Customer = require('../models/Customer'); 
const { errors, asyncHandler } = require('../middleware/errorHandler');
const Counter = require('../models/Counter');
const { getPaginationOptions, paginatedQuery, withTenantScope, PROJECTIONS } = require('../utils/mongooseHelpers');
const { deleteUploadedFile, cleanupOnError } = require('../middleware/uploadSecurity');

exports.addProperty = asyncHandler(async (req, res) => {
  // 1. Get user from authenticated token (NOT from req.body)
  const userId = req.user.id;
  
  // 2. Validate required fields
  const { cnicNumber, city, propertyType, inquiryType } = req.body;
  
  if (!cnicNumber) {
    throw errors.validation('Validation failed', [
      { field: 'cnicNumber', message: 'CNIC is required' }
    ]);
  }
  
  // 3. Verify customer exists and belongs to user
  const customer = await Customer.findOne({ 
    cnicNumber, 
    userId  // Tenant scoping
  });
  
  if (!customer) {
    throw errors.notFound('Customer with this CNIC');
  }
  
  // 4. Generate atomic property number
    const propertyNumber = await Counter.getNextSequence('propertyNumber');
  
  // 5. Create property
  try {
    const property = await Property.create({
      ...req.body,
      userId,  // Always from token
      propertyNumber,
      propertyCode: `${customer.customerId}${propertyNumber}`,
      status: 'New'
    });
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: {
        id: property._id,
        propertyCode: property.propertyCode
      }
    });
  } catch (err) {
    // Clean up uploaded files on error
    await cleanupOnError(req);
    throw err;  // Re-throw to be handled by error middleware
  }
});

exports.fetchAllProperties = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate limit
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);

    const [properties, total] = await Promise.all([
      Property.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Property.countDocuments({ userId })
    ]);

    res.status(200).json({
      data: properties,
      pagination: {
        page,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
        hasMore: page * safeLimit < total
      }
    });
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
};


// Fetch a single property by ID
exports.fetchPropertyById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;
  
  // Always scope to user
  const property = await Property.findOne({
    _id: propertyId,
    userId  // Tenant scope
  }).lean();
  
  if (!property) {
    throw errors.notFound('Property');
  }
  
  res.json({
    success: true,
    data: property
  });
});


exports.fetchPropertyAd = async (req, res) => {
  try {
      const propertyId = req.params.id;  // Get property ID from URL params
      const property = await Property.findOne({ _id: propertyId, userId: req.user.id });
      
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

    const property = await Property.findOne({ _id: propertyId, userId: req.user.id });
    if (!property) {
        console.log("Property not found.");
        return res.status(404).json({ message: "Property not found" });
    }

    console.log(`Property found: ${property._id}`);

    // Fetch the customer name using the CNIC number
    const customer = await Customer.findOne({ cnicNumber: property.cnicNumber, userId: property.userId });
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
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
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
        propertySubType: property.propertySubType,
        commission : property.commission,
        addedValue : property.addedValue,
        demand : property.demand,
        budget : property.budget,
        
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
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
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
      const property = await Property.findOne({ _id: id, userId: req.user.id });
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


// Update Property Controller
exports.updateProperty = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;
  
  // Find and verify ownership in one query
  const property = await Property.findOne({
    _id: propertyId,
    userId
  });
  
  if (!property) {
    throw errors.notFound('Property');
  }
  
  // Prevent changing critical fields
  delete req.body.userId;
  delete req.body.propertyCode;
  delete req.body.propertyNumber;
  
  // Update
  Object.assign(property, req.body);
  await property.save();
  
  res.json({
    success: true,
    message: 'Property updated successfully',
    data: property
  });
});

exports.getOppositeInquiryType = (inquiryType) => {
  switch (inquiryType) {
    case 'For Sale':
      return 'For Purchase';
    case 'For Purchase':
      return 'For Sale';
    case 'For Rent':
      return 'On Rent';
    case 'On Rent':
      return 'For Rent';
    default:
      return null; // Or throw an error if you prefer
  }
};

exports.searchProperties = async (req, res) => {
  try {
    // 1. Extract search criteria from body or query
    const {
      userId: requestedUserId,
      inquiryType,
      propertyType,
      propertySubType,
      city,
      district,
      phaseBlock,
      minDemand,
      maxDemand
    } = req.body;

    // Validate required fields
    if (!inquiryType) {
      return res.status(400).json({
        message: "inquiryType is required"
      });
    }

    if (requestedUserId && req.user.role !== 'admin' && requestedUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const userId = (req.user.role === 'admin' && requestedUserId) ? requestedUserId : req.user.id;

    // 2. Compute the opposite inquiry type using the exported function
    const oppositeInquiryType = exports.getOppositeInquiryType(inquiryType);
    if (!oppositeInquiryType) {
      return res.status(400).json({
        message: `Invalid inquiryType: ${inquiryType}. No opposite type found.`
      });
    }

    // 3. Start building the Mongoose query
    const query = {
      userId: userId,
      inquiryType: oppositeInquiryType
    };

    // 4. Add optional matching fields
    if (propertyType) {
      query.propertyType = propertyType;
    }
    if (propertySubType) {
      query.propertySubType = propertySubType;
    }
    if (city) {
      query.city = city;
    }
    if (district) {
      query.district = district;
    }
    if (phaseBlock) {
      query.phaseBlock = phaseBlock;
    }

    // Add demand range if provided
    if (minDemand && maxDemand) {
      query.demand = { $gte: Number(minDemand), $lte: Number(maxDemand) };
    }

    console.log('searchProperties - Final query:', query);

    // 5. Fetch matching properties
    const matches = await Property.find(query);
    res.status(200).json(matches);
  } catch (error) {
    console.error('Error in searchProperties:', error);
    res.status(500).json({
      message: 'Failed to search properties',
      error: error.message
    });
  }
};

exports.deleteProperty = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;
  
  const property = await Property.findOneAndDelete({
    _id: propertyId,
    userId
  });
  
  if (!property) {
    throw errors.notFound('Property');
  }
  
  // Clean up associated files
  const filesToDelete = [
    ...(property.frontPictures || []),
    ...(property.propertyPictures || []),
    property.video
  ].filter(Boolean);
  
  await Promise.all(filesToDelete.map(deleteUploadedFile));
  
  res.status(200).json({
    success: true,
    message: 'Property deleted successfully'
  });
});
