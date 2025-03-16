import { Registration } from "../models/registration.model.js";
import { EventData } from "../types/registration.types.js";

export const createRegistration = async (req, res) => {
  try {
    const {
      eventTitle,
      email,
      whatsappNumber,
      alternatePhone,
      college,
      upiTransectionId,
      paySS,
      participantNames,
    } = req.body;

    // Validate event exists
    const eventConfig = Object.values(EventData).find(
      (event) => event.title === eventTitle
    );
    if (!eventConfig) {
      return res.status(400).json({
        success: false,
        message: "Invalid event",
      });
    }

    // Validate team size
    if (
      participantNames.length < eventConfig.teamSize.min ||
      participantNames.length > eventConfig.teamSize.max
    ) {
      return res.status(400).json({
        success: false,
        message: `Team size must be between ${eventConfig.teamSize.min} and ${eventConfig.teamSize.max}`,
      });
    }

    const registration = await Registration.create({
      eventTitle,
      email,
      whatsappNumber,
      alternatePhone,
      college,
      upiTransactionId: upiTransectionId,
      paymentScreenshotUrl: paySS,
      participantNames,
    });

    return res.status(201).json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create registration",
    });
  }
};
