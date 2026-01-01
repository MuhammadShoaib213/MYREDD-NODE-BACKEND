const express = require('express');
const router = express.Router();
const { sendFriendRequest, updateFriendsStatus, getFriendRequests, getFriendsList, getFriendDetail, getFriendByCity, getFriendsBySpecificCity } = require('../controllers/friendsController');
const { authenticateToken } = require('../middleware/verifyToken');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/request', authenticateToken, asyncHandler(sendFriendRequest));
router.put('/update', authenticateToken, asyncHandler(updateFriendsStatus));
router.get('/requests', authenticateToken, asyncHandler(getFriendRequests));
router.get('/list', authenticateToken, asyncHandler(getFriendsList));
router.get('/detail/:id', authenticateToken, asyncHandler(getFriendDetail));
router.get('/friends-by-city', authenticateToken, asyncHandler(getFriendByCity));
router.get('/friends-by-city/:cityName', authenticateToken, asyncHandler(getFriendsBySpecificCity));

module.exports = router;
