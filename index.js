require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");


const userRoutes = require('./routes/user');
const professionalProfileRoutes = require("./routes/professionalProfile");

const cors = require("cors");  

const port = 4000;

const app = express(); 

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors());    


mongoose.connect("mongodb+srv://admin:admin@batch593.lw2tohp.mongodb.net/bildflex-professional-api?appName=Batch593");

mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'));

app.use('/users', userRoutes);
app.use('/professionals', professionalProfileRoutes);


if(require.main === module){
    app.listen(process.env.PORT || port, () => {
        console.log(`API is now online on port ${ process.env.PORT || port }`)
    });
}

module.exports = {app,mongoose};   