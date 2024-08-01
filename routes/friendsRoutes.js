const express = require('express');
const router = express.Router();
const { sendFriendRequest, updateFriendsStatus, getFriendRequests, getFriendsList, getFriendDetail, getFriendByCity, getFriendsBySpecificCity } = require('../controllers/friendsController');
const { authenticateToken } = require('../middleware/verifyToken');

router.post('/request', authenticateToken, sendFriendRequest);
router.put('/update', authenticateToken, updateFriendsStatus);
router.get('/requests', authenticateToken, getFriendRequests);
router.get('/list', authenticateToken, getFriendsList);
router.get('/detail/:id', authenticateToken, getFriendDetail);
router.get('/friends-by-city', authenticateToken, getFriendByCity);
router.get('/friends-by-city/:cityName', authenticateToken, getFriendsBySpecificCity);

module.exports = router;
