const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking");
const { verify, verifyAdmin } = require("../middlewares/auth");

// user
router.get("/users/my-bookings", verify, bookingController.getMyBookings);
router.post("/users/bookings", verify, bookingController.createBooking);
router.get("/users/bookings/:id", verify, bookingController.getBookingById);
router.patch("/users/bookings/:id/cancel", verify, bookingController.cancelBooking);

// handyman
router.get("/handymen/bookings", verify, bookingController.getMyHandymanBookings);
router.get("/handymen/bookings/:id", verify, bookingController.getHandymanBookingById);
router.patch("/handymen/bookings/:id/confirm", verify, bookingController.confirmHandymanBooking);
router.patch("/handymen/bookings/:id/complete", verify, bookingController.completeHandymanBooking);
router.patch("/handymen/bookings/:id/cancel", verify, bookingController.cancelHandymanBooking);

// designer
router.get("/designers/bookings", verify, bookingController.getMyDesignerBookings);
router.get("/designers/bookings/:id", verify, bookingController.getDesignerBookingById);
router.patch("/designers/bookings/:id/confirm", verify, bookingController.confirmDesignerBooking);
router.patch("/designers/bookings/:id/complete", verify, bookingController.completeDesignerBooking);
router.patch("/designers/bookings/:id/cancel", verify, bookingController.cancelDesignerBooking);

// contractor
router.get("/contractors/bookings", verify, bookingController.getMyContractorBookings);
router.get("/contractors/bookings/:id", verify, bookingController.getContractorBookingById);
router.patch("/contractors/bookings/:id/confirm", verify, bookingController.confirmContractorBooking);
router.patch("/contractors/bookings/:id/complete", verify, bookingController.completeContractorBooking);
router.patch("/contractors/bookings/:id/cancel", verify, bookingController.cancelContractorBooking);

// supplier
router.get("/suppliers/bookings", verify, bookingController.getMySupplierBookings);
router.get("/suppliers/bookings/:id", verify, bookingController.getSupplierBookingById);
router.patch("/suppliers/bookings/:id/confirm", verify, bookingController.confirmSupplierBooking);
router.patch("/suppliers/bookings/:id/complete", verify, bookingController.completeSupplierBooking);
router.patch("/suppliers/bookings/:id/cancel", verify, bookingController.cancelSupplierBooking);

// admin
router.get("/bookings/all", verify, verifyAdmin, bookingController.getAllBookings);
router.get("/bookings/:id", verify, verifyAdmin, bookingController.getBookingAdminById);
router.patch("/bookings/:id/status", verify, verifyAdmin, bookingController.updateBookingStatus);
router.delete("/bookings/:id/delete", verify, verifyAdmin, bookingController.deleteBooking);

module.exports = router;