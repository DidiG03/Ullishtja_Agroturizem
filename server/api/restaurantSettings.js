const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.restaurantSettings.findFirst();
    if (!settings) {
      settings = await prisma.restaurantSettings.create({ data: {} });
    }
    const operatingHours = JSON.parse(settings.operatingHours);
    const tableCapacity = JSON.parse(settings.tableCapacity);
    res.json({
      success: true,
      data: { ...settings, operatingHours, tableCapacity }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch settings' });
  }
});

// PUT update settings
router.put('/', async (req, res) => {
  try {
    const { operatingHours, tableCapacity, ...other } = req.body;
    let settings = await prisma.restaurantSettings.findFirst();
    if (!settings) {
      settings = await prisma.restaurantSettings.create({ data: {} });
    }
    const updated = await prisma.restaurantSettings.update({
      where: { id: settings.id },
      data: {
        ...other,
        operatingHours: operatingHours ? JSON.stringify(operatingHours) : settings.operatingHours,
        tableCapacity: tableCapacity ? JSON.stringify(tableCapacity) : settings.tableCapacity
      }
    });
    const parsedHours = JSON.parse(updated.operatingHours);
    const parsedCapacity = JSON.parse(updated.tableCapacity);
    res.json({ success: true, data: { ...updated, operatingHours: parsedHours, tableCapacity: parsedCapacity } });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update settings' });
  }
});

module.exports = router; 