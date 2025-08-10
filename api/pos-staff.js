// POS Staff API - Optimized JSON for POS/Electron apps
// GET /api/pos-staff?includeInactive=false

import prisma from '../src/lib/prisma.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { includeInactive = 'false' } = req.query || {};
  const includeInactiveBool = ['true', '1', 'yes'].includes(String(includeInactive).toLowerCase());

  try {
    const staff = await prisma.staff.findMany({
      where: includeInactiveBool ? undefined : { isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const data = staff.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      fullName: `${s.firstName} ${s.lastName}`.trim(),
      posPin: s.posPin,
      isActive: s.isActive,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, source: 'pos-staff', updatedAt: new Date().toISOString(), data });
  } catch (error) {
    console.error('POS Staff API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}


