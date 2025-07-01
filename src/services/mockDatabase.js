// Mock Database Service for Browser Environment
// This replaces the Prisma-based database service for frontend-only usage

const STORAGE_KEYS = {
  RESERVATIONS: 'ullishtja_reservations',
  CUSTOMERS: 'ullishtja_customers',
  SETTINGS: 'ullishtja_settings',
  MENU: 'ullishtja_menu',
  REVIEWS: 'ullishtja_reviews',
  ACTIVITIES: 'ullishtja_activities'
};

// Utility functions
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage for key ${key}:`, error);
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error);
    return false;
  }
};

// Initialize with sample data if empty
const initializeSampleData = () => {
  const reservations = getFromStorage(STORAGE_KEYS.RESERVATIONS);
  if (reservations.length === 0) {
    const sampleReservations = [
      {
        id: generateId(),
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+355 69 123 4567',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: 4,
        specialRequests: 'Vegetarian options preferred',
        status: 'PENDING',
        clerkUserId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        name: 'Maria Rossi',
        email: 'maria@example.com',
        phone: '+355 69 987 6543',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '20:00',
        guests: 2,
        specialRequests: null,
        status: 'CONFIRMED',
        clerkUserId: null,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        updatedAt: new Date().toISOString()
      },
      {
        id: generateId(),
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        phone: '+355 69 555 1234',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        time: '18:30',
        guests: 6,
        specialRequests: 'Birthday celebration',
        status: 'COMPLETED',
        clerkUserId: null,
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    saveToStorage(STORAGE_KEYS.RESERVATIONS, sampleReservations);
  }
};

// Initialize sample data
initializeSampleData();

// Reservation Services
export const reservationService = {
  // Create a new reservation
  async create(reservationData) {
    try {
      const reservations = getFromStorage(STORAGE_KEYS.RESERVATIONS);
      const newReservation = {
        id: generateId(),
        ...reservationData,
        date: new Date(reservationData.date).toISOString().split('T')[0],
        status: 'PENDING',
        clerkUserId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      reservations.unshift(newReservation);
      saveToStorage(STORAGE_KEYS.RESERVATIONS, reservations);
      
      return { success: true, data: newReservation };
    } catch (error) {
      console.error('Error creating reservation:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all reservations with pagination and filtering
  async getAll(options = {}) {
    try {
      const { page = 1, limit = 100, status, date } = options;
      let reservations = getFromStorage(STORAGE_KEYS.RESERVATIONS);

      // Apply filters
      if (status) {
        reservations = reservations.filter(r => r.status === status);
      }
      if (date) {
        const filterDate = new Date(date).toISOString().split('T')[0];
        reservations = reservations.filter(r => r.date === filterDate);
      }

      // Sort by creation date (newest first)
      reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const skip = (page - 1) * limit;
      const paginatedReservations = reservations.slice(skip, skip + limit);

      return {
        success: true,
        data: paginatedReservations,
        pagination: {
          total: reservations.length,
          page,
          limit,
          pages: Math.ceil(reservations.length / limit),
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
      const reservations = getFromStorage(STORAGE_KEYS.RESERVATIONS);
      const reservationIndex = reservations.findIndex(r => r.id === id);
      
      if (reservationIndex === -1) {
        throw new Error('Reservation not found');
      }

      reservations[reservationIndex].status = status;
      reservations[reservationIndex].updatedAt = new Date().toISOString();
      
      saveToStorage(STORAGE_KEYS.RESERVATIONS, reservations);
      
      return { success: true, data: reservations[reservationIndex] };
    } catch (error) {
      console.error('Error updating reservation:', error);
      return { success: false, error: error.message };
    }
  },

  // Get reservation statistics
  async getStats() {
    try {
      const reservations = getFromStorage(STORAGE_KEYS.RESERVATIONS);
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

      const stats = {
        total: reservations.length,
        pending: reservations.filter(r => r.status === 'PENDING').length,
        confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
        completed: reservations.filter(r => r.status === 'COMPLETED').length,
        cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
        thisMonth: reservations.filter(r => 
          new Date(r.createdAt) >= startOfMonth
        ).length,
        thisWeek: reservations.filter(r => 
          new Date(r.createdAt) >= startOfWeek
        ).length,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error fetching reservation stats:', error);
      return { success: false, error: error.message };
    }
  },
};

// Customer Services
export const customerService = {
  // Create or update customer
  async upsert(customerData) {
    try {
      const customers = getFromStorage(STORAGE_KEYS.CUSTOMERS);
      const existingIndex = customers.findIndex(c => c.email === customerData.email);
      
      if (existingIndex !== -1) {
        // Update existing customer
        customers[existingIndex] = {
          ...customers[existingIndex],
          ...customerData,
          totalVisits: (customers[existingIndex].totalVisits || 0) + 1,
          lastVisit: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
        return { success: true, data: customers[existingIndex] };
      } else {
        // Create new customer
        const newCustomer = {
          id: generateId(),
          ...customerData,
          totalVisits: 1,
          lastVisit: new Date().toISOString(),
          preferences: JSON.stringify({}),
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        customers.push(newCustomer);
        saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
        return { success: true, data: newCustomer };
      }
    } catch (error) {
      console.error('Error upserting customer:', error);
      return { success: false, error: error.message };
    }
  }
};

// Menu Services (simplified)
export const menuService = {
  async getFullMenu() {
    return { success: true, data: [] };
  },
  async createItem(itemData) {
    return { success: true, data: itemData };
  },
  async updateItem(id, itemData) {
    return { success: true, data: itemData };
  },
  async createCategory(categoryData) {
    return { success: true, data: categoryData };
  }
};

// Settings Services (simplified)
export const settingsService = {
  async get() {
    const settings = getFromStorage(STORAGE_KEYS.SETTINGS);
    return { 
      success: true, 
      data: settings.length > 0 ? settings[0] : {
        id: 'default',
        restaurantName: 'Ullishtja Agriturizem',
        email: 'info@ullishtja.com',
        phone: '+355 XX XXX XXX'
      }
    };
  },
  async update(settingsData) {
    saveToStorage(STORAGE_KEYS.SETTINGS, [settingsData]);
    return { success: true, data: settingsData };
  }
};

// Review Services (simplified)
export const reviewService = {
  async getAll() {
    return { success: true, data: [] };
  },
  async create(reviewData) {
    return { success: true, data: reviewData };
  },
  async updateStatus(id, status) {
    return { success: true, data: { id, status } };
  }
};

// Activity Services (simplified)
export const activityService = {
  async log(adminId, adminName, action, entityType, entityId, details) {
    return { success: true };
  },
  async getRecent(limit = 20) {
    return { success: true, data: [] };
  }
}; 