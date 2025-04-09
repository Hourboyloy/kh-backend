const handle = require("../controllers/products.controller.js");
const upload = require("../middleware/multer_cloudinary.js");
const verifyTokenUser = require("../security/protect_route_user.js");
const verifyTokenManager = require("../security/protect_route_manager.js");

const productsServices = (app) => {
  app.patch("/products/renew-all", handle.renewAll);
  app.get("/get-product-home", handle.getProductsWhenLoadHomePage);

  app.get("/get-product-notification", handle.getNewProductsByLimit);

  app.get("/count-product-status/:accID", handle.countStutus);
  app.get("/products", handle.getProductsLimit);
  app.get("/products/:accID/:status", handle.getProductsByStatus);
  app.get("/product/:id", handle.getDetails);

  app.get("/subscription-product/:id/account/:accID", handle.getProduct);
  app.get("/product-edit/:id", handle.getForUpdate);
  app.get(
    "/search/account/:accID/status/:status/keyword/:keyword",
    handle.productSearching
  );

  // user
  app.put(
    "/product-edit/account/:accID/product/:id",
    verifyTokenUser,
    upload.array("newPhotos"),
    handle.update
  );
  app.post(
    "/product/:accID",
    verifyTokenUser,
    upload.array("photos"),
    handle.create
  );
  app.delete(
    "/product/account/:accID/product/:id",
    verifyTokenUser,
    handle.remove
  );
  app.put(
    "/renew/product/:proID/account/:accID",
    verifyTokenUser,
    handle.renew
  );
  app.put(
    "/set-renew/product/:proID/account/:accID",
    verifyTokenUser,
    handle.setRenew
  );

  // manager
  app.put(
    "/manager/product-edit/account/:accID/product/:id",
    verifyTokenManager,
    upload.array("newPhotos"),
    handle.update
  );
  app.post(
    "/manager/product/:accID",
    verifyTokenManager,
    upload.array("photos"),
    handle.create
  );
  app.delete(
    "/manager/product/account/:accID/product/:id",
    verifyTokenManager,
    handle.remove
  );
  app.put(
    "/manager/renew/product/:proID/account/:accID",
    verifyTokenManager,
    handle.renew
  );
  app.put(
    "/manager/set-renew/product/:proID/account/:accID",
    verifyTokenManager,
    handle.setRenew
  );
};

module.exports = productsServices;
