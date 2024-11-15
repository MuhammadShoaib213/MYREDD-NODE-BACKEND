// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error(err.stack);
  
    // Customize based on the type of error
    res.status(500).json({ error: 'Internal server error' });
  };
  