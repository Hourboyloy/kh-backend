const verifyTokenUser = require("../security/protect_route_user.js");
const verifyTokenManager = require("../security/protect_route_manager.js");
const upload = require("../middleware/multer_cloudinary.js");
const handle = require("../controllers/profiles.controller.js");

const profileServices = (app) => {
  // user
  app.put(
    "/user/edit/profile/:accID",
    verifyTokenUser,
    handle.updateProfileFields
  );
  app.put(
    "/user/update/profile/photo-profile-or-cover/:accID",
    verifyTokenUser,
    upload.fields([
      { name: "photoProfile", maxCount: 1 },
      { name: "photoCover", maxCount: 1 },
    ]),
    handle.updatePhotos_Pf_CoV
  );

  // manager
  app.put(
    "/manager/edit/profile/:accID",
    verifyTokenManager,
    handle.updateProfileFields
  );
  app.put(
    "/manager/update/profile/photo-profile-or-cover/:accID",
    verifyTokenManager,
    upload.fields([
      { name: "photoProfile", maxCount: 1 },
      { name: "photoCover", maxCount: 1 },
    ]),
    handle.updatePhotos_Pf_CoV
  );
};

module.exports = profileServices;
