const jwt = require("jsonwebtoken");
const secret = "ProfessAPI";



    // Create Access
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


    // Verify
    module.exports.verify = (req, res, next) => {
      let token = req.headers.authorization;

      if (typeof token !== "undefined") {
        token = token.slice(7, token.length);

        jwt.verify(token, secret, function (err, decodedToken) {
          if (err) {
            return res.status(401).send({ error: "Invalid token" });
          } else {
            req.user = decodedToken;
            next();
          }
        });
      } else {
        return res.status(401).send({ error: "Authorization header missing" });
      }
    };


    // Verify Admin
    module.exports.verifyAdmin = (req, res, next) => {
      if (req.user.isAdmin) {
        next();
      } else {
        return res.status(403).send({
          error: "Action forbidden"
        });
      }
    };

