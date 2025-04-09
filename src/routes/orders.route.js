const handle = require("../controllers/order.controller");
const verifyTokenUser = require("../security/protect_route_user.js");
const verifyTokenManager = require("../security/protect_route_manager.js");

const ordersServices = (app) => {
  app.get("/order-pagination", handle.getOrderLimit);

  // manager
  app.delete("/order/:id", verifyTokenManager, handle.remove);
  app.put("/order/:id", verifyTokenManager, handle.update);
  app.post("/manager/order/:accID", verifyTokenManager, handle.create);

  // user
  app.post("/order/:accID", verifyTokenUser, handle.create);
};

module.exports = ordersServices;
