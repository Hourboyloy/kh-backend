const handle = require("../controllers/likeSave.controller.js");
const verifyTokenUser = require("../security/protect_route_user.js");
const verifyTokenManager = require("../security/protect_route_manager.js");

const likeSaveServices = (app) => {
  app.get("/api/likes/:accID", handle.getLikedByLimit);
  app.get("/api/saves/:accID", handle.getSavedByLimit);

  // user
  app.post("/like/product/:id/account/:accID", verifyTokenUser, handle.like);
  app.delete(
    "/like/product/:id/account/:accID",
    verifyTokenUser,
    handle.unLike
  );
  app.post("/save/product/:id/account/:accID", verifyTokenUser, handle.save);
  app.delete(
    "/save/product/:id/account/:accID",
    verifyTokenUser,
    handle.removeSave
  );

  // manange
  app.post("/manager/like/product/:id/account/:accID", verifyTokenManager,handle.like);
  app.delete("/manager/like/product/:id/account/:accID", verifyTokenManager,handle.unLike);
  app.post("/manager/save/product/:id/account/:accID", verifyTokenManager,handle.save);
  app.delete("/manager/save/product/:id/account/:accID", verifyTokenManager,handle.removeSave);
};

module.exports = likeSaveServices;
