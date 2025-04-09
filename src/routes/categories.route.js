const handle = require("../controllers/categories.controller");
const upload = require("../middleware/multer_cloudinary.js");
const verifyTokenManager = require("../security/protect_route_manager.js");

const categoriesServices = (app) => {
  // main
  app.get("/categories", handle.getAll);
  app.post(
    "/main-category",
    verifyTokenManager,
    upload.single("photo"),
    handle.createMainCategory
  );
  app.delete(
    "/main-category/:id",
    verifyTokenManager,
    handle.removeMainCategory
  );
  app.put(
    "/main-category/:id",
    verifyTokenManager,
    upload.single("photo"),
    handle.editMainCategory
  );

  // sub
  app.post(
    "/sub-category/:id",
    verifyTokenManager,
    upload.single("photo"),
    handle.addSubCategory
  );
  app.put(
    "/sub-category/:id",
    verifyTokenManager,
    upload.single("photo"),
    handle.editSubCategory
  );
  app.delete("/sub-category/:id", verifyTokenManager, handle.removeSubCategory);

  // add form
  app.put(
    "/form-category/:id",
    verifyTokenManager,
    handle.editFieldsInSubCategory
  );
};

module.exports = categoriesServices;
