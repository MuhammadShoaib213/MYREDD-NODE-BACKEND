// utils/mongooseHelpers.js - Performance & Query Best Practices

/**
 * Mongoose Query Performance Guidelines
 * 
 * This file provides utilities and patterns for optimized MongoDB queries
 * to handle 1000+ concurrent users efficiently.
 */

/**
 * Standard pagination options builder
 * @param {Object} query - Request query object
 * @param {Object} defaults - Default values
 * @returns {Object} Pagination configuration
 */
const getPaginationOptions = (query, defaults = {}) => {
  const {
    page = defaults.page || 1,
    limit = defaults.limit || 20,
    sortBy = defaults.sortBy || 'createdAt',
    sortOrder = defaults.sortOrder || 'desc'
  } = query;

  // Enforce limits
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  return {
    page: safePage,
    limit: safeLimit,
    skip,
    sort
  };
};

/**
 * Execute paginated query with count
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Pagination options
 * @param {Object} queryOptions - Additional query options
 * @returns {Promise<Object>} Paginated result
 */
const paginatedQuery = async (Model, filter, options, queryOptions = {}) => {
  const { page, limit, skip, sort } = options;
  const { 
    select = null,      // Field projection
    populate = null,    // Population config
    lean = true         // Use lean for read-only queries
  } = queryOptions;

  // Build query
  let query = Model.find(filter).sort(sort).skip(skip).limit(limit);

  // Apply projection (IMPORTANT for performance)
  if (select) {
    query = query.select(select);
  }

  // Apply population sparingly
  if (populate) {
    query = query.populate(populate);
  }

  // Use lean for better performance on read-only queries
  if (lean) {
    query = query.lean();
  }

  // Execute both queries in parallel
  const [data, total] = await Promise.all([
    query.exec(),
    Model.countDocuments(filter)
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * Tenant-scoped query wrapper
 * Ensures all queries are scoped to the authenticated user
 * 
 * @param {Object} baseFilter - Base query filter
 * @param {string} userId - Authenticated user ID
 * @returns {Object} Filter with tenant scope
 */
const withTenantScope = (baseFilter, userId) => {
  if (!userId) {
    throw new Error('userId is required for tenant-scoped queries');
  }
  
  return {
    ...baseFilter,
    userId: userId
  };
};

/**
 * Safe text search (prevents regex DOS)
 * @param {string} searchTerm - User search input
 * @returns {RegExp|null} Safe regex or null
 */
const safeSearchRegex = (searchTerm) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return null;
  }

  // Escape special regex characters
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Limit length to prevent DOS
  const limited = escaped.substring(0, 100);
  
  return new RegExp(limited, 'i');
};

/**
 * Build index-friendly date range filter
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @param {string} field - Date field name
 * @returns {Object} Date range filter
 */
const dateRangeFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  
  if (startDate || endDate) {
    filter[field] = {};
    
    if (startDate) {
      filter[field].$gte = new Date(startDate);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
  
  return filter;
};

/**
 * Optimal projection for list endpoints
 * Returns only fields needed for listing, not full documents
 */
const PROJECTIONS = {
  propertyList: {
    propertyCode: 1,
    city: 1,
    district: 1,
    propertyType: 1,
    inquiryType: 1,
    demand: 1,
    status: 1,
    frontPictures: { $slice: 1 }, // Only first image
    createdAt: 1,
    updatedAt: 1
  },
  
  customerList: {
    customerId: 1,
    fullName: 1,
    cnicNumber: 1,
    currentCity: 1,
    officialMobile: 1,
    profilePicture: 1,
    createdAt: 1
  },
  
  userBasic: {
    firstName: 1,
    lastName: 1,
    email: 1,
    profilePicture: 1,
    userRole: 1
  }
};

/**
 * Aggregation pipeline for dashboard stats
 * More efficient than multiple queries
 */
const dashboardStatsAggregation = (userId) => [
  { $match: { userId: userId } },
  {
    $facet: {
      total: [{ $count: 'count' }],
      byStatus: [
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ],
      byType: [
        { $group: { _id: '$propertyType', count: { $sum: 1 } } }
      ],
      recent: [
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: PROJECTIONS.propertyList }
      ]
    }
  }
];

/**
 * Connection pool monitoring
 * Log pool stats periodically in development
 */
const monitorConnectionPool = (mongoose) => {
  if (process.env.NODE_ENV !== 'development') return;

  setInterval(() => {
    const client = mongoose.connection.getClient();
    if (client && client.topology) {
      const desc = client.topology.description;
      console.log('MongoDB Pool Stats:', {
        servers: desc.servers.size,
        type: desc.type
      });
    }
  }, 60000); // Every minute
};

/**
 * Index verification helper
 * Run during startup in development to verify indexes exist
 */
const verifyIndexes = async (Model, expectedIndexes) => {
  try {
    const indexes = await Model.collection.getIndexes();
    const existingKeys = Object.keys(indexes);
    
    expectedIndexes.forEach(expected => {
      const exists = existingKeys.some(key => 
        JSON.stringify(indexes[key].key) === JSON.stringify(expected)
      );
      
      if (!exists) {
        console.warn(`⚠️  Missing index on ${Model.modelName}:`, expected);
      }
    });
  } catch (error) {
    console.error('Error verifying indexes:', error);
  }
};

module.exports = {
  getPaginationOptions,
  paginatedQuery,
  withTenantScope,
  safeSearchRegex,
  dateRangeFilter,
  PROJECTIONS,
  dashboardStatsAggregation,
  monitorConnectionPool,
  verifyIndexes
};


/**
 * USAGE EXAMPLES:
 * 
 * // In propertyController.js:
 * const { 
 *   paginatedQuery, 
 *   withTenantScope, 
 *   getPaginationOptions,
 *   PROJECTIONS 
 * } = require('../utils/mongooseHelpers');
 * 
 * exports.fetchAllProperties = async (req, res) => {
 *   try {
 *     const userId = req.user.id;  // From authenticated user, NOT req.query
 *     
 *     const pagination = getPaginationOptions(req.query, {
 *       sortBy: 'createdAt',
 *       sortOrder: 'desc'
 *     });
 *     
 *     const filter = withTenantScope({}, userId);
 *     
 *     // Add optional filters
 *     if (req.query.status) {
 *       filter.status = req.query.status;
 *     }
 *     
 *     const result = await paginatedQuery(
 *       Property,
 *       filter,
 *       pagination,
 *       { 
 *         select: PROJECTIONS.propertyList,
 *         lean: true  // Faster for read-only
 *       }
 *     );
 *     
 *     res.json(result);
 *   } catch (error) {
 *     res.status(500).json({ error: 'Failed to fetch properties' });
 *   }
 * };
 * 
 * 
 * // AVOID THESE PATTERNS:
 * 
 * // ❌ BAD: No projection (fetches entire documents)
 * await Property.find({ userId });
 * 
 * // ❌ BAD: Populate on list endpoint
 * await Property.find({}).populate('userId');
 * 
 * // ❌ BAD: Regex search without index
 * await Property.find({ city: { $regex: userInput } });
 * 
 * // ❌ BAD: Skip without index alignment
 * await Property.find({}).sort({ random: 1 }).skip(10000);
 * 
 * 
 * // ✅ GOOD PATTERNS:
 * 
 * // ✅ Use projection
 * await Property.find({ userId }).select('city status demand').lean();
 * 
 * // ✅ Use indexed fields for sort
 * await Property.find({ userId }).sort({ createdAt: -1 });
 * 
 * // ✅ Limit pagination depth
 * const safeSkip = Math.min(skip, 10000);
 * 
 * // ✅ Use lean() for read-only queries
 * await Property.findById(id).lean();
 */
