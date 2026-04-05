require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const handymanRoutes = require("./routes/handyman");
const designerRoutes = require("./routes/designer");
const contractorRoutes = require("./routes/contractor");
const supplierRoutes = require("./routes/supplier");
const inquiryRoutes = require("./routes/inquiry");
const favoriteRoutes = require("./routes/favorite");
const bookingRoutes = require("./routes/booking");
const messageRoutes = require("./routes/message");
const searchHistoryRoutes = require("./routes/searchHistory");

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

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

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/handymen", handymanRoutes);
app.use("/designers", designerRoutes);
app.use("/contractors", contractorRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/inquiries", inquiryRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/bookings", bookingRoutes);
app.use("/messages", messageRoutes);
app.use("/searchHistories", searchHistoryRoutes);


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API is now online on port ${PORT}`);
  });
}

module.exports = { app, mongoose };