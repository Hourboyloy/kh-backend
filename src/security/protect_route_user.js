const jwt = require("jsonwebtoken");

const verifyTokenUser = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({
      message: "No token provided.",
    });
  }

  let access_token = token.split(" ");
  access_token = access_token[1];

  jwt.verify(access_token, process.env.USER_TOKEN, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to authenticate token.",
      });
    }
    req.user = result;
    const cleanAccID = (str) => str.replace(/[^\x20-\x7E]/g, "").trim();
    
    const userAccID = cleanAccID(req.user.accID);
    const paramAccID = cleanAccID(req.params.accID);
    if (userAccID !== paramAccID) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  });
};

module.exports = verifyTokenUser;
