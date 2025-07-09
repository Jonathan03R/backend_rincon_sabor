const express = require('express');
const router = express.Router();
const controller = require('../controllers/prediccionesController');

router.get('/ventas-historicas', controller.getHistorialVentas);

module.exports = router;
