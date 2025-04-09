const handle = require("../controllers/ad.controller");
const upload = require("../middleware/multer_cloudinary.js"); // Import multer middleware
const verifyTokenManager = require("../security/protect_route_manager.js");

const adServices = (app) => {
  // 👉 CREATE Ad (with image upload using multer)
  app.post(
    "/create-ad",
    verifyTokenManager,
    upload.single("image"),
    handle.create
  ); // Use the upload middleware here

  // 👉 UPDATE Ad
  app.put(
    "/update-ad/:id",
    verifyTokenManager,
    upload.single("image"),
    handle.update
  );

  // 👉 DELETE Ad
  app.delete("/delete-ad/:id", verifyTokenManager, handle.delete);

  // 👉 GET Single Ad by ID
  app.get("/ad/:id", handle.findOne);
  // 👉 GET All Ads
  app.get("/ads", handle.findByPagination);

  app.get("/get-ad", handle.getAdFiveLimit);
};

module.exports = adServices;
