const handle = require("../controllers/search.controller.js");

const searchServices = (app) => {
  app.get("/search-result", handle.searchUserAndProduct);
  app.get("/user-get-by-limit", handle.userGetByLimit);
  app.get("/search-suggestions", handle.searchSuggestions);
  app.get("/query-products", handle.queryProducts);
  app.put("/update-promotion", handle.handleUpdatePromotion);
};

module.exports = searchServices;
