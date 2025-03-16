export const RegistrationStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  WAITLISTED: "waitlisted",
};

export const PaymentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export const RegistrationSteps = {
  BASIC: "basic",
  PAYMENT: "payment",
  COMPLETED: "completed",
};

export const EmailStatus = {
  NOT_SENT: "not_sent",
  SENT: "sent",
  FAILED: "failed",
};

export const EventCodes = {
  TALSUTRA: "TALSUTRA",
  SHADE_SHIFTERS: "SHADE SHIFTERS",
  // ... add other event codes
};

export const EmailTemplateTypes = {
  APPROVAL: "registration_approval",
  REJECTION: "registration_rejection",
  PAYMENT_REMINDER: "payment_reminder",
  EVENT_UPDATE: "event_update",
  WELCOME: "welcome_message",
};

export const EmailTemplateVariables = {
  NAME: "name",
  EVENT: "event",
  EVENT_DATE: "eventDate",
  EVENT_TIME: "eventTime",
  EVENT_LOCATION: "eventLocation",
  COLLEGE: "college",
  TEAM_SIZE: "teamSize",
  REJECTION_REASON: "reason",
  PAYMENT_STATUS: "paymentStatus",
  REGISTRATION_ID: "registrationId",
};
