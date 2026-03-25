require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routes/user");
const professionalProfileRoutes = require("./routes/professionalProfile");

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true
  })
);

mongoose.connect(MONGODB_URI);

mongoose.connection.once("open", () => {
  console.log("Now connected to MongoDB Atlas.");
});

app.use("/users", userRoutes);
app.use("/professionals", professionalProfileRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API is now online on port ${PORT}`);
  });
}

module.exports = { app, mongoose };