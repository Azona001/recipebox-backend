const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary-v2");
const multer = require("multer");
require("dotenv").config();

//cloudinary config
cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "recipebox", //folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformations: [{ width: 800, height: 600, crop: "limit" }],
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
