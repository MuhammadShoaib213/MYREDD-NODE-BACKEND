
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getCustomers);
router.post('/add', customerController.upload.single('image'), customerController.addCustomer);
router.get('/check', customerController.checkCustomer);
router.get('/detail/:id', customerController.getCustomerDetail);

module.exports = router;

