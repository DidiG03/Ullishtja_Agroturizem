const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      // Update reservation (typically status)
      const reservation = await prisma.reservation.update({
        where: { id },
        data: req.body,
      });
      res.json({ success: true, data: reservation });
    } else if (req.method === 'DELETE') {
      // Delete reservation
      await prisma.reservation.delete({
        where: { id }
      });
      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error with reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process reservation request' 
    });
  }
} 