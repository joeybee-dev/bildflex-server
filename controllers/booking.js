const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const PROVIDER_TYPES = ["Handyman", "Designer", "Contractor", "Supplier"];
const STATUS_TYPES = ["pending", "confirmed", "ongoing", "completed", "cancelled"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProviderBooking = async (bookingId, providerId, providerType) => {
  if (!isValidObjectId(bookingId)) {
    return { error: { code: 400, message: "Invalid booking ID." } };
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    providerId,
    providerType
  })
    .populate("userId", "-password")
    .populate("inquiryId");

  if (!booking) {
    return { error: { code: 404, message: "Booking not found." } };
  }

  return { booking };
};

// User: create booking
module.exports.createBooking = async (req, res) => {
  try {
    const {
      providerId,
      providerType,
      inquiryId,
      serviceTitle,
      serviceDescription,
      bookingDate,
      notes
    } = req.body;

    if (!providerId || !providerType || !serviceTitle || !bookingDate) {
      return res.status(400).send({
        error: "Provider ID, provider type, service title, and booking date are required."
      });
    }

    if (!isValidObjectId(providerId)) {
      return res.status(400).send({ error: "Invalid provider ID." });
    }

    if (!PROVIDER_TYPES.includes(providerType)) {
      return res.status(400).send({ error: "Invalid provider type." });
    }

    if (inquiryId && !isValidObjectId(inquiryId)) {
      return res.status(400).send({ error: "Invalid inquiry ID." });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      providerId,
      providerType,
      inquiryId: inquiryId || null,
      serviceTitle,
      serviceDescription,
      bookingDate,
      notes
    });

    return res.status(201).send({
      message: "Booking created successfully.",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).send({
      error: error.message || "Failed to create booking."
    });
  }
};

// User: get my bookings
module.exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate("inquiryId")
      .sort({ createdAt: -1 });

    return res.status(200).send({ bookings });
  } catch (error) {
    console.error("Get my bookings error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch bookings."
    });
  }
};

// User: get one booking by id
module.exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid booking ID." });
    }

    const booking = await Booking.findOne({
      _id: id,
      userId: req.user.id
    }).populate("inquiryId");

    if (!booking) {
      return res.status(404).send({ error: "Booking not found." });
    }

    return res.status(200).send({ booking });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch booking."
    });
  }
};

// User: cancel booking
module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid booking ID." });
    }

    const booking = await Booking.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!booking) {
      return res.status(404).send({ error: "Booking not found." });
    }

    if (booking.status === "completed") {
      return res.status(400).send({
        error: "Completed bookings cannot be cancelled."
      });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.status(200).send({
      message: "Booking cancelled successfully.",
      booking
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).send({
      error: error.message || "Failed to cancel booking."
    });
  }
};

// Shared provider helpers
const getMyProviderBookings = async (req, res, providerType) => {
  try {
    const bookings = await Booking.find({
      providerId: req.user.id,
      providerType
    })
      .populate("userId", "-password")
      .populate("inquiryId")
      .sort({ createdAt: -1 });

    return res.status(200).send({ bookings });
  } catch (error) {
    console.error(`Get ${providerType} bookings error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to fetch ${providerType.toLowerCase()} bookings.`
    });
  }
};

const getProviderBookingById = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const result = await getProviderBooking(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    return res.status(200).send({ booking: result.booking });
  } catch (error) {
    console.error(`Get ${providerType} booking by ID error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to fetch ${providerType.toLowerCase()} booking.`
    });
  }
};

const confirmProviderBooking = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const result = await getProviderBooking(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    if (result.booking.status === "cancelled" || result.booking.status === "completed") {
      return res.status(400).send({
        error: "This booking can no longer be confirmed."
      });
    }

    result.booking.status = "confirmed";
    await result.booking.save();

    return res.status(200).send({
      message: "Booking confirmed successfully.",
      booking: result.booking
    });
  } catch (error) {
    console.error(`Confirm ${providerType} booking error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to confirm ${providerType.toLowerCase()} booking.`
    });
  }
};

const completeProviderBooking = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const result = await getProviderBooking(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    if (result.booking.status === "cancelled") {
      return res.status(400).send({
        error: "Cancelled bookings cannot be completed."
      });
    }

    result.booking.status = "completed";
    await result.booking.save();

    return res.status(200).send({
      message: "Booking completed successfully.",
      booking: result.booking
    });
  } catch (error) {
    console.error(`Complete ${providerType} booking error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to complete ${providerType.toLowerCase()} booking.`
    });
  }
};

const cancelProviderBooking = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const result = await getProviderBooking(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    if (result.booking.status === "completed") {
      return res.status(400).send({
        error: "Completed bookings cannot be cancelled."
      });
    }

    result.booking.status = "cancelled";
    await result.booking.save();

    return res.status(200).send({
      message: "Booking cancelled successfully.",
      booking: result.booking
    });
  } catch (error) {
    console.error(`Cancel ${providerType} booking error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to cancel ${providerType.toLowerCase()} booking.`
    });
  }
};

// Handyman
module.exports.getMyHandymanBookings = async (req, res) =>
  getMyProviderBookings(req, res, "Handyman");

module.exports.getHandymanBookingById = async (req, res) =>
  getProviderBookingById(req, res, "Handyman");

module.exports.confirmHandymanBooking = async (req, res) =>
  confirmProviderBooking(req, res, "Handyman");

module.exports.completeHandymanBooking = async (req, res) =>
  completeProviderBooking(req, res, "Handyman");

module.exports.cancelHandymanBooking = async (req, res) =>
  cancelProviderBooking(req, res, "Handyman");

// Designer
module.exports.getMyDesignerBookings = async (req, res) =>
  getMyProviderBookings(req, res, "Designer");

module.exports.getDesignerBookingById = async (req, res) =>
  getProviderBookingById(req, res, "Designer");

module.exports.confirmDesignerBooking = async (req, res) =>
  confirmProviderBooking(req, res, "Designer");

module.exports.completeDesignerBooking = async (req, res) =>
  completeProviderBooking(req, res, "Designer");

module.exports.cancelDesignerBooking = async (req, res) =>
  cancelProviderBooking(req, res, "Designer");

// Contractor
module.exports.getMyContractorBookings = async (req, res) =>
  getMyProviderBookings(req, res, "Contractor");

module.exports.getContractorBookingById = async (req, res) =>
  getProviderBookingById(req, res, "Contractor");

module.exports.confirmContractorBooking = async (req, res) =>
  confirmProviderBooking(req, res, "Contractor");

module.exports.completeContractorBooking = async (req, res) =>
  completeProviderBooking(req, res, "Contractor");

module.exports.cancelContractorBooking = async (req, res) =>
  cancelProviderBooking(req, res, "Contractor");

// Supplier
module.exports.getMySupplierBookings = async (req, res) =>
  getMyProviderBookings(req, res, "Supplier");

module.exports.getSupplierBookingById = async (req, res) =>
  getProviderBookingById(req, res, "Supplier");

module.exports.confirmSupplierBooking = async (req, res) =>
  confirmProviderBooking(req, res, "Supplier");

module.exports.completeSupplierBooking = async (req, res) =>
  completeProviderBooking(req, res, "Supplier");

module.exports.cancelSupplierBooking = async (req, res) =>
  cancelProviderBooking(req, res, "Supplier");

// Admin: get all bookings
module.exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "-password")
      .populate("inquiryId")
      .sort({ createdAt: -1 });

    return res.status(200).send({ bookings });
  } catch (error) {
    console.error("Get all bookings error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch bookings."
    });
  }
};

// Admin: get one booking
module.exports.getBookingAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid booking ID." });
    }

    const booking = await Booking.findById(id)
      .populate("userId", "-password")
      .populate("inquiryId");

    if (!booking) {
      return res.status(404).send({ error: "Booking not found." });
    }

    return res.status(200).send({ booking });
  } catch (error) {
    console.error("Get booking admin by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch booking."
    });
  }
};

// Admin: update status
module.exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid booking ID." });
    }

    if (!STATUS_TYPES.includes(status)) {
      return res.status(400).send({ error: "Invalid booking status." });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).send({ error: "Booking not found." });
    }

    return res.status(200).send({
      message: "Booking status updated successfully.",
      booking
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update booking status."
    });
  }
};

// Admin: delete booking
module.exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid booking ID." });
    }

    const deletedBooking = await Booking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return res.status(404).send({ error: "Booking not found." });
    }

    return res.status(200).send({
      message: "Booking deleted successfully."
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete booking."
    });
  }
};