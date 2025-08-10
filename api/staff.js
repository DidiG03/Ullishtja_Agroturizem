// Staff API - CRUD for staff members used by the POS
// GET /api/staff[?active=true]
// POST /api/staff
// PUT /api/staff?id={id}
// DELETE /api/staff?id={id}

import prisma from '../src/lib/prisma.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { id, active } = req.query || {};

      if (id) {
        const staff = await prisma.staff.findUnique({ where: { id } });
        if (!staff) {
          return res.status(404).json({ success: false, error: 'Staff not found' });
        }
        return res.status(200).json({ success: true, data: staff });
      }

      const where = {};
      if (active !== undefined) {
        const val = String(active).toLowerCase();
        where.isActive = val === 'true' || val === '1' || val === 'yes';
      }

      const staffList = await prisma.staff.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
      });

      return res.status(200).json({ success: true, data: staffList });
    }

    if (req.method === 'POST') {
      const { firstName, lastName, posPin, isActive = true } = req.body || {};

      if (!firstName || !lastName || !posPin) {
        return res.status(400).json({
          success: false,
          error: 'firstName, lastName and posPin are required'
        });
      }

      // Ensure PIN is unique
      const existing = await prisma.staff.findUnique({ where: { posPin } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'POS PIN already in use' });
      }

      const created = await prisma.staff.create({
        data: { firstName, lastName, posPin, isActive: Boolean(isActive) }
      });
      return res.status(201).json({ success: true, data: created });
    }

    if (req.method === 'PUT') {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'id is required' });
      }

      const { firstName, lastName, posPin, isActive } = req.body || {};
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (posPin !== undefined) {
        // Check uniqueness if changing PIN
        const existing = await prisma.staff.findUnique({ where: { posPin } });
        if (existing && existing.id !== id) {
          return res.status(400).json({ success: false, error: 'POS PIN already in use' });
        }
        updateData.posPin = posPin;
      }

      const updated = await prisma.staff.update({ where: { id }, data: updateData });
      return res.status(200).json({ success: true, data: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'id is required' });
      }
      await prisma.staff.delete({ where: { id } });
      return res.status(200).json({ success: true, message: 'Staff deleted successfully' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Staff API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}


