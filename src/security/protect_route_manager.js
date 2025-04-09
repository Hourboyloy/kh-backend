const jwt = require("jsonwebtoken");
const verifyTokenManager = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({
      message: "No token provided.",
    });
  }
  let access_token = token.split(" ");
  access_token = access_token[1];

  jwt.verify(access_token, process.env.MANAGER_TOKEN, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to authenticate token.",
      });
    }
    if (result.type !== process.env.value) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  });
};

module.exports = verifyTokenManager;
