import React, { useState, useEffect } from 'react';
import './TimeSlotManagement.css';

const TimeSlotManagement = () => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Days of the week mapping
  const daysOfWeek = [
    { id: 0, name: 'Sunday', short: 'Sun' },
    { id: 1, name: 'Monday', short: 'Mon' },
    { id: 2, name: 'Tuesday', short: 'Tue' },
    { id: 3, name: 'Wednesday', short: 'Wed' },
    { id: 4, name: 'Thursday', short: 'Thu' },
    { id: 5, name: 'Friday', short: 'Fri' },
    { id: 6, name: 'Saturday', short: 'Sat' },
  ];

  // Fetch time slots on component mount
  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/timeslots-complete');
      const result = await response.json();
      
      if (result.success) {
        setTimeSlots(result.data);
      } else {
        console.error('Failed to fetch time slots:', result.error);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSlots = async () => {
    try {
      const response = await fetch('/api/timeslots-complete?action=seed');
      const result = await response.json();
      
      if (result.success) {
        alert('Default time slots created successfully!');
        fetchTimeSlots();
      } else {
        alert('Failed to create default time slots: ' + result.error);
      }
    } catch (error) {
      console.error('Error seeding time slots:', error);
      alert('Error creating default time slots');
    }
  };

  const handleCreateSlot = async (slotData) => {
    try {
      const response = await fetch('/api/timeslots-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTimeSlots([...timeSlots, result.data]);
        setShowAddModal(false);
        alert('Time slot created successfully!');
      } else {
        alert('Failed to create time slot: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating time slot:', error);
      alert('Error creating time slot');
    }
  };

  const handleUpdateSlot = async (id, slotData) => {
    try {
      const response = await fetch('/api/timeslots-complete', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...slotData }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTimeSlots(timeSlots.map(slot => 
          slot.id === id ? result.data : slot
        ));
        setEditingSlot(null);
        alert('Time slot updated successfully!');
      } else {
        alert('Failed to update time slot: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating time slot:', error);
      alert('Error updating time slot');
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) {
      return;
    }

    try {
      const response = await fetch('/api/timeslots-complete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTimeSlots(timeSlots.filter(slot => slot.id !== id));
        alert('Time slot deleted successfully!');
      } else {
        alert('Failed to delete time slot: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting time slot:', error);
      alert('Error deleting time slot');
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCapacityForDay = (slot, dayOfWeek) => {
    const override = slot.capacityOverrides?.find(
      override => override.dayOfWeek === dayOfWeek && override.isActive
    );
    return override ? override.maxCapacity : slot.maxCapacity;
  };

  if (loading) {
    return <div className="loading">Loading time slots...</div>;
  }

  return (
    <div className="timeslot-management">
      <div className="timeslot-header">
        <h2>Time Slot Management</h2>
        <div className="header-buttons">
          <button 
            className="seed-button" 
            onClick={handleSeedSlots}
            disabled={timeSlots.length > 0}
          >
            {timeSlots.length > 0 ? 'Default slots created' : 'Create Default Slots'}
          </button>
          <button 
            className="add-button" 
            onClick={() => setShowAddModal(true)}
          >
            Add Time Slot
          </button>
        </div>
      </div>

      <div className="timeslot-grid">
        {timeSlots.map(slot => (
          <div key={slot.id} className="timeslot-card">
            <div className="timeslot-header">
              <h3>{formatTime(slot.time)}</h3>
              <span className={`status ${slot.isActive ? 'active' : 'inactive'}`}>
                {slot.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="timeslot-info">
              <div className="info-row">
                <span>Default Capacity:</span>
                <span>{slot.maxCapacity} guests</span>
              </div>
              <div className="info-row">
                <span>Duration:</span>
                <span>{slot.duration} minutes</span>
              </div>
              <div className="info-row">
                <span>Order:</span>
                <span>{slot.displayOrder}</span>
              </div>
            </div>

            <div className="capacity-overrides">
              <h4>Day-specific Capacity:</h4>
              <div className="days-grid">
                {daysOfWeek.map(day => (
                  <div key={day.id} className="day-capacity">
                    <span className="day-name">{day.short}</span>
                    <span className="capacity-value">
                      {getCapacityForDay(slot, day.id)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="timeslot-actions">
              <button 
                className="edit-button"
                onClick={() => setEditingSlot(slot)}
              >
                Edit
              </button>
              <button 
                className="capacity-button"
                onClick={() => {
                  setSelectedSlot(slot);
                  setShowCapacityModal(true);
                }}
              >
                Capacity
              </button>
              <button 
                className="delete-button"
                onClick={() => handleDeleteSlot(slot.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Time Slot Modal */}
      {showAddModal && (
        <TimeSlotModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateSlot}
          title="Add New Time Slot"
        />
      )}

      {/* Edit Time Slot Modal */}
      {editingSlot && (
        <TimeSlotModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSave={(data) => handleUpdateSlot(editingSlot.id, data)}
          title="Edit Time Slot"
        />
      )}

      {/* Capacity Management Modal */}
      {showCapacityModal && selectedSlot && (
        <CapacityModal
          slot={selectedSlot}
          onClose={() => {
            setShowCapacityModal(false);
            setSelectedSlot(null);
          }}
          onUpdate={() => {
            fetchTimeSlots();
            setShowCapacityModal(false);
            setSelectedSlot(null);
          }}
          daysOfWeek={daysOfWeek}
        />
      )}
    </div>
  );
};

// Time Slot Modal Component
const TimeSlotModal = ({ slot, onClose, onSave, title }) => {
  const [formData, setFormData] = useState({
    time: slot?.time || '',
    maxCapacity: slot?.maxCapacity || 20,
    duration: slot?.duration || 120,
    displayOrder: slot?.displayOrder || 0,
    isActive: slot?.isActive ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Maximum Capacity</label>
            <input
              type="number"
              name="maxCapacity"
              value={formData.maxCapacity}
              onChange={handleChange}
              min="1"
              max="100"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="30"
              max="300"
              step="30"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Display Order</label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Active
            </label>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Capacity Management Modal Component
const CapacityModal = ({ slot, onClose, onUpdate, daysOfWeek }) => {
  const [capacities, setCapacities] = useState({});

  useEffect(() => {
    // Initialize capacities from slot data
    const initialCapacities = {};
    daysOfWeek.forEach(day => {
      const override = slot.capacityOverrides?.find(
        override => override.dayOfWeek === day.id && override.isActive
      );
      initialCapacities[day.id] = override ? override.maxCapacity : slot.maxCapacity;
    });
    setCapacities(initialCapacities);
  }, [slot, daysOfWeek]);

  const handleCapacityChange = (dayId, value) => {
    setCapacities(prev => ({
      ...prev,
      [dayId]: parseInt(value)
    }));
  };

  const handleSave = async () => {
    try {
      // Save capacity overrides for each day
      for (const dayId in capacities) {
        const capacity = capacities[dayId];
        
        // Only create override if different from default
        if (capacity !== slot.maxCapacity) {
          await fetch('/api/timeslots-complete?path=capacity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timeSlotId: slot.id,
              dayOfWeek: parseInt(dayId),
              maxCapacity: capacity
            })
          });
        }
      }
      
      alert('Capacity settings saved successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error saving capacity settings:', error);
      alert('Error saving capacity settings');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content capacity-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Capacity Settings - {slot.time}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="capacity-form">
          <p>Default capacity: {slot.maxCapacity} guests</p>
          
          <div className="capacity-grid">
            {daysOfWeek.map(day => (
              <div key={day.id} className="capacity-row">
                <label>{day.name}</label>
                <input
                  type="number"
                  value={capacities[day.id] || slot.maxCapacity}
                  onChange={(e) => handleCapacityChange(day.id, e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotManagement; 