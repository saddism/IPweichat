const config = require('../config/config');

// Get all configurations of a specific type
async function getConfigs(req, res) {
  try {
    const { type } = req.params;
    const data = await config.getConfig(type);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Create or update a configuration
async function updateConfig(req, res) {
  try {
    const { type } = req.params;
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const data = await config.updateConfig(type, key, value);
    res.json({ message: 'Configuration updated successfully', data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// Delete a configuration
async function deleteConfig(req, res) {
  try {
    const { type, key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const data = await config.deleteConfig(type, key);
    res.json({ message: 'Configuration deleted successfully', data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  getConfigs,
  updateConfig,
  deleteConfig
};
