import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { reservationService } from '../services/mockDatabase.js';
import MenuManagement from './MenuManagement';
import RestaurantLayout from './RestaurantLayout';
import './Dashboard.css';

const Dashboard = () => {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    activeBookings: 0,
    completedReservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingReservation, setAddingReservation] = useState(false);

  // Fetch reservations and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const reservationsResult = await reservationService.getAll();
        
        if (reservationsResult.success) {
          setReservations(reservationsResult.data);
          
          // Calculate stats
          const total = reservationsResult.data.length;
          const pending = reservationsResult.data.filter(r => r.status === 'PENDING').length;
          const confirmed = reservationsResult.data.filter(r => r.status === 'CONFIRMED').length;
          const completed = reservationsResult.data.filter(r => r.status === 'COMPLETED').length;
          
          setStats({
            totalReservations: total,
            pendingReservations: pending,
            activeBookings: confirmed,
            completedReservations: completed
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchData();
    }
  }, [isSignedIn]);

  // Check if user is signed in and is an admin
  if (!isSignedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  // Handler functions
  const handleViewReservation = (reservation) => {
    alert(`Reservation Details:
    
Name: ${reservation.name}
Email: ${reservation.email}
Phone: ${reservation.phone}
Date: ${new Date(reservation.date).toLocaleDateString()}
Time: ${reservation.time}
Guests: ${reservation.guests}
Status: ${reservation.status}
Special Requests: ${reservation.specialRequests || 'None'}
Created: ${new Date(reservation.createdAt).toLocaleString()}`);
  };

  const handleUpdateStatus = async (reservationId) => {
    const newStatus = prompt('Enter new status (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW):');
    if (newStatus && ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(newStatus.toUpperCase())) {
      try {
        const result = await reservationService.updateStatus(reservationId, newStatus.toUpperCase());
        if (result.success) {
          alert('Status updated successfully!');
          // Refresh the data
          window.location.reload();
        } else {
          alert('Failed to update status: ' + result.error);
        }
      } catch (error) {
        alert('Error updating status: ' + error.message);
      }
    } else {
      alert('Invalid status. Please use: PENDING, CONFIRMED, CANCELLED, COMPLETED, or NO_SHOW');
    }
  };

  const handleAddReservation = async (reservationData) => {
    setAddingReservation(true);
    try {
      const result = await reservationService.create(reservationData);
      if (result.success) {
        // Add the new reservation to the list
        setReservations(prev => [result.data, ...prev]);
        
        // Update stats
        setStats(prev => ({
          totalReservations: prev.totalReservations + 1,
          pendingReservations: prev.pendingReservations + 1,
          activeBookings: prev.activeBookings,
          completedReservations: prev.completedReservations
        }));
        
        setShowAddModal(false);
        alert('Reservation added successfully!');
      } else {
        alert('Failed to add reservation: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding reservation:', error);
      alert('Error adding reservation. Please try again.');
    } finally {
      setAddingReservation(false);
    }
  };

  const adminUserIds = process.env.REACT_APP_ADMIN_USER_IDS?.split(',') || [];
  if (!adminUserIds.includes(user?.id)) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <h1>Access Denied</h1>
          <p>You don't have permission to access this admin dashboard.</p>
          <button onClick={() => window.location.href = '/'} className="home-button">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'layout':
        return <RestaurantLayout />;
      case 'menu':
        return <MenuManagement />;
      case 'overview':
        return (
          <div className="tab-content">
            <h2>Dashboard Overview</h2>
            {loading ? (
              <div className="loading">Loading dashboard data...</div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Reservations</h3>
                    <p className="stat-number">{stats.totalReservations}</p>
                    <span className="stat-change">All time reservations</span>
                  </div>
                  <div className="stat-card">
                    <h3>Pending</h3>
                    <p className="stat-number">{stats.pendingReservations}</p>
                    <span className="stat-change">Awaiting confirmation</span>
                  </div>
                  <div className="stat-card">
                    <h3>Confirmed</h3>
                    <p className="stat-number">{stats.activeBookings}</p>
                    <span className="stat-change positive">Active bookings</span>
                  </div>
                  <div className="stat-card">
                    <h3>Completed</h3>
                    <p className="stat-number">{stats.completedReservations}</p>
                    <span className="stat-change positive">Successfully served</span>
                  </div>
                </div>
                
                {/* Reservations Table */}
                <div className="reservations-section">
                  <h3>Recent Reservations</h3>
                  <div className="reservations-table">
                    <div className="table-header">
                      <p>Total Reservations: {reservations.length}</p>
                      <button className="refresh-btn" onClick={() => window.location.reload()}>
                        Refresh
                      </button>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Guests</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th>Special Requests</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="no-data">
                              No reservations found. New reservations will appear here automatically.
                            </td>
                          </tr>
                        ) : (
                          reservations
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((reservation) => (
                              <tr key={reservation.id}>
                                <td>{new Date(reservation.date).toLocaleDateString()}</td>
                                <td>{reservation.name}</td>
                                <td>{reservation.email}</td>
                                <td>{reservation.phone}</td>
                                <td>{reservation.guests}</td>
                                <td>{reservation.time}</td>
                                <td>
                                  <span className={`status ${reservation.status.toLowerCase()}`}>
                                    {reservation.status}
                                  </span>
                                </td>
                                <td>{reservation.specialRequests || 'None'}</td>
                                <td>
                                  <button 
                                    className="action-btn view"
                                    onClick={() => handleViewReservation(reservation)}
                                  >
                                    View
                                  </button>
                                  <button 
                                    className="action-btn edit"
                                    onClick={() => handleUpdateStatus(reservation.id)}
                                  >
                                    Update
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );


      case 'settings':
        return (
          <div className="tab-content">
            <h2>Settings</h2>
            <div className="settings-sections">
              <div className="settings-section">
                <h3>Restaurant Information</h3>
                <form className="settings-form">
                  <div className="form-group">
                    <label>Restaurant Name</label>
                    <input type="text" defaultValue="Ullishtja Agriturizem" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" defaultValue="+355 XX XXX XXX" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" defaultValue="info@ullishtja.com" />
                  </div>
                  <button type="submit" className="save-btn">Save Changes</button>
                </form>
              </div>
              <div className="settings-section">
                <h3>Operating Hours</h3>
                <div className="hours-grid">
                  <div className="day-hours">
                    <span>Monday</span>
                    <input type="time" defaultValue="12:00" />
                    <span>to</span>
                    <input type="time" defaultValue="22:00" />
                  </div>
                  <div className="day-hours">
                    <span>Tuesday</span>
                    <input type="time" defaultValue="12:00" />
                    <span>to</span>
                    <input type="time" defaultValue="22:00" />
                  </div>
                  {/* Add more days as needed */}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <img src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg" alt="Ullishtja Agriturizem" className="dashboard-logo" />
          <div className="header-text">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.firstName || 'Admin'}!</p>
          </div>
        </div>
        <div className="header-right">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Menu
          </button>
          <button 
            className={`nav-tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
          >
            🏛️ Layout
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <main className="dashboard-main">
          {renderTabContent()}
        </main>
      </div>

      {/* Floating Action Button */}
      <button 
        className="fab-button"
        onClick={() => setShowAddModal(true)}
        title="Add Manual Reservation"
      >
        +
      </button>

      {/* Add Reservation Modal */}
      {showAddModal && (
        <AddReservationModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddReservation}
          isLoading={addingReservation}
        />
      )}
    </div>
  );
};

// Add Reservation Modal Component
const AddReservationModal = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    specialRequests: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.time) {
      alert('Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Date validation (not in the past)
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('Please select a date that is today or in the future.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Manual Reservation</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter customer name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="customer@email.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+355 XX XXX XXX"
              />
            </div>
            <div className="form-group">
              <label htmlFor="guests">Number of Guests *</label>
              <select
                id="guests"
                name="guests"
                value={formData.guests}
                onChange={handleInputChange}
                required
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Reservation Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">Reservation Time *</label>
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              >
                <option value="">Select time</option>
                <option value="12:00">12:00 PM</option>
                <option value="12:30">12:30 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="18:30">6:30 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="19:30">7:30 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="20:30">8:30 PM</option>
                <option value="21:00">9:00 PM</option>
                <option value="21:30">9:30 PM</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="specialRequests">Special Requests</label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              placeholder="Any dietary restrictions, special occasions, or other requests..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? 'Adding...' : 'Add Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard; 