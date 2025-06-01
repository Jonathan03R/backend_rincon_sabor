// middlewares/authMiddleware.js
const admin = require('../config/firebaseConfig');

const verifyToken = async (req, res, next) => {
  // Aquí usamos “Bearer ” con espacio al final
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split('Bearer ')[1]; 

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
};

module.exports = { verifyToken };
