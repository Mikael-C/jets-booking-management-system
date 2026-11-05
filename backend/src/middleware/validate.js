const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/"/g, "'"),
        })),
      });
    }

    req[property] = value;
    next();
  };
};

// Common Joi schemas reused across routes
const schemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

  flightLeg: Joi.object({
    from: Joi.string().required(),
    fromIcao: Joi.string().uppercase().min(3).max(4).required(),
    to: Joi.string().required(),
    toIcao: Joi.string().uppercase().min(3).max(4).required(),
    departureDate: Joi.string().required(),
    departureTime: Joi.string().optional().allow(''),
    paxCount: Joi.number().integer().min(1).max(50).required(),
    flightTimeMinutes: Joi.number().optional(),
    distanceNm: Joi.number().optional(),
    notes: Joi.string().optional().allow(''),
  }),

  clientDetails: Joi.object({
    fullName: Joi.string().required(),
    companyName: Joi.string().optional().allow(''),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().allow(''),
    address: Joi.string().optional().allow(''),
    vatNumber: Joi.string().optional().allow(''),
    accountNumber: Joi.string().optional().allow(''),
  }),

  pricingBreakdown: Joi.object({
    currency: Joi.string().default('USD'),
    baseCharterCost: Joi.number().min(0).required(),
    fuelSurcharge: Joi.number().min(0).default(0),
    landingFees: Joi.number().min(0).default(0),
    handlingFees: Joi.number().min(0).default(0),
    cateringCost: Joi.number().min(0).default(0),
    crewCost: Joi.number().min(0).default(0),
    repositioningFee: Joi.number().min(0).default(0),
    additionalServicesCost: Joi.number().min(0).default(0),
    subtotal: Joi.number().min(0).required(),
    adminMargin: Joi.number().min(0).default(0),
    agentMargin: Joi.number().min(0).default(0),
    totalBeforeTax: Joi.number().min(0).required(),
    vatAmount: Joi.number().min(0).default(0),
    totalAmount: Joi.number().min(0).required(),
    cardFee: Joi.number().min(0).default(0),
    grandTotal: Joi.number().min(0).required(),
  }),
};

module.exports = { validate, schemas };
