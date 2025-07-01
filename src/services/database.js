import prisma from '../lib/prisma.js';

// Reservation Services
export const reservationService = {
  // Create a new reservation
  async create(reservationData) {
    try {
      const reservation = await prisma.reservation.create({
        data: {
          ...reservationData,
          date: new Date(reservationData.date),
        },
      });
      return { success: true, data: reservation };
    } catch (error) {
      console.error('Error creating reservation:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all reservations with pagination and filtering
  async getAll(options = {}) {
    try {
      const { page = 1, limit = 10, status, date } = options;
      const skip = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (date) {
        where.date = {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
        };
      }

      const [reservations, total] = await Promise.all([
        prisma.reservation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.reservation.count({ where }),
      ]);

      return {
        success: true,
        data: reservations,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return { success: false, error: error.message };
    }
  },

  // Update reservation status
  async updateStatus(id, status) {
    try {
      const reservation = await prisma.reservation.update({
        where: { id },
        data: { status },
      });
      return { success: true, data: reservation };
    } catch (error) {
      console.error('Error updating reservation:', error);
      return { success: false, error: error.message };
    }
  },

  // Get reservation statistics
  async getStats() {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

      const [total, pending, thisMonth, thisWeek] = await Promise.all([
        prisma.reservation.count(),
        prisma.reservation.count({ where: { status: 'PENDING' } }),
        prisma.reservation.count({
          where: { createdAt: { gte: startOfMonth } }
        }),
        prisma.reservation.count({
          where: { createdAt: { gte: startOfWeek } }
        }),
      ]);

      return {
        success: true,
        data: { total, pending, thisMonth, thisWeek },
      };
    } catch (error) {
      console.error('Error fetching reservation stats:', error);
      return { success: false, error: error.message };
    }
  },
};

// Menu Services
export const menuService = {
  // Get all categories with items
  async getFullMenu() {
    try {
      const categories = await prisma.menuCategory.findMany({
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      });
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error fetching menu:', error);
      return { success: false, error: error.message };
    }
  },

  // Create menu item
  async createItem(itemData) {
    try {
      const item = await prisma.menuItem.create({
        data: itemData,
        include: { category: true },
      });
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Update menu item
  async updateItem(id, itemData) {
    try {
      const item = await prisma.menuItem.update({
        where: { id },
        data: itemData,
        include: { category: true },
      });
      return { success: true, data: item };
    } catch (error) {
      console.error('Error updating menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Create category
  async createCategory(categoryData) {
    try {
      const category = await prisma.menuCategory.create({
        data: categoryData,
      });
      return { success: true, data: category };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  },
};

// Restaurant Settings Service
export const settingsService = {
  // Get restaurant settings
  async get() {
    try {
      let settings = await prisma.restaurantSettings.findFirst();
      
      // Create default settings if none exist
      if (!settings) {
        settings = await prisma.restaurantSettings.create({
          data: {}, // Will use schema defaults
        });
      }
      
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error: error.message };
    }
  },

  // Update restaurant settings
  async update(settingsData) {
    try {
      const settings = await prisma.restaurantSettings.upsert({
        where: { id: settingsData.id || 'default' },
        update: settingsData,
        create: settingsData,
      });
      return { success: true, data: settings };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  },
};

// Customer Service
export const customerService = {
  // Create or update customer
  async upsert(customerData) {
    try {
      const customer = await prisma.customer.upsert({
        where: { email: customerData.email },
        update: {
          ...customerData,
          totalVisits: { increment: 1 },
          lastVisit: new Date(),
        },
        create: {
          ...customerData,
          totalVisits: 1,
          lastVisit: new Date(),
        },
      });
      return { success: true, data: customer };
    } catch (error) {
      console.error('Error upserting customer:', error);
      return { success: false, error: error.message };
    }
  },
};

// Reviews Service
export const reviewService = {
  // Get all reviews
  async getAll(options = {}) {
    try {
      const { status, limit = 10 } = options;
      
      const where = {};
      if (status) where.status = status;

      const reviews = await prisma.review.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: reviews };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { success: false, error: error.message };
    }
  },

  // Create review
  async create(reviewData) {
    try {
      const review = await prisma.review.create({
        data: reviewData,
      });
      return { success: true, data: review };
    } catch (error) {
      console.error('Error creating review:', error);
      return { success: false, error: error.message };
    }
  },

  // Update review status
  async updateStatus(id, status, reply = null) {
    try {
      const review = await prisma.review.update({
        where: { id },
        data: { status, reply },
      });
      return { success: true, data: review };
    } catch (error) {
      console.error('Error updating review:', error);
      return { success: false, error: error.message };
    }
  },
};

// Admin Activity Logger
export const activityService = {
  async log(adminId, adminName, action, entityType, entityId = null, details = null) {
    try {
      const activity = await prisma.adminActivity.create({
        data: {
          adminId,
          adminName,
          action,
          entityType,
          entityId,
          details: details ? JSON.stringify(details) : null,
        },
      });
      return { success: true, data: activity };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }
  },

  async getRecent(limit = 20) {
    try {
      const activities = await prisma.adminActivity.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return { success: true, data: activities };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: error.message };
    }
  },
}; 