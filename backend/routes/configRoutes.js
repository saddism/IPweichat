const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Get all configurations of a type (apiKeys, prompts, writingStyles)
router.get('/:type', configController.getConfigs);

// Create or update a configuration
router.post('/:type', configController.updateConfig);

// Delete a configuration
router.delete('/:type/:key', configController.deleteConfig);

module.exports = router;
