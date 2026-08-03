const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, rules } = require('../middleware/validate');

// ── Public Routes (no auth required) ──────────────────────────────────────────
router.get('/', productController.getAllProducts);
router.get('/nearby', productController.getNearbyProducts);
router.get('/pricing-recommendation', productController.getPricingRecommendation);
router.post('/ai-recommend', productController.getAiProductRecommendation);
router.get('/:id', productController.getProductById);

// Shared body validation rules for creating/updating a product
const productBodyRules = {
  price_per_day: [rules.positiveNumber('price_per_day')],
  deposit_amount: [rules.positiveNumber('deposit_amount')],
};

// ── Authenticated Routes (owner must be verified) ──────────────────────────────
router.post(
  '/',
  authenticate,
  validate({
    body: {
      title:        [rules.required('title'),        rules.nonEmptyString('title')],
      category:     [rules.required('category'),     rules.nonEmptyString('category')],
      price_per_day:[rules.required('price_per_day'), rules.positiveNumber('price_per_day')],
      ...productBodyRules,
    },
  }),
  productController.createProduct
);

// PUT allows partial updates — all fields optional but must be valid if provided
router.put(
  '/:id',
  authenticate,
  validate({ body: productBodyRules }),
  productController.updateProduct
);

router.delete('/:id', authenticate, productController.deleteProduct);

module.exports = router;
