const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'SECRET_KEY';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader); // Check if the header is present

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const token = authHeader.split(' ')[1];
  console.log("Extracted Token:", token); // See the extracted token

  if (!token) {
    return res.status(401).json({ error: 'Bearer token not found' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("JWT Verification Error:", err); // Log the specific JWT error
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ error: 'Token is invalid' });
      } else {
        return res.status(403).json({ error: 'Token verification failed' });
      }
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      agencyId: decoded.agencyId 
    };
    console.log("User from token:", req.user); // Confirm user data is available
    next();
  });
};



module.exports = { authenticateToken };
