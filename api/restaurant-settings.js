import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get restaurant settings
      let settings = await prisma.restaurantSettings.findFirst();
      
      // If no settings exist, create default settings
      if (!settings) {
        settings = await prisma.restaurantSettings.create({
          data: {
            // Default values are defined in the schema
          }
        });
      }
      
      // Parse the JSON fields
      const operatingHours = JSON.parse(settings.operatingHours);
      const tableCapacity = JSON.parse(settings.tableCapacity);
      
      res.json({
        success: true,
        data: {
          ...settings,
          operatingHours,
          tableCapacity
        }
      });
    } else if (req.method === 'PUT') {
      // Update restaurant settings
      const { operatingHours, tableCapacity, ...otherData } = req.body;
      
      // First, get or create settings
      let settings = await prisma.restaurantSettings.findFirst();
      
      if (!settings) {
        settings = await prisma.restaurantSettings.create({
          data: {
            // Default values are defined in the schema
          }
        });
      }
      
      // Prepare update data
      const updateData = {
        ...otherData,
        operatingHours: operatingHours ? JSON.stringify(operatingHours) : settings.operatingHours,
        tableCapacity: tableCapacity ? JSON.stringify(tableCapacity) : settings.tableCapacity
      };
      
      // Update settings
      const updatedSettings = await prisma.restaurantSettings.update({
        where: { id: settings.id },
        data: updateData
      });
      
      // Parse the JSON fields for response
      const parsedOperatingHours = JSON.parse(updatedSettings.operatingHours);
      const parsedTableCapacity = JSON.parse(updatedSettings.tableCapacity);
      
      res.json({
        success: true,
        data: {
          ...updatedSettings,
          operatingHours: parsedOperatingHours,
          tableCapacity: parsedTableCapacity
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with restaurant settings:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process restaurant settings request' 
    });
  } finally {
    await prisma.$disconnect();
  }
} 