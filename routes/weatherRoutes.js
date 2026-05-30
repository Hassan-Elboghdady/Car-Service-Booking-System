const express = require('express');
const { getWeather } = require('../controllers/weatherController');

const router = express.Router();

// GET /api/weather?city=Cairo — public route
router.get('/', getWeather);

module.exports = router;
