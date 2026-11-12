const joi = require("joi");

const authSchema = {
    register: joi.object({
        email: joi.string().trim().lowercase().required().email(),
        password: joi.string().required().min(8).max(32),
        userName: joi.string().required().trim().min(3).max(8),
        phoneNumber: joi.string().required()
    }),

    login: joi.object({
        email: joi.string().trim().lowercase().required().email(),
        password: joi.string().required().min(8).max(32)
    }),
    verifiedEmail: joi.object({
        email: joi.string().trim().lowercase().required().email(),
        otp: joi.string().required().min(6).max(6)
    }),
    resendOtp: joi.object({
        email: joi.string().trim().lowercase().required().email(),
    })
};

const validateBody = (schemaName) => {
    const schema = authSchema[schemaName];
    if (!schema) {
        throw new Error(`Invalid schema name: ${schemaName}`);
    }

    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: false,
        });

        if (error) {
            const details = error.details.map((d) => d.message);
            return res.status(400).json({
                success: false,
                error: details,
                message: details[0],
            });
        }

        req.body = value;
        next();
    };
};

module.exports = validateBody;
module.exports.validateBody = validateBody;
module.exports.authSchema = authSchema;
