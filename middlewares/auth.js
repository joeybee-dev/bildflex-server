const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

module.exports.createAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      userType: user.userType
    },
    secret,
    { expiresIn: "1d" }
  );
};

module.exports.verify = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ error: "Unauthorized" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      return res.status(401).send({ error: "Invalid or expired token" });
    }

    req.user = decodedToken;
    next();
  });
};


module.exports.verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    if (!user || user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only"
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization error",
      error: error.message
    });
  }
};