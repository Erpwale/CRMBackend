// User Registration for Training
const WorkshopRegistration = require("../models/WorkshopRegistration");
const Training = require("../models/Training");
router.post("/register", async (req, res) => {
  try {
    const {
      trainingId,
      fullName,
      email,
      companyName,
      serialNumber,
      participantCount,
    } = req.body;

    // Find training
    const training = await Training.findById(trainingId);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    // Count already registered participants
    const registrations = await WorkshopRegistration.find({ trainingId });

    const currentParticipants = registrations.reduce(
      (total, reg) => total + Number(reg.participantCount || 1),
      0
    );

    const requestedParticipants = Number(participantCount || 1);

    // Check available seats
    if (currentParticipants + requestedParticipants > training.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: `Registration is full. Only ${
          training.maxParticipants - currentParticipants
        } seat(s) left.`,
      });
    }

    // Optional: Prevent duplicate registration by email
    const existingRegistration = await WorkshopRegistration.findOne({
      trainingId,
      email,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You have already registered for this training.",
      });
    }

    // Save registration
    const registration = await WorkshopRegistration.create({
      trainingId,
      fullName,
      email,
      companyName,
      serialNumber,
      participantCount: requestedParticipants,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: registration,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});