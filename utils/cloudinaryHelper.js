const cloudinary = require('../config/cloudinary');

const uploadImageToCloudinary = async (file) => {
    const buffer = file.buffer;
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri);
    return result.secure_url;
};

module.exports = { uploadImageToCloudinary };
