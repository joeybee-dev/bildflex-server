const User = require('../models/User');
const bcrypt = require("bcryptjs"); 
const auth = require("../auth");


// [ITEM 1] User Registration (DO NOT REVISE)
module.exports.registerUser = (req, res) => {

    // Email Invalid
    if (!req.body.email.includes("@")) {
        return res.status(400).send({
            error: "Email invalid"
        });
    }

    // Mobile Number Invalid
    if (req.body.mobileNo.length < 11) {
        return res.status(400).send({
            error: "Mobile number invalid"
        });
    }

    // Password must be atleast 8 characters
    if (req.body.password.length < 8) {
        return res.status(400).send({
            error: "Password must be atleast 8 characters"
        });
    }

    // Regsiter New User
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        mobileNo: req.body.mobileNo
    });

    // New User Save
    newUser.save()
    .then(savedUser => {
        return res.status(201).send({
            message: "Registered successfully"
        });
    })
    .catch(err => errorHandler(err, req, res));   
};
      

// [ITEM 2] User Authentication (DO NOT REVISE)
module.exports.loginUser = (req, res) => {

            // Invalid Email
            if (!req.body.email.includes("@")) {
                return res.status(400).send({
                    error: "Invalid Email"
                });
            }

    return User.findOne({email: req.body.email})
        .then(user => {

            // No Email Found
            if (!user) {
                return res.status(404).send({
                    error: "No Email Found"
                });
            }

            // Check Password
            const isPasswordCorrect = bcrypt.compareSync(
                req.body.password,
                user.password
            );

            if (!isPasswordCorrect) {
                return res.status(401).send({
                    error: "Email and password do not match"
                });
            }


            return res.status(200).send({
                access: auth.createAccessToken(user)
            });
        })
        .catch(err => errorHandler(err, req, res));
};



// [ITEM 3] Retrieve User Details (DO NOT REVISE)
module.exports.userDetails = (req, res) => {
    return User.findById(req.user.id)
    .then(result => {
        
        if(!result){

          // User Not Found
          return res.status(404).send({
              error: "User not found" 
          });

        } else {
            return res.status(200).send({
                user: result
            });  
        }
    })
    .catch(err => errorHandler(err, req, res));
};                           



// [ITEM 4] Update User as Admin (DO NOT REVISE)
module.exports.setAsAdmin = (req, res) => {
    return User.findById({_id: req.params.id})
        .then(user => {

            // User not found
            if (!user) {
                return res.status(404).send({
                    error: "User not found"
                });
            }

            // Update to Admin
            user.isAdmin = true;

            return user.save()
                .then(updatedUser => {
                    return res.status(200).send({
                        updatedUser: updatedUser
                    });
                });
        })
        .catch(err => errorHandler(err, req, res));
};



// [ITEM 5] Update Password (DO NOT REVISE)
module.exports.updatePassword = (req, res) => {
    return User.findById({_id: req.body.id})
        .then(user => {

            // User Not Found
            if (!user) {
                return res.status(404).send({
                    error: "User not found"
                });
            }

            // Update Password
            user.password = req.body.password;

            return user.save()
            .then(updatedUser => {
                return res.status(200).send({
                    message: "Password updated successfully"
                });
            })
            
        })
        .catch(err => errorHandler(err, req, res));
};


