import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { reservationService } from '../reservationService.js';
import restaurantSettingsService from '../services/restaurantSettingsService.js';
import MenuManagement from './MenuManagement';
import RestaurantLayout from './RestaurantLayout';
import TimeSlotManagement from './TimeSlotManagement';
import BlogManagement from './BlogManagement';
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [addingReservation, setAddingReservation] = useState(false);
  const [updatingReservation, setUpdatingReservation] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Handle responsive sidebar collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Restaurant settings state
  const [restaurantSettings, setRestaurantSettings] = useState({
    restaurantName: '',
    email: '',
    phone: '',
    address: '',
    operatingHours: {
      monday: { open: '12:00', close: '22:00', closed: false },
      tuesday: { open: '12:00', close: '22:00', closed: false },
      wednesday: { open: '12:00', close: '22:00', closed: false },
      thursday: { open: '12:00', close: '22:00', closed: false },
      friday: { open: '12:00', close: '22:00', closed: false },
      saturday: { open: '12:00', close: '22:00', closed: false },
      sunday: { open: '12:00', close: '22:00', closed: false }
    },
    maxCapacity: 50,
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    emailNotifications: true,
    smsNotifications: false
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Date filtering state
  const [dateFilter, setDateFilter] = useState('');
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [dateFilterActive, setDateFilterActive] = useState(false);

  // Fetch reservations and stats
  const fetchData = async (filterDate = null) => {
    try {
      setLoading(true);
      
      // Prepare API options
      const options = {};
      if (filterDate) {
        options.date = filterDate;
      }
      
      const reservationsResult = await reservationService.getAll(options);
      
      if (reservationsResult.success) {
        const data = reservationsResult.data;
        
        if (filterDate) {
          setFilteredReservations(data);
          setDateFilterActive(true);
        } else {
          setReservations(data);
          setFilteredReservations([]);
          setDateFilterActive(false);
        }
        
        // Calculate stats based on current data
        const total = data.length;
        const pending = data.filter(r => r.status === 'PENDING').length;
        const confirmed = data.filter(r => r.status === 'CONFIRMED').length;
        const completed = data.filter(r => r.status === 'COMPLETED').length;
        
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

  useEffect(() => {
    if (isSignedIn) {
      fetchData();
      loadRestaurantSettings();
    }
  }, [isSignedIn]);

  // Check if user is signed in and is an admin
  if (!isSignedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  // Check if user is an admin
  const adminUserIds = process.env.REACT_APP_ADMIN_USER_IDS?.split(',') || [];
  if (isSignedIn && user && !adminUserIds.includes(user.id)) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <h1>Access Denied</h1>
          <p>You don't have permission to access this area.</p>
          <button onClick={() => window.location.href = '/'} className="home-button">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Handler functions
  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowViewModal(true);
  };

  const handleUpdateReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowUpdateModal(true);
  };

  const handleUpdateStatus = async (reservationId, newStatus) => {
    setUpdatingReservation(true);
    try {
      const result = await reservationService.updateStatus(reservationId, newStatus);
      if (result.success) {
        // Refresh the data
        const reservationsResult = await reservationService.getAll();
        if (reservationsResult.success) {
          setReservations(reservationsResult.data);
          
          // Recalculate stats
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
        setShowUpdateModal(false);
        setSelectedReservation(null);
      } else {
        alert('Failed to update status: ' + result.error);
      }
    } catch (error) {
      alert('Error updating status: ' + error.message);
    } finally {
      setUpdatingReservation(false);
    }
  };

  const handleAddReservation = async (reservationData) => {
    setAddingReservation(true);
    try {
      const result = await reservationService.create(reservationData);
      if (result.success) {
        alert('Reservation added successfully!');
        setShowAddModal(false);
        // Refresh the data
        window.location.reload();
      } else {
        alert('Failed to add reservation: ' + result.error);
      }
    } catch (error) {
      alert('Error adding reservation: ' + error.message);
    } finally {
      setAddingReservation(false);
    }
  };

  const refreshData = async () => {
    const currentFilter = dateFilterActive ? dateFilter : null;
    await fetchData(currentFilter);
  };

  // Date filtering helper functions
  const handleDateFilterChange = (e) => {
    const selectedDate = e.target.value;
    setDateFilter(selectedDate);
    
    if (selectedDate) {
      fetchData(selectedDate);
    } else {
      fetchData();
    }
  };

  const handleTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFilter(today);
    fetchData(today);
  };

  const clearDateFilter = () => {
    setDateFilter('');
    fetchData();
  };

  // Get current reservations display (filtered or all)
  const getCurrentReservations = () => {
    return dateFilterActive ? filteredReservations : reservations;
  };

  // Restaurant settings functions
  const loadRestaurantSettings = async () => {
    try {
      setLoadingSettings(true);
      const result = await restaurantSettingsService.getSettings();
      
      if (result.success) {
        setRestaurantSettings(result.data);
      } else {
        console.error('Failed to load restaurant settings:', result.error);
      }
    } catch (error) {
      console.error('Error loading restaurant settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveRestaurantSettings = async (settingsData) => {
    try {
      setSavingSettings(true);
      
      // Validate settings data
      const validation = restaurantSettingsService.validateSettings(settingsData);
      
      if (!validation.isValid) {
        alert('Please fix the following errors:\n' + validation.errors.join('\n'));
        return;
      }
      
      const result = await restaurantSettingsService.updateSettings(settingsData);
      
      if (result.success) {
        setRestaurantSettings(result.data);
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving restaurant settings:', error);
      alert('Error saving settings: ' + error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRestaurantInfoSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedSettings = {
      ...restaurantSettings,
      restaurantName: formData.get('restaurantName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      websiteUrl: formData.get('websiteUrl'),
      facebookUrl: formData.get('facebookUrl'),
      instagramUrl: formData.get('instagramUrl'),
      emailNotifications: formData.get('emailNotifications') === 'on',
      smsNotifications: formData.get('smsNotifications') === 'on',
    };
    saveRestaurantSettings(updatedSettings);
  };

  const handleOperatingHoursSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedOperatingHours = { ...restaurantSettings.operatingHours };
    
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      updatedOperatingHours[day] = {
        open: formData.get(`${day}_open`),
        close: formData.get(`${day}_close`),
        closed: formData.get(`${day}_closed`) === 'on'
      };
    });
    
    const updatedSettings = {
      ...restaurantSettings,
      operatingHours: updatedOperatingHours
    };
    
    saveRestaurantSettings(updatedSettings);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content">
            <h2>Dashboard Overview</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Reservations</h3>
                <div className="stat-number">{stats.totalReservations}</div>
                <div className="stat-change">
                  {dateFilterActive 
                    ? `For ${new Date(dateFilter).toLocaleDateString()}`
                    : 'All time reservations'
                  }
                </div>
              </div>
              
              <div className="stat-card">
                <h3>Pending</h3>
                <div className="stat-number">{stats.pendingReservations}</div>
                <div className="stat-change">
                  {dateFilterActive 
                    ? 'Awaiting confirmation'
                    : 'Awaiting confirmation'
                  }
                </div>
              </div>
              
              <div className="stat-card">
                <h3>Active Bookings</h3>
                <div className="stat-number">{stats.activeBookings}</div>
                <div className="stat-change">
                  {dateFilterActive 
                    ? 'Confirmed reservations'
                    : 'Confirmed reservations'
                  }
                </div>
              </div>
              
              <div className="stat-card">
                <h3>Completed</h3>
                <div className="stat-number">{stats.completedReservations}</div>
                <div className="stat-change">
                  {dateFilterActive 
                    ? 'Successfully served'
                    : 'Successfully served'
                  }
                </div>
              </div>
            </div>
            
            <div className="reservations-section">
              <div className="table-header">
                <h3>
                  {dateFilterActive 
                    ? `Reservations for ${new Date(dateFilter).toLocaleDateString()}`
                    : 'Recent Reservations'
                  }
                </h3>
                <div className="table-actions">
                  <div className="date-filter-controls">
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={handleDateFilterChange}
                      className="date-filter-input"
                    />
                    <button onClick={handleTodayFilter} className="today-btn">
                      Today
                    </button>
                    {dateFilterActive && (
                      <button onClick={clearDateFilter} className="clear-filter-btn">
                        Show All
                      </button>
                    )}
                  </div>
                  <div className="reservation-count">
                    <p>Total Reservations: {getCurrentReservations().length}</p>
                    <button onClick={refreshData} className="refresh-btn" disabled={loading}>
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="reservations-table">
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
                    {getCurrentReservations().length === 0 ? (
                      <tr>
                        <td colSpan="9" className="no-data">
                          {loading ? 'Loading reservations...' : 'No reservations found'}
                        </td>
                      </tr>
                    ) : (
                      getCurrentReservations().map((reservation) => (
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
                              onClick={() => handleViewReservation(reservation)}
                              className="action-btn view"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleUpdateReservation(reservation)}
                              className="action-btn edit"
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
          </div>
        );
        
      case 'menu':
        return <MenuManagement />;
        
      case 'blog':
        return <BlogManagement />;
        
      case 'timeslots':
        return <TimeSlotManagement />;
        
      case 'layout':
        return <RestaurantLayout />;
        
      case 'settings':
        return (
          <div className="tab-content">
            <h2>Settings</h2>
            {loadingSettings ? (
              <div className="loading">Loading settings...</div>
            ) : (
              <div className="settings-sections">
                <div className="settings-section">
                  <h3>Restaurant Information</h3>
                  <form onSubmit={handleRestaurantInfoSubmit}>
                    <div className="form-group">
                      <label>Restaurant Name</label>
                      <input 
                        type="text" 
                        name="restaurantName"
                        value={restaurantSettings.restaurantName}
                        onChange={(e) => setRestaurantSettings({...restaurantSettings, restaurantName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={restaurantSettings.phone}
                        onChange={(e) => setRestaurantSettings({...restaurantSettings, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        name="email"
                        value={restaurantSettings.email}
                        onChange={(e) => setRestaurantSettings({...restaurantSettings, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input 
                        type="text" 
                        name="address"
                        value={restaurantSettings.address}
                        onChange={(e) => setRestaurantSettings({...restaurantSettings, address: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Website URL</label>
                      <input 
                        type="url" 
                        name="websiteUrl"
                        value={restaurantSettings.websiteUrl || ''}
                        onChange={(e) => setRestaurantSettings({...restaurantSettings, websiteUrl: e.target.value})}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Facebook URL</label>
                      <input 
                        type="url" 
                        name="facebookUrl"
                        value={restaurantSettings.facebookUrl || ''}
                        onChange={(e) => setRestaurantSettings({...restaurantSettings, facebookUrl: e.target.value})}
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div className="form-group">
                      <label>Instagram URL</label>
                      <input 
                        type="url" 
                        name="instagramUrl"
                        value={restaurantSettings.instagramUrl || ''}
                        onChange={(e) => setRestaurantSettings({...restaurantSettings, instagramUrl: e.target.value})}
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <input 
                          type="checkbox" 
                          name="emailNotifications"
                          checked={restaurantSettings.emailNotifications}
                          onChange={(e) => setRestaurantSettings({...restaurantSettings, emailNotifications: e.target.checked})}
                        />
                        Email Notifications
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input 
                          type="checkbox" 
                          name="smsNotifications"
                          checked={restaurantSettings.smsNotifications}
                          onChange={(e) => setRestaurantSettings({...restaurantSettings, smsNotifications: e.target.checked})}
                        />
                        SMS Notifications
                      </label>
                    </div>
                    <button type="submit" className="save-btn" disabled={savingSettings}>
                      {savingSettings ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
                
                <div className="settings-section">
                  <h3>Operating Hours</h3>
                  <form onSubmit={handleOperatingHoursSubmit}>
                    <div className="hours-grid">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <div key={day} className="day-hours">
                          <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                          <input 
                            type="time" 
                            name={`${day}_open`}
                            value={restaurantSettings.operatingHours[day]?.open || '12:00'}
                            onChange={(e) => setRestaurantSettings({
                              ...restaurantSettings,
                              operatingHours: {
                                ...restaurantSettings.operatingHours,
                                [day]: {
                                  ...restaurantSettings.operatingHours[day],
                                  open: e.target.value
                                }
                              }
                            })}
                            disabled={restaurantSettings.operatingHours[day]?.closed}
                          />
                          <span>to</span>
                          <input 
                            type="time" 
                            name={`${day}_close`}
                            value={restaurantSettings.operatingHours[day]?.close || '22:00'}
                            onChange={(e) => setRestaurantSettings({
                              ...restaurantSettings,
                              operatingHours: {
                                ...restaurantSettings.operatingHours,
                                [day]: {
                                  ...restaurantSettings.operatingHours[day],
                                  close: e.target.value
                                }
                              }
                            })}
                            disabled={restaurantSettings.operatingHours[day]?.closed}
                          />
                          <label>
                            <input 
                              type="checkbox" 
                              name={`${day}_closed`}
                              checked={restaurantSettings.operatingHours[day]?.closed || false}
                              onChange={(e) => setRestaurantSettings({
                                ...restaurantSettings,
                                operatingHours: {
                                  ...restaurantSettings.operatingHours,
                                  [day]: {
                                    ...restaurantSettings.operatingHours[day],
                                    closed: e.target.checked
                                  }
                                }
                              })}
                            />
                            Closed
                          </label>
                        </div>
                      ))}
                    </div>
                    <button type="submit" className="save-btn" disabled={savingSettings}>
                      {savingSettings ? 'Saving...' : 'Save Hours'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <img 
            src="https://ucarecdn.com/f2ebac4d-52d3-45f7-997d-3e2dea09557b/ullishtja_logo.jpeg" 
            alt="Ullishtja Logo" 
            className="dashboard-logo"
          />
          <div className="header-text">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.firstName || 'Admin'}!</p>
          </div>
        </div>
        <div className="header-right">
          <UserButton />
        </div>
      </div>
      
      <div className="dashboard-content">
        <nav className={`dashboard-nav ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="nav-header">
            <button 
              className="nav-toggle" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            {!sidebarCollapsed && <span className="nav-title">Dashboard</span>}
          </div>
          
          <div className="nav-items">
            <button 
              className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              title="Overview"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Overview</span>}
            </button>
            <button 
              className={`nav-tab ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
              title="Menu Management"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h9zm0 0v7c0 .552-.448 1-1 1H11c-.552 0-1-.448-1-1v-7"/>
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Menu</span>}
            </button>
            <button 
              className={`nav-tab ${activeTab === 'blog' ? 'active' : ''}`}
              onClick={() => setActiveTab('blog')}
              title="Blog Management"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Blog</span>}
            </button>
            <button 
              className={`nav-tab ${activeTab === 'timeslots' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeslots')}
              title="Time Slots"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Time Slots</span>}
            </button>
            <button 
              className={`nav-tab ${activeTab === 'layout' ? 'active' : ''}`}
              onClick={() => setActiveTab('layout')}
              title="Restaurant Layout"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Layout</span>}
            </button>
            <button 
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
              title="Settings"
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 8v6m11-7h-6m-8 0H1m17.5-2.5L19 19l-2.5-2.5M7 7L4.5 4.5M7 17l-2.5 2.5M17 7l2.5-2.5"/>
              </svg>
              {!sidebarCollapsed && <span className="nav-text">Settings</span>}
            </button>
          </div>
        </nav>
        
        <main className="dashboard-main">
          {renderTabContent()}
        </main>
      </div>
      
      {/* Add Manual Reservation FAB */}
      <button 
        className="fab-button" 
        onClick={() => setShowAddModal(true)}
        title="Add Manual Reservation"
      >
        +
      </button>
      
      {/* Modals */}
      {showAddModal && (
        <AddReservationModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddReservation}
          isLoading={addingReservation}
        />
      )}
      
      {showViewModal && selectedReservation && (
        <ViewReservationModal 
          reservation={selectedReservation}
          onClose={() => {
            setShowViewModal(false);
            setSelectedReservation(null);
          }}
        />
      )}
      
      {showUpdateModal && selectedReservation && (
        <UpdateReservationModal 
          reservation={selectedReservation}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedReservation(null);
          }}
          onUpdate={handleUpdateStatus}
          isLoading={updatingReservation}
        />
      )}
    </div>
  );
};

// View Reservation Modal Component
const ViewReservationModal = ({ reservation, onClose }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#f56565';
      case 'confirmed': return '#48bb78';
      case 'completed': return '#4299e1';
      case 'cancelled': return '#ed8936';
      case 'no_show': return '#9f7aea';
      default: return '#718096';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content view-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h2>📋 Reservation Details</h2>
            <span className="reservation-id">#{reservation.id?.slice(-8) || 'N/A'}</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="reservation-details">
          {/* Customer Information */}
          <div className="detail-section">
            <h3 className="section-title">👤 Customer Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">📝</span>
                  Full Name
                </div>
                <div className="detail-value">{reservation.name}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">📧</span>
                  Email Address
                </div>
                <div className="detail-value">{reservation.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">📞</span>
                  Phone Number
                </div>
                <div className="detail-value">{reservation.phone}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">👥</span>
                  Party Size
                </div>
                <div className="detail-value">
                  {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Information */}
          <div className="detail-section">
            <h3 className="section-title">🗓️ Reservation Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">📅</span>
                  Date
                </div>
                <div className="detail-value">{formatDate(reservation.date)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">🕒</span>
                  Time
                </div>
                <div className="detail-value">{formatTime(reservation.time)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">📊</span>
                  Status
                </div>
                <div className="detail-value">
                  <span 
                    className="status-badge" 
                    style={{ 
                      backgroundColor: getStatusColor(reservation.status),
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}
                  >
                    {reservation.status}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <span className="detail-icon">⏰</span>
                  Created
                </div>
                <div className="detail-value">
                  {new Date(reservation.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="detail-section">
            <h3 className="section-title">💬 Special Requests</h3>
            <div className="special-requests">
              {reservation.specialRequests ? (
                <div className="request-content">
                  <span className="detail-icon">📝</span>
                  <p>{reservation.specialRequests}</p>
                </div>
              ) : (
                <div className="no-requests">
                  <span className="detail-icon">✅</span>
                  <p>No special requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="primary-btn">
            <span>✓</span> Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Update Reservation Modal Component
const UpdateReservationModal = ({ reservation, onClose, onUpdate, isLoading }) => {
  const [selectedStatus, setSelectedStatus] = useState(reservation.status);
  
  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: '#f56565' },
    { value: 'CONFIRMED', label: 'Confirmed', color: '#48bb78' },
    { value: 'COMPLETED', label: 'Completed', color: '#4299e1' },
    { value: 'CANCELLED', label: 'Cancelled', color: '#ed8936' },
    { value: 'NO_SHOW', label: 'No Show', color: '#9f7aea' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(reservation.id, selectedStatus);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Reservation Status</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="reservation-summary">
          <p><strong>Customer:</strong> {reservation.name}</p>
          <p><strong>Date:</strong> {new Date(reservation.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {reservation.time}</p>
          <p><strong>Guests:</strong> {reservation.guests}</p>
          <p><strong>Current Status:</strong> 
            <span className={`status ${reservation.status.toLowerCase()}`}>
              {reservation.status}
            </span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="update-form">
          <div className="form-group">
            <label htmlFor="status">New Status:</label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              required
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || selectedStatus === reservation.status} 
              className="submit-btn"
            >
              {isLoading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
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