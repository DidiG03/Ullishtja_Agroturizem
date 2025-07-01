const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return empty array as fallback
      return [];
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
      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
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
      return await response.json();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return await response.json();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
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
      return await response.json();
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
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
      return await response.json();
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
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
      return await response.json();
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete menu item');
      return await response.json();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // Get complete menu structure
  async getCompleteMenu() {
    try {
      // Add a small delay to ensure server is ready
      await delay(100);
      const response = await fetch(`${API_BASE_URL}/api/menu/complete`);
      if (!response.ok) throw new Error('Failed to fetch complete menu');
      return await response.json();
    } catch (error) {
      console.error('Error fetching complete menu:', error);
      // Return empty array as fallback
      return [];
    }
  }

  // Bulk operations
  async reorderCategories(categoryOrders) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/categories/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: categoryOrders }),
      });
      if (!response.ok) throw new Error('Failed to reorder categories');
      return await response.json();
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  }

  async reorderMenuItems(itemOrders) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/menu/items/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: itemOrders }),
      });
      if (!response.ok) throw new Error('Failed to reorder menu items');
      return await response.json();
    } catch (error) {
      console.error('Error reordering menu items:', error);
      throw error;
    }
  }
}

export default new MenuService(); 