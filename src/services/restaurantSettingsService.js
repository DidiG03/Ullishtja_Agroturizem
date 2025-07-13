class RestaurantSettingsService {
  constructor() {
    this.baseUrl = '/api/restaurant-settings';
  }

  async getSettings() {
    try {
      const response = await fetch(this.baseUrl);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch settings');
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
      throw error;
    }
  }

  async updateSettings(settingsData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }
      
      return result;
    } catch (error) {
      console.error('Error updating restaurant settings:', error);
      throw error;
    }
  }

  // Helper method to validate settings data
  validateSettings(settings) {
    const errors = [];
    
    if (!settings.restaurantName) {
      errors.push('Restaurant name is required');
    }
    
    if (!settings.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!settings.phone) {
      errors.push('Phone number is required');
    }
    
    // Validate operating hours
    if (settings.operatingHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        const dayHours = settings.operatingHours[day];
        if (dayHours && !dayHours.closed) {
          if (!dayHours.open || !dayHours.close) {
            errors.push(`${day.charAt(0).toUpperCase() + day.slice(1)} hours are incomplete`);
          }
          if (dayHours.open >= dayHours.close) {
            errors.push(`${day.charAt(0).toUpperCase() + day.slice(1)} opening time must be before closing time`);
          }
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const restaurantSettingsService = new RestaurantSettingsService();
export default restaurantSettingsService; 