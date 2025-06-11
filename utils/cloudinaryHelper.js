const cloudinary = require('../config/cloudinary');

const uploadImageToCloudinary = async (file) => {
  console.log('Subiendo imagen, tamaño en buffer:', file.buffer?.length);
  try {
    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataUri);
    return result.secure_url;
  } catch (err) {
    console.error('Error en Cloudinary:', err);
    throw err;
  }
};

module.exports = { uploadImageToCloudinary };
