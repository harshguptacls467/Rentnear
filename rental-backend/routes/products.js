const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public Routes
router.get('/', productController.getAllProducts);
router.get('/nearby', productController.getNearbyProducts);
router.get('/:id', productController.getProductById);

// Product Management Routes
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
