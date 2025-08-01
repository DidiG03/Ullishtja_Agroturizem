// Input validation utilities for production security

export const sanitizeString = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove control characters
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-numeric characters except + and spaces
  return phone.replace(/[^+\d\s-()]/g, '').trim();
};

export const validateReservationData = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (data.name && data.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  // Email validation
  const sanitizedEmail = sanitizeEmail(data.email);
  if (!sanitizedEmail) {
    errors.push('Valid email address is required');
  }
  
  // Phone validation
  const sanitizedPhone = sanitizePhone(data.phone);
  if (!sanitizedPhone || sanitizedPhone.length < 8) {
    errors.push('Valid phone number is required');
  }
  
  // Guests validation
  const guests = parseInt(data.guests);
  if (isNaN(guests) || guests < 1 || guests > 20) {
    errors.push('Number of guests must be between 1 and 20');
  }
  
  // Date validation
  const reservationDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (reservationDate < today) {
    errors.push('Reservation date cannot be in the past');
  }
  
  // Time validation
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(data.time)) {
    errors.push('Invalid time format');
  }
  
  // Special requests validation
  if (data.specialRequests && data.specialRequests.length > 500) {
    errors.push('Special requests must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      name: sanitizeString(data.name, 100),
      email: sanitizedEmail,
      phone: sanitizedPhone,
      guests: guests,
      date: data.date,
      time: data.time,
      specialRequests: sanitizeString(data.specialRequests, 500)
    }
  };
};

export const validateMenuItemData = (data) => {
  const errors = [];
  
  // Name validation for all languages
  ['nameAL', 'nameEN', 'nameIT'].forEach(field => {
    if (!data[field] || data[field].length < 2) {
      errors.push(`${field} must be at least 2 characters long`);
    }
    if (data[field] && data[field].length > 100) {
      errors.push(`${field} must be less than 100 characters`);
    }
  });
  
  // Price validation
  const price = parseFloat(data.price);
  if (isNaN(price) || price < 0 || price > 10000) {
    errors.push('Price must be a valid number between 0 and 10000');
  }
  
  // Category ID validation
  if (!data.categoryId || typeof data.categoryId !== 'string') {
    errors.push('Valid category ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      ...data,
      nameAL: sanitizeString(data.nameAL, 100),
      nameEN: sanitizeString(data.nameEN, 100),
      nameIT: sanitizeString(data.nameIT, 100),
      descriptionAL: sanitizeString(data.descriptionAL, 500),
      descriptionEN: sanitizeString(data.descriptionEN, 500),
      descriptionIT: sanitizeString(data.descriptionIT, 500),
      ingredientsAL: sanitizeString(data.ingredientsAL, 300),
      ingredientsEN: sanitizeString(data.ingredientsEN, 300),
      ingredientsIT: sanitizeString(data.ingredientsIT, 300),
      price: price
    }
  };
};