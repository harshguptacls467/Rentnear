const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// Public Routes
router.get('/', productController.getAllProducts);
router.get('/nearby', productController.getNearbyProducts);
router.get('/:id', productController.getProductById);

// Protected Routes
router.post('/', auth, productController.createProduct);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;
