import React, { useState } from 'react';
import './RestaurantLayout.css';

const RestaurantLayout = () => {
  // Enhanced table data with side-by-side layout
  const [tables, setTables] = useState([
    // Main Dining Area - Left side with vertical bar
    { id: 1, type: 'round', x: 80, y: 100, size: 60, seats: 4, status: 'available', name: 'T1' },
    { id: 2, type: 'round', x: 180, y: 100, size: 60, seats: 4, status: 'occupied', name: 'T2' },
    { id: 3, type: 'round', x: 280, y: 100, size: 70, seats: 6, status: 'reserved', name: 'T3' },
    { id: 4, type: 'round', x: 80, y: 200, size: 60, seats: 4, status: 'cleaning', name: 'T4' },
    { id: 5, type: 'round', x: 180, y: 200, size: 60, seats: 4, status: 'available', name: 'T5' },
    { id: 6, type: 'round', x: 280, y: 200, size: 70, seats: 6, status: 'occupied', name: 'T6' },
    { id: 7, type: 'round', x: 80, y: 300, size: 60, seats: 4, status: 'available', name: 'T7' },
    { id: 8, type: 'round', x: 180, y: 300, size: 60, seats: 4, status: 'reserved', name: 'T8' },
    
    // Garden Terrace - Right side
    { id: 9, type: 'round', x: 450, y: 100, size: 65, seats: 4, status: 'available', name: 'G1' },
    { id: 10, type: 'round', x: 550, y: 100, size: 75, seats: 6, status: 'occupied', name: 'G2' },
    { id: 11, type: 'round', x: 450, y: 200, size: 65, seats: 4, status: 'available', name: 'G3' },
    { id: 12, type: 'round', x: 550, y: 200, size: 60, seats: 4, status: 'reserved', name: 'G4' },
    { id: 13, type: 'round', x: 450, y: 300, size: 60, seats: 4, status: 'available', name: 'G5' },
    { id: 14, type: 'round', x: 550, y: 300, size: 65, seats: 4, status: 'cleaning', name: 'G6' },
  ]);

  const [selectedTable, setSelectedTable] = useState(null);

  // Handle table click
  const handleTableClick = (table) => {
    setSelectedTable(table);
  };

  // Update table status
  const updateTableStatus = (tableId, newStatus) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, status: newStatus } : table
    ));
    setSelectedTable(null);
  };

  // Enhanced color scheme
  const getTableColor = (status) => {
    switch (status) {
      case 'available': return '#10B981'; // Emerald
      case 'occupied': return '#EF4444'; // Red
      case 'reserved': return '#F59E0B'; // Amber
      case 'cleaning': return '#6B7280'; // Gray
      default: return '#3B82F6'; // Blue
    }
  };

  // Enhanced table rendering - simplified for circular tables only
  const renderTable = (table) => {
    const commonProps = {
      key: table.id,
      onClick: () => handleTableClick(table),
      style: {
        cursor: 'pointer',
        fill: getTableColor(table.status),
        stroke: selectedTable?.id === table.id ? '#1F2937' : '#374151',
        strokeWidth: selectedTable?.id === table.id ? 3 : 2,
        filter: selectedTable?.id === table.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        transition: 'all 0.3s ease',
      }
    };

    return (
      <circle
        {...commonProps}
        cx={table.x + table.size/2}
        cy={table.y + table.size/2}
        r={table.size/2}
      />
    );
  };

  // Enhanced table labels - simplified for circular tables
  const renderTableLabel = (table) => {
    const x = table.x + table.size/2;
    const y = table.y + table.size/2;

    return (
      <text
        key={`label-${table.id}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          fill: '#FFFFFF',
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {table.name}
      </text>
    );
  };

  // Table capacity indicators - simplified for circular tables
  const renderCapacityIndicator = (table) => {
    const x = table.x + table.size - 8;
    const y = table.y + 8;

    return (
      <g key={`capacity-${table.id}`}>
        <circle
          cx={x}
          cy={y}
          r={8}
          fill="#FFFFFF"
          stroke="#374151"
          strokeWidth={1}
        />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            fill: '#374151',
            pointerEvents: 'none',
          }}
        >
          {table.seats}
        </text>
      </g>
    );
  };

  return (
    <div className="restaurant-layout">
      <div className="layout-header">
        <div className="header-content">
          <h2>🏛️ Restaurant Floor Plan</h2>
          <p>Ullishtja Agroturizem - Table Management System</p>
        </div>
        <div className="layout-controls">
          <div className="status-legend">
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-color occupied"></div>
              <span>Occupied</span>
            </div>
            <div className="legend-item">
              <div className="legend-color reserved"></div>
              <span>Reserved</span>
            </div>
            <div className="legend-item">
              <div className="legend-color cleaning"></div>
              <span>Cleaning</span>
            </div>
          </div>
        </div>
      </div>

      <div className="layout-container">
        <div className="layout-canvas">
          <svg width="700" height="450" viewBox="0 0 700 450" className="restaurant-floor">
            {/* Restaurant Walls and Structure */}
            <defs>
              <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#8B4513"/>
                <rect x="2" y="2" width="16" height="16" fill="#A0522D"/>
              </pattern>
              <pattern id="tilePattern" patternUnits="userSpaceOnUse" width="15" height="15">
                <rect width="15" height="15" fill="#F5F5F5"/>
                <rect x="1" y="1" width="13" height="13" fill="#FFFFFF"/>
              </pattern>
            </defs>
            
            {/* Main Building Structure */}
            <rect x="30" y="30" width="640" height="390" fill="#F8F9FA" stroke="#E5E7EB" strokeWidth="4" rx="15" />
            
            {/* Main Dining Area - Left Side */}
            <rect x="50" y="50" width="290" height="350" fill="url(#tilePattern)" stroke="#D1D5DB" strokeWidth="3" rx="12" />
            <rect x="45" y="45" width="300" height="360" fill="none" stroke="#6B7280" strokeWidth="2" rx="15" />
            
            {/* Garden Terrace - Right Side */}
            <rect x="360" y="50" width="290" height="350" fill="#F0FDF4" stroke="#10B981" strokeWidth="3" rx="12" />
            <rect x="355" y="45" width="300" height="360" fill="none" stroke="#059669" strokeWidth="2" rx="15" />

            {/* Vertical Bar Counter in Main Dining Area */}
            <rect x="320" y="100" width="15" height="200" fill="url(#woodPattern)" stroke="#92400E" strokeWidth="2" rx="8" />
            
            {/* Bar Stools */}
            <circle cx="310" cy="120" r="6" fill="#8B4513" stroke="#654321" strokeWidth="1" />
            <circle cx="310" cy="150" r="6" fill="#8B4513" stroke="#654321" strokeWidth="1" />
            <circle cx="310" cy="180" r="6" fill="#8B4513" stroke="#654321" strokeWidth="1" />
            <circle cx="310" cy="210" r="6" fill="#8B4513" stroke="#654321" strokeWidth="1" />
            <circle cx="310" cy="240" r="6" fill="#8B4513" stroke="#654321" strokeWidth="1" />
            <circle cx="310" cy="270" r="6" fill="#8B4513" stroke="#654321" strokeWidth="1" />

            {/* Kitchen Area - Top Right of Main Dining */}
            <rect x="260" y="60" width="70" height="80" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" rx="8" />
            <rect x="265" y="65" width="60" height="15" fill="#DC2626" rx="4" />
            <text x="295" y="75" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#FFFFFF' }}>
              KITCHEN
            </text>
            
            {/* Equipment in Kitchen */}
            <circle cx="275" cy="95" r="6" fill="#9CA3AF" />
            <circle cx="290" cy="95" r="6" fill="#9CA3AF" />
            <circle cx="305" cy="95" r="6" fill="#9CA3AF" />
            <rect x="270" y="110" width="25" height="12" fill="#6B7280" rx="2" />
            <rect x="300" y="110" width="20" height="12" fill="#6B7280" rx="2" />

            {/* Entrance */}
            <rect x="310" y="25" width="80" height="15" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" rx="8" />
            <text x="350" y="35" textAnchor="middle" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#FFFFFF' }}>
              ENTRANCE
            </text>
            
            {/* Windows - Left Wall */}
            <rect x="50" y="75" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="50" y="130" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="50" y="185" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            
            {/* Windows - Right Wall */}
            <rect x="642" y="75" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="642" y="130" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="642" y="185" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            
            {/* Garden Elements */}
            <circle cx="380" cy="80" r="8" fill="#22C55E" />
            <circle cx="395" cy="85" r="6" fill="#16A34A" />
            <circle cx="385" cy="95" r="5" fill="#15803D" />
            <circle cx="620" cy="80" r="8" fill="#22C55E" />
            <circle cx="610" cy="90" r="10" fill="#16A34A" />
            <circle cx="630" cy="95" r="6" fill="#15803D" />
            <circle cx="380" cy="350" r="10" fill="#22C55E" />
            <circle cx="620" cy="360" r="8" fill="#16A34A" />

            {/* Restrooms - Bottom of Main Dining */}
            <rect x="270" y="320" width="60" height="60" fill="#F3F4F6" stroke="#6B7280" strokeWidth="2" rx="6" />
            <text x="300" y="340" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#6B7280' }}>
              WC
            </text>
            <circle cx="285" cy="360" r="8" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />
            <circle cx="315" cy="360" r="8" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />

            {/* Area Labels with Enhanced Styling */}
            <g>
              <rect x="140" y="25" width="120" height="25" fill="rgba(255,255,255,0.9)" stroke="#E5E7EB" strokeWidth="1" rx="6" />
              <text x="200" y="40" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#1F2937' }}>
                Main Dining Area
              </text>
            </g>
            
            <g>
              <rect x="460" y="25" width="100" height="25" fill="rgba(240,253,244,0.9)" stroke="#10B981" strokeWidth="1" rx="6" />
              <text x="510" y="40" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#047857' }}>
                Garden Terrace
              </text>
            </g>

            {/* Bar Label */}
            <g>
              <rect x="315" y="320" width="30" height="20" fill="rgba(254,243,199,0.9)" stroke="#F59E0B" strokeWidth="1" rx="4" />
              <text x="330" y="332" textAnchor="middle" style={{ fontSize: '8px', fontWeight: 'bold', fill: '#92400E' }}>
                BAR
              </text>
            </g>

            {/* Render all tables */}
            {tables.map(table => renderTable(table))}
            {tables.map(table => renderTableLabel(table))}
            {tables.map(table => renderCapacityIndicator(table))}
          </svg>
        </div>

        {/* Enhanced Table Details Panel */}
        {selectedTable && (
          <div className="table-details">
            <div className="table-details-header">
              <h3>Table {selectedTable.name}</h3>
              <div className={`status-badge ${selectedTable.status}`}>
                {selectedTable.status}
              </div>
            </div>
            
            <div className="table-info">
              <div className="info-row">
                <span className="info-label">Type:</span>
                <span className="info-value">{selectedTable.type}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Capacity:</span>
                <span className="info-value">{selectedTable.seats} guests</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location:</span>
                <span className="info-value">
                  {selectedTable.x < 350 ? 'Main Dining' : 'Garden Terrace'}
                </span>
              </div>
            </div>
            
            <div className="table-actions">
              <button 
                className="status-btn available"
                onClick={() => updateTableStatus(selectedTable.id, 'available')}
              >
                ✅ Set Available
              </button>
              <button 
                className="status-btn occupied"
                onClick={() => updateTableStatus(selectedTable.id, 'occupied')}
              >
                🔴 Set Occupied
              </button>
              <button 
                className="status-btn reserved"
                onClick={() => updateTableStatus(selectedTable.id, 'reserved')}
              >
                🟡 Set Reserved
              </button>
              <button 
                className="status-btn cleaning"
                onClick={() => updateTableStatus(selectedTable.id, 'cleaning')}
              >
                🧹 Set Cleaning
              </button>
            </div>
            
            <button className="close-details" onClick={() => setSelectedTable(null)}>
              ✕ Close Details
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Statistics */}
      <div className="layout-stats">
        <div className="stat-card available">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-number">{tables.filter(t => t.status === 'available').length}</span>
            <span className="stat-label">Available Tables</span>
          </div>
        </div>
        <div className="stat-card occupied">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <span className="stat-number">{tables.filter(t => t.status === 'occupied').length}</span>
            <span className="stat-label">Occupied Tables</span>
          </div>
        </div>
        <div className="stat-card reserved">
          <div className="stat-icon">🟡</div>
          <div className="stat-content">
            <span className="stat-number">{tables.filter(t => t.status === 'reserved').length}</span>
            <span className="stat-label">Reserved Tables</span>
          </div>
        </div>
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-number">{tables.reduce((sum, t) => sum + t.seats, 0)}</span>
            <span className="stat-label">Total Capacity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantLayout; 