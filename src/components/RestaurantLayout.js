import React, { useState } from 'react';
import './RestaurantLayout.css';

const RestaurantLayout = () => {
  // Enhanced table data with uniform size and proper container padding
  const [tables, setTables] = useState([
    // Terrace - Left side with proper padding
    { id: 1, type: 'square', x: 80, y: 100, size: 60, seats: 4, status: 'available', name: 'T1' },
    { id: 2, type: 'square', x: 200, y: 100, size: 60, seats: 6, status: 'occupied', name: 'T2' },
    { id: 3, type: 'square', x: 80, y: 200, size: 60, seats: 4, status: 'available', name: 'T3' },
    { id: 4, type: 'square', x: 200, y: 200, size: 60, seats: 4, status: 'reserved', name: 'T4' },
    { id: 5, type: 'square', x: 80, y: 300, size: 60, seats: 4, status: 'available', name: 'T5' },
    { id: 6, type: 'square', x: 200, y: 300, size: 60, seats: 4, status: 'cleaning', name: 'T6' },
    
    // Terrace Garden - Bottom left with proper padding
    { id: 15, type: 'square', x: 80, y: 440, size: 60, seats: 4, status: 'available', name: 'TG1' },
    { id: 16, type: 'square', x: 200, y: 440, size: 60, seats: 4, status: 'available', name: 'TG2' },
    { id: 17, type: 'square', x: 80, y: 520, size: 60, seats: 6, status: 'occupied', name: 'TG3' },
    { id: 18, type: 'square', x: 200, y: 520, size: 60, seats: 4, status: 'reserved', name: 'TG4' },
    
    // Prive - Bottom right with proper padding
    { id: 19, type: 'square', x: 390, y: 440, size: 60, seats: 4, status: 'available', name: 'P1' },
    { id: 20, type: 'square', x: 510, y: 440, size: 60, seats: 4, status: 'reserved', name: 'P2' },
    { id: 21, type: 'square', x: 390, y: 520, size: 60, seats: 6, status: 'available', name: 'P3' },
    { id: 22, type: 'square', x: 510, y: 520, size: 60, seats: 4, status: 'occupied', name: 'P4' },
    
    // Main Dining Area - Top right with proper padding
    { id: 7, type: 'square', x: 390, y: 100, size: 60, seats: 4, status: 'available', name: 'M1' },
    { id: 8, type: 'square', x: 510, y: 100, size: 60, seats: 4, status: 'occupied', name: 'M2' },
    { id: 9, type: 'square', x: 570, y: 100, size: 60, seats: 6, status: 'reserved', name: 'M3' },
    { id: 10, type: 'square', x: 390, y: 200, size: 60, seats: 4, status: 'cleaning', name: 'M4' },
    { id: 11, type: 'square', x: 510, y: 200, size: 60, seats: 4, status: 'available', name: 'M5' },
    { id: 12, type: 'square', x: 570, y: 200, size: 60, seats: 6, status: 'occupied', name: 'M6' },
    { id: 13, type: 'square', x: 390, y: 300, size: 60, seats: 4, status: 'available', name: 'M7' },
    { id: 14, type: 'square', x: 510, y: 300, size: 60, seats: 4, status: 'reserved', name: 'M8' },
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

  // Enhanced table rendering - square tables with uniform size
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
      <rect
        {...commonProps}
        x={table.x}
        y={table.y}
        width={table.size}
        height={table.size}
        rx="8"
      />
    );
  };

  // Enhanced table labels - showing seat count only
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
          fontSize: '18px',
          fontWeight: 'bold',
          fill: '#FFFFFF',
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {table.seats}
      </text>
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
          <svg width="700" height="650" viewBox="0 0 700 650" className="restaurant-floor">
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
              <pattern id="gardenPattern" patternUnits="userSpaceOnUse" width="25" height="25">
                <rect width="25" height="25" fill="#D4F4DD"/>
                <circle cx="12" cy="12" r="3" fill="#10B981"/>
                <circle cx="5" cy="20" r="2" fill="#059669"/>
                <circle cx="20" cy="8" r="2" fill="#047857"/>
              </pattern>
              <pattern id="privePattern" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#FEF3C7"/>
                <rect x="2" y="2" width="16" height="16" fill="#FDE68A"/>
                <rect x="4" y="4" width="12" height="12" fill="#FCD34D"/>
              </pattern>
            </defs>
            
            {/* Main Building Structure - Extended */}
            <rect x="30" y="30" width="640" height="590" fill="#F8F9FA" stroke="#E5E7EB" strokeWidth="4" rx="15" />
            
            {/* Terrace - Now on Left Side (renamed from Garden Terrace) */}
            <rect x="50" y="60" width="290" height="320" fill="#F0FDF4" stroke="#10B981" strokeWidth="3" rx="12" />
            <rect x="45" y="55" width="300" height="330" fill="none" stroke="#059669" strokeWidth="2" rx="15" />
            
            {/* Terrace Garden - New section below Terrace */}
            <rect x="50" y="410" width="290" height="190" fill="url(#gardenPattern)" stroke="#059669" strokeWidth="3" rx="12" />
            <rect x="45" y="405" width="300" height="200" fill="none" stroke="#047857" strokeWidth="2" rx="15" />
            
            {/* Main Dining Area - Top right (matching left side spacing) */}
            <rect x="360" y="60" width="290" height="320" fill="url(#tilePattern)" stroke="#D1D5DB" strokeWidth="3" rx="12" />
            <rect x="355" y="55" width="300" height="330" fill="none" stroke="#6B7280" strokeWidth="2" rx="15" />
            
            {/* Prive - Bottom right (matching Terrace Garden spacing) */}
            <rect x="360" y="410" width="290" height="190" fill="url(#privePattern)" stroke="#D97706" strokeWidth="3" rx="12" />
            <rect x="355" y="405" width="300" height="200" fill="none" stroke="#B45309" strokeWidth="2" rx="15" />

            {/* Kitchen Area - Now in Right Side (Main Dining) */}
            <rect x="570" y="60" width="70" height="80" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" rx="8" />
            <rect x="575" y="65" width="60" height="15" fill="#DC2626" rx="4" />
            <text x="605" y="75" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#FFFFFF' }}>
              KITCHEN
            </text>
            
            {/* Equipment in Kitchen */}
            <circle cx="585" cy="95" r="6" fill="#9CA3AF" />
            <circle cx="600" cy="95" r="6" fill="#9CA3AF" />
            <circle cx="615" cy="95" r="6" fill="#9CA3AF" />
            <rect x="580" y="110" width="25" height="12" fill="#6B7280" rx="2" />
            <rect x="610" y="110" width="20" height="12" fill="#6B7280" rx="2" />

            {/* Bar Area - Next to Kitchen */}
            <rect x="570" y="150" width="70" height="80" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" rx="8" />
            <rect x="575" y="155" width="60" height="15" fill="#B45309" rx="4" />
            <text x="605" y="165" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#FFFFFF' }}>
              BAR
            </text>
            
            {/* Bar Equipment */}
            <circle cx="585" cy="185" r="6" fill="#8B4513" />
            <circle cx="600" cy="185" r="6" fill="#8B4513" />
            <circle cx="615" cy="185" r="6" fill="#8B4513" />
            <rect x="580" y="200" width="25" height="12" fill="#A0522D" rx="2" />
            <rect x="610" y="200" width="20" height="12" fill="#A0522D" rx="2" />

            {/* Entrance - Centered between blocks */}
            <rect x="310" y="385" width="80" height="20" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" rx="8" />
            <text x="350" y="398" textAnchor="middle" style={{ fontSize: '12px', fontWeight: 'bold', fill: '#FFFFFF' }}>
              ENTRANCE
            </text>
            
            {/* Windows - Left Wall */}
            <rect x="50" y="75" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="50" y="130" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="50" y="185" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="50" y="470" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="50" y="530" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            
            {/* Windows - Right Wall */}
            <rect x="642" y="75" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="642" y="130" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="642" y="185" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="642" y="240" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            <rect x="642" y="295" width="8" height="40" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" rx="2" />
            
            {/* Garden Elements - Now on Left Side (Terrace) */}
            <circle cx="70" cy="80" r="8" fill="#22C55E" />
            <circle cx="85" cy="85" r="6" fill="#16A34A" />
            <circle cx="75" cy="95" r="5" fill="#15803D" />
            <circle cx="310" cy="80" r="8" fill="#22C55E" />
            <circle cx="300" cy="90" r="10" fill="#16A34A" />
            <circle cx="320" cy="95" r="6" fill="#15803D" />
            <circle cx="70" cy="350" r="10" fill="#22C55E" />
            <circle cx="310" cy="360" r="8" fill="#16A34A" />
            
            {/* Enhanced Garden Elements in Terrace Garden */}
            <circle cx="70" cy="450" r="10" fill="#059669" />
            <circle cx="85" cy="465" r="8" fill="#047857" />
            <circle cx="75" cy="480" r="6" fill="#065F46" />
            <circle cx="310" cy="460" r="12" fill="#059669" />
            <circle cx="300" cy="480" r="8" fill="#047857" />
            <circle cx="320" cy="495" r="6" fill="#065F46" />
            <circle cx="70" cy="550" r="9" fill="#059669" />
            <circle cx="310" cy="570" r="10" fill="#047857" />
            <circle cx="120" cy="440" r="5" fill="#22C55E" />
            <circle cx="250" cy="440" r="7" fill="#16A34A" />
            <circle cx="120" cy="580" r="6" fill="#22C55E" />
            <circle cx="250" cy="580" r="8" fill="#16A34A" />

            {/* Prive Section Decorative Elements */}
            <circle cx="380" cy="430" r="8" fill="#D97706" />
            <circle cx="520" cy="440" r="6" fill="#B45309" />
            <circle cx="620" cy="450" r="7" fill="#92400E" />
            <circle cx="380" cy="570" r="9" fill="#D97706" />
            <circle cx="520" cy="560" r="8" fill="#B45309" />
            <circle cx="620" cy="570" r="6" fill="#92400E" />
            
            {/* Prive Section Curtains/Partitions */}
            <rect x="352" y="410" width="4" height="190" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="2" />
            <rect x="658" y="410" width="4" height="190" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="2" />
            <rect x="370" y="402" width="270" height="4" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="2" />
            <rect x="370" y="608" width="270" height="4" fill="#8B4513" stroke="#654321" strokeWidth="1" rx="2" />

            {/* Restrooms - Now in Right Side (Main Dining) */}
            <rect x="570" y="520" width="60" height="60" fill="#F3F4F6" stroke="#6B7280" strokeWidth="2" rx="6" />
            <text x="600" y="540" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#6B7280' }}>
              WC
            </text>
            <circle cx="585" cy="560" r="8" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />
            <circle cx="615" cy="560" r="8" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1" />

            {/* Area Labels with Enhanced Styling */}
            <g>
              <rect x="150" y="25" width="80" height="25" fill="rgba(240,253,244,0.9)" stroke="#10B981" strokeWidth="1" rx="6" />
              <text x="190" y="40" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#047857' }}>
                Terrace
              </text>
            </g>
            
            <g>
              <rect x="120" y="385" width="120" height="25" fill="rgba(212,244,221,0.9)" stroke="#059669" strokeWidth="1" rx="6" />
              <text x="180" y="400" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#047857' }}>
                Terrace Garden
              </text>
            </g>
            
            <g>
              <rect x="450" y="385" width="80" height="25" fill="rgba(248,246,240,0.9)" stroke="#D97706" strokeWidth="1" rx="6" />
              <text x="490" y="400" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#B45309' }}>
                Prive
              </text>
            </g>
            
            <g>
              <rect x="450" y="25" width="120" height="25" fill="rgba(255,255,255,0.9)" stroke="#E5E7EB" strokeWidth="1" rx="6" />
              <text x="510" y="40" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#1F2937' }}>
                Main Dining Area
              </text>
            </g>



            {/* Render all tables */}
            {tables.map(table => renderTable(table))}
            {tables.map(table => renderTableLabel(table))}
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
                  {selectedTable.x < 350 ? 
                    (selectedTable.y < 390 ? 'Terrace' : 'Terrace Garden') : 
                    (selectedTable.y < 390 ? 'Main Dining' : 'Prive')
                  }
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