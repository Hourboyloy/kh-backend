const mongoose = require("mongoose");

const connection = () => {
  mongoose
    .connect(process.env.DATABASE_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    .then((res) => console.log("Connection success"))
    .catch((err) => {
      console.error("Connection error:", err);
      setTimeout(connection, 5000);
    });
};

module.exports = connection;
