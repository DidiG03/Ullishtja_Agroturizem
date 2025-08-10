import apiClient from '../utils/apiClient.js';

class StaffService {
  async list(params = {}) {
    // params may include { active: true }
    return apiClient.get('/api/staff', params);
  }

  async create(data) {
    return apiClient.post('/api/staff', data);
  }

  async update(id, data) {
    return apiClient.put(`/api/staff?id=${id}`, data);
  }

  async remove(id) {
    return apiClient.delete(`/api/staff?id=${id}`);
  }

  // POS fetch helper
  async listForPos(includeInactive = false) {
    return apiClient.get('/api/pos-staff', { includeInactive });
  }
}

const staffService = new StaffService();
export default staffService;


