import React, { useEffect, useState } from 'react';
import staffService from '../services/staffService';
import './MenuManagement.css';

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', posPin: '', isActive: true });
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', posPin: '', isActive: true });
    setEditing(null);
    setShowForm(false);
  };

  const load = async () => {
    try {
      setLoading(true);
      const result = await staffService.list();
      if (result.success) setStaff(result.data || []);
      else setError(result.error || 'Failed to load staff');
    } catch (e) {
      setError(e.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editing) {
        await staffService.update(editing.id, form);
      } else {
        await staffService.create(form);
      }
      await load();
      resetForm();
    } catch (e) {
      setError(e.message || 'Failed to save staff');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ firstName: row.firstName, lastName: row.lastName, posPin: row.posPin, isActive: row.isActive });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      setLoading(true);
      await staffService.remove(id);
      await load();
    } catch (e) {
      setError(e.message || 'Failed to delete staff');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showForm) return <div className="loading">Loading staff...</div>;

  return (
    <div className="menu-management">
      <div className="menu-management-header">
        <h2>Staff</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Staff</button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="menu-content">
        <div className="menu-items-section" style={{ width: '100%' }}>
          <h3>Staff List</h3>
          <div className="menu-items-grid">
            {staff.map((s) => (
              <div key={s.id} className="menu-item-card">
                <div className="item-header">
                  <h4>{s.firstName} {s.lastName}</h4>
                  <span className="price">PIN: {s.posPin}</span>
                </div>
                <div className="item-actions">
                  <span className={`status-tag ${s.isActive ? 'active' : 'inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                  <button className="btn btn-small" onClick={() => handleEdit(s)}>Edit</button>
                  <button className="btn btn-small btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Staff' : 'Add Staff'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>POS PIN</label>
                <input type="text" value={form.posPin} onChange={(e) => setForm({ ...form, posPin: e.target.value })} required />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManagement;


