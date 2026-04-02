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

module.exports.verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== "admin") {
    return res.status(403).send({ error: "Forbidden: Admin access only" });
  }

  next();
};