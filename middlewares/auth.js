const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

// Create Access Token
module.exports.createAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      userType: user.userType
    },
    secret,
    { expiresIn: "1d" }
  );
};

// Verify Token
module.exports.verify = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ error: "Authorization header missing" });
  }

  if (!token.startsWith("Bearer ")) {
    return res.status(401).send({ error: "Invalid authorization format" });
  }

  token = token.slice(7);

  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      return res.status(401).send({ error: "Invalid or expired token" });
    }

    req.user = decodedToken;
    next();
  });
};

// Verify Admin
module.exports.verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).send({ error: "Action forbidden" });
  }

  next();
};