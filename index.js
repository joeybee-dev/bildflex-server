const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const cartRoute = require("./routes/cartRoute"); 
const orderRoute = require("./routes/orderRoute"); 

require("dotenv").config();

const app = express();

app.use(express.json()); 

const corsOptions = {
	
	origin: ["http://localhost:5173"],
	credentials: true,
	optionsSuccessStatus: 200
}

app.use(cors(corsOptions));

mongoose.connect(process.env.BILDFLEXDB);
mongoose.connection.once("open", () => console.log("Now connected to MongoDB Atlas."))


app.use("/users", userRoute);
app.use("/products", productRoute);
app.use("/cart", cartRoute);
app.use("/orders", orderRoute); 



if (require.main === module){
	app.listen(process.env.PORT, () => console.log(`Server running at port ${process.env.PORT}`))
}



module.exports = {app, mongoose};