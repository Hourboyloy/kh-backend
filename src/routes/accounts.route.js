const handle = require("../controllers/accounts.controller.js");
const verifyTokenUser = require("../security/protect_route_user.js");
const verifyTokenManager = require("../security/protect_route_manager.js");

const accountServices = (app) => {
  app.get(
    "/account/:accID/username/:username/phoneNum/:phoneNum",
    verifyTokenUser,
    handle.getAccount
  );
  app.get("/more-products/:accID", handle.getMoreProducts);
  app.get("/viewer/:username", handle.viewsAccount);
  app.post("/register", handle.register);
  app.post("/login", handle.login);

  // user
  app.delete(
    "/user/remove/account/:accID",
    verifyTokenUser,
    handle.removeAccount
  );

  app.put(
    "/user/update/account/:accID",
    verifyTokenUser,
    handle.updateAccountFields
  );

  // manager

  app.get(
    "/account-admin/username/:username/phoneNum/:phoneNum",
    verifyTokenManager,
    handle.getAccount
  );
  app.delete(
    "/manager/remove/account/:accID",
    verifyTokenManager,
    handle.removeAccount
  );
  app.put(
    "/manager/update/account/:accID",
    verifyTokenManager,
    handle.updateAccountFields
  );
  app.get("/accounts", handle.getAccountLimit);
};

module.exports = accountServices;
