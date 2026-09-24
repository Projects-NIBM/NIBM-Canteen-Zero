const Joi = require('joi');

const productSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(10).max(200).required(),
    price: Joi.number().positive().required(),
    category: Joi.string().valid('Snacks', 'Main Meals', 'Beverages', 'Desserts').required(),
    prepTime: Joi.number().integer().min(1).max(60).required(),
    spiceLevel: Joi.number().integer().min(0).max(3).default(0),
    isVeg: Joi.boolean().default(false)
});

const validateProduct = (req, res, next) => {
    const productData = JSON.parse(req.body.data);
    const { error } = productSchema.validate(productData);
    if (error) return res.status(400).json({ message: error.details[0].message });
    next();
};

module.exports = { validateProduct };