const express = require('express');
const multer = require('multer');
const { agregarMenu, mostrarMenus, eliminarMenuController, procesarMenuController  } = require('../controllers/menuController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/agregarMenu', upload.single('MenuImage'), agregarMenu);
router.get('/mostrarMenus', mostrarMenus);
router.delete('/eliminarMenu/:codigo', eliminarMenuController);
router.post('/procesarMenu', procesarMenuController);
module.exports = router;
