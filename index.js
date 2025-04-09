require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connection = require("./src/cloud/connectionDB");
const accountServices = require("./src/routes/accounts.route");
const profileServices = require("./src/routes/profiles.route");
const categoriesServices = require("./src/routes/categories.route");
const productsServices = require("./src/routes/products.route");
const likeSaveServices = require("./src/routes/likeSave.route");
const addressServices = require("./src/routes/address.route");
const searchServices = require("./src/routes/search.route");
const adServices = require("./src/routes/ad.route");
const ordersServices = require("./src/routes/orders.route");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,DELETE,PUT",
  })
);

connection();
accountServices(app);
profileServices(app);
categoriesServices(app);
productsServices(app);
likeSaveServices(app);
addressServices(app);
searchServices(app);
adServices(app);
ordersServices(app);

app.listen(process.env.PORT_LISTEN, () => {
  console.log("listening", process.env.PORT_LISTEN);
});
