const jwt = require("jsonwebtoken");

require('dotenv').config();


// TO CREATE ACCESS TOKEN
module.exports.createAccessToken = (user) => {
    const data = {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin
    }

    return jwt.sign(data, process.env.JWT_SECRET_KEY)
}


// TO VERIFY TOKEN
module.exports.verify = (req, res, next) => {
    console.log(req.headers.authorization);

    let token = req.headers.authorization;

    // this checks if the token is valid or not
    if(typeof token === "undefined"){
        return res.send({ auth: "Failed. No Token" });
    } else {
        console.log(token);
        //Bearer Token ejdlaskfndlskfjlksd
        // slice removes the "Bearer" literal keyword in front of the token, so that the pure token is extracted
        token = token.slice(7, token.lenght);
        console.log(token);


       
        jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decodedToken){
            if(err) {
                return res.send({
                    auth: "Failed",
                    message: err.message
                });
            } else {
                console.log("Result from verify method:")
                console.log(decodedToken);

                req.user = decodedToken;

                next();
            }
        })

    }
}


// TO VERIFY IF USER IS ADMIN
module.exports.verifyAdmin = (req, res, next) => {
    if(req.user.isAdmin) {
        next();
    } else {
        return res.send({
            auth: "Failed",
            message: "Action Forbidden"
        })
    }
}


// ERROR HANDLING
module.exports.errorHandler = (err, req, res, next) => {

    console.error(err);

    const errorMessage = err.message || "Internal Server Error";

    res.json({
        error: {
            message: errorMessage,
            errorCode: err.code || "SERVER_ERROR",
            details: err.details || null
        }
    })
}