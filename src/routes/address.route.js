const handle = require("../controllers/address.controller.js");
const verifyTokenUser = require("../security/protect_route_user.js");
const verifyTokenManager = require("../security/protect_route_manager.js");

const addressServices = (app) => {
  app.get("/address/:id", handle.get);
  app.get("/default-address/:accID", handle.getDefaultAddress);
  app.get("/addresses/:accID", handle.getAll);

  // user
  app.post("/address/account/:accID", verifyTokenUser, handle.create);
  app.delete("/address/:id/account/:accID", verifyTokenUser, handle.remove);
  app.put("/address/:id/account/:accID", verifyTokenUser, handle.update);

  // admim
  app.post(
    "/manager/address/account/:accID",
    verifyTokenManager,
    handle.create
  );
  app.delete(
    "/manager/address/:id/account/:accID",
    verifyTokenManager,
    handle.remove
  );
  app.put(
    "/manager/address/:id/account/:accID",
    verifyTokenManager,
    handle.update
  );
};

module.exports = addressServices;
