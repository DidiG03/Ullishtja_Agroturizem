// Use relative paths for production, localhost for development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Add a delay to ensure server is ready
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class MenuService {
  // Categories
  async getCategories() {
    try {
      // Add a small delay to ensure server is ready
      await delay(100);
      const response = await fetch(`${API_BASE_URL}/api/menu/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const categories = await response.json();
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { success: false, error: error.message };
    }
  }

  async createCategory(categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error('Failed to create category');
      const category = await response.json();
      return { success: true, data: category };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) throw new Error('Failed to update category');
      const category = await response.json();
      return { success: true, data: category };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteCategory(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: error.message };
    }
  }

  // Menu Items
  async getMenuItems(categoryId = null) {
    try {
      const url = categoryId 
        ? `${API_BASE_URL}/api/menu/items?categoryId=${categoryId}`
        : `${API_BASE_URL}/api/menu/items`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const items = await response.json();
      return { success: true, data: items };
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return { success: false, error: error.message };
    }
  }

  async createMenuItem(itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Failed to create menu item');
      const item = await response.json();
      return { success: true, data: item };
    } catch (error) {
      console.error('Error creating menu item:', error);
      return { success: false, error: error.message };
    }
  }

  async updateMenuItem(id, itemData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) throw new Error('Failed to update menu item');
      const item = await response.json();
      return { success: true, data: item };
    } catch (error) {
      console.error('Error updating menu item:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteMenuItem(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete menu item');
      return { success: true };
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return { success: false, error: error.message };
    }
  }

  // Get complete menu structure
  async getCompleteMenu() {
    try {
      // Add a small delay to ensure server is ready
      await delay(100);
      const response = await fetch(`${API_BASE_URL}/api/menu/complete`);
      if (!response.ok) throw new Error('Failed to fetch complete menu');
      const categories = await response.json();
      return { success: true, data: categories };
    } catch (error) {
      console.error('Error fetching complete menu:', error);
      return { success: false, error: error.message };
    }
  }

  // Note: The server API doesn't have reorder endpoints, so these are disabled for now
  async reorderCategories(categoryOrders) {
    console.warn('Category reordering not implemented on server');
    return { success: false, error: 'Feature not implemented' };
  }

  async reorderMenuItems(itemOrders) {
    console.warn('Menu item reordering not implemented on server');
    return { success: false, error: 'Feature not implemented' };
  }
}

const menuService = new MenuService();
export default menuService; 