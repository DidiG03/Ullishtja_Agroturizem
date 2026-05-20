import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MenuService from '../services/menuService';
import { parseMenuExcelFile } from '../utils/menuExcelImport';
import './MenuManagement.css';

function sortCategories(cats) {
  return [...cats].sort(
    (a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      (a.nameAL || '').localeCompare(b.nameAL || '', 'sq')
  );
}

function sortItems(items) {
  return [...items].sort(
    (a, b) =>
      (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
      (a.nameAL || '').localeCompare(b.nameAL || '', 'sq')
  );
}

function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [importParsing, setImportParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearingMenu, setClearingMenu] = useState(false);
  const importInputRef = useRef(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    nameAL: '',
    nameEN: '',
    nameIT: '',
    slug: '',
    displayOrder: 0
  });

  const [itemForm, setItemForm] = useState({
    categoryId: '',
    nameAL: '',
    nameEN: '',
    nameIT: '',
    descriptionAL: '',
    descriptionEN: '',
    descriptionIT: '',
    ingredientsAL: '',
    ingredientsEN: '',
    ingredientsIT: '',
    price: '',
    isVegetarian: false,
    isSpicy: false,
    isRecommended: false,
    isNew: false,
    imageUrl: '',
    displayOrder: 0,
    isKg: false
  });

  const refreshMenu = useCallback(async (preferredCategoryId = null) => {
    const [catResult, itemsResult] = await Promise.all([
      MenuService.getCategories(),
      MenuService.getMenuItems(),
    ]);

    if (catResult.success) {
      const sorted = sortCategories(catResult.data || []);
      setCategories(sorted);
      const nextId =
        preferredCategoryId && sorted.some((c) => c.id === preferredCategoryId)
          ? preferredCategoryId
          : sorted[0]?.id ?? null;
      setSelectedCategory(nextId);
    } else {
      setError(catResult.error || 'Failed to load categories');
    }

    if (itemsResult.success) {
      setAllItems(itemsResult.data || []);
    } else if (!catResult.success) {
      setError(itemsResult.error || 'Failed to load menu items');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshMenu();
      } catch (err) {
        if (!cancelled) setError('Failed to load menu');
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMenu]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    allItems.forEach((item) => {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    });
    return counts;
  }, [allItems]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.nameAL?.toLowerCase().includes(q) ||
        c.nameEN?.toLowerCase().includes(q) ||
        c.nameIT?.toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  const displayedItems = useMemo(() => {
    if (!selectedCategory) return [];
    let items = allItems.filter((i) => i.categoryId === selectedCategory);
    const q = itemSearch.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (i) =>
          i.nameAL?.toLowerCase().includes(q) ||
          i.nameEN?.toLowerCase().includes(q) ||
          i.nameIT?.toLowerCase().includes(q) ||
          i.descriptionAL?.toLowerCase().includes(q)
      );
    }
    return sortItems(items);
  }, [allItems, selectedCategory, itemSearch]);

  const selectedCategoryData = useMemo(
    () => categories.find((c) => c.id === selectedCategory),
    [categories, selectedCategory]
  );

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await MenuService.updateCategory(editingCategory.id, categoryForm);
      } else {
        await MenuService.createCategory(categoryForm);
      }
      await refreshMenu(selectedCategory);
      resetCategoryForm();
    } catch (error) {
      setError(`Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  };

  const handleCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      nameAL: category.nameAL,
      nameEN: category.nameEN,
      nameIT: category.nameIT,
      slug: category.slug,
      displayOrder: category.displayOrder
    });
    setShowCategoryForm(true);
  };

  const handleCategoryDelete = async (categoryId) => {
    if (window.confirm('Are you sure? This will delete all items in this category.')) {
      try {
        await MenuService.deleteCategory(categoryId);
        const nextSelection = selectedCategory === categoryId ? null : selectedCategory;
        await refreshMenu(nextSelection);
      } catch (error) {
        setError('Failed to delete category');
      }
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      nameAL: '',
      nameEN: '',
      nameIT: '',
      slug: '',
      displayOrder: 0
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e, category, index) => {
    setDraggedCategory({ category, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedCategory || draggedCategory.index === dropIndex) {
      setDraggedCategory(null);
      return;
    }

    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(draggedCategory.index, 1);
    newCategories.splice(dropIndex, 0, movedCategory);

    // Update the display order for all categories
    const ordersToUpdate = newCategories.map((category, index) => ({
      id: category.id,
      displayOrder: index + 1
    }));

    try {
      // Optimistically update the UI
      setCategories(newCategories);
      
      // Update the server
      await MenuService.updateCategoryOrders(ordersToUpdate);
    } catch (error) {
      // Revert on error
      setError('Failed to update category order');
      await refreshMenu(selectedCategory);
    }

    setDraggedCategory(null);
  };

  // Menu item handlers
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError('Select a category first');
      return;
    }
    try {
      const itemData = {
        ...itemForm,
        nameEN: itemForm.nameEN || itemForm.nameAL,
        nameIT: itemForm.nameIT || itemForm.nameAL,
        price: parseFloat(itemForm.price),
        categoryId: selectedCategory,
      };
      
      if (editingItem) {
        await MenuService.updateMenuItem(editingItem.id, itemData);
      } else {
        await MenuService.createMenuItem(itemData);
      }
      await refreshMenu(selectedCategory);
      resetItemForm();
    } catch (error) {
      setError(`Failed to ${editingItem ? 'update' : 'create'} menu item`);
    }
  };

  const handleItemEdit = (item) => {
    setEditingItem(item);
    setItemForm({
      categoryId: item.categoryId,
      nameAL: item.nameAL,
      nameEN: item.nameEN,
      nameIT: item.nameIT,
      descriptionAL: item.descriptionAL || '',
      descriptionEN: item.descriptionEN || '',
      descriptionIT: item.descriptionIT || '',
      ingredientsAL: item.ingredientsAL || '',
      ingredientsEN: item.ingredientsEN || '',
      ingredientsIT: item.ingredientsIT || '',
      price: item.price.toString(),
      isVegetarian: item.isVegetarian,
      isSpicy: item.isSpicy,
      isRecommended: item.isRecommended,
      isNew: item.isNew,
      imageUrl: item.imageUrl || '',
      displayOrder: item.displayOrder,
      isKg: item.isKg || false
    });
    setShowItemForm(true);
  };

  const handleItemDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await MenuService.deleteMenuItem(itemId);
        await refreshMenu(selectedCategory);
      } catch (error) {
        setError('Failed to delete menu item');
      }
    }
  };

  const resetItemForm = () => {
    setItemForm({
      categoryId: '',
      nameAL: '',
      nameEN: '',
      nameIT: '',
      descriptionAL: '',
      descriptionEN: '',
      descriptionIT: '',
      ingredientsAL: '',
      ingredientsEN: '',
      ingredientsIT: '',
      price: '',
      isVegetarian: false,
      isSpicy: false,
      isRecommended: false,
      isNew: false,
      imageUrl: '',
      displayOrder: 0,
      isKg: false
    });
    setEditingItem(null);
    setShowItemForm(false);
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm({
      categoryId: selectedCategory || '',
      nameAL: '',
      nameEN: '',
      nameIT: '',
      descriptionAL: '',
      descriptionEN: '',
      descriptionIT: '',
      ingredientsAL: '',
      ingredientsEN: '',
      ingredientsIT: '',
      price: '',
      isVegetarian: false,
      isSpicy: false,
      isRecommended: false,
      isNew: false,
      imageUrl: '',
      displayOrder: displayedItems.length,
      isKg: false,
    });
    setShowItemForm(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportPreview(null);
    setImportFileName('');
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const handleImportFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Please upload an Excel file (.xlsx or .xls).');
      return;
    }

    setImportParsing(true);
    setError(null);
    setImportFileName(file.name);

    try {
      const parsed = await parseMenuExcelFile(file);
      setImportPreview(parsed);
      setShowImportModal(true);

      if (parsed.categories.length === 0 && parsed.items.length === 0) {
        setError('No menu rows found. Check that your sheet matches the template format.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not read the Excel file. Make sure it is a valid .xlsx or .xls file.');
    } finally {
      setImportParsing(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleClearMenu = async () => {
    if (categories.length === 0 && allItems.length === 0) {
      setError('Menu is already empty.');
      return;
    }

    const summary = `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} and ${allItems.length} item${allItems.length === 1 ? '' : 's'}`;
    if (
      !window.confirm(
        `Delete the entire menu?\n\nThis permanently removes ${summary}. You cannot undo this.`
      )
    ) {
      return;
    }
    if (!window.confirm('Are you absolutely sure? The menu will be empty.')) {
      return;
    }

    setClearingMenu(true);
    setError(null);

    try {
      const result = await MenuService.clearMenu();
      if (!result.success) {
        setError(result.error || 'Failed to clear menu');
        return;
      }

      setCategories([]);
      setAllItems([]);
      setSelectedCategory(null);
      setShowCategoryForm(false);
      setShowItemForm(false);
      closeImportModal();
    } catch (err) {
      console.error(err);
      setError('Failed to clear menu. Please try again.');
    } finally {
      setClearingMenu(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.categories?.length && !importPreview?.items?.length) return;

    setImporting(true);
    setError(null);

    try {
      const result = await MenuService.importMenu({
        categories: importPreview.categories,
        items: importPreview.items,
      });

      if (!result.success) {
        setError(result.error || 'Import failed');
        return;
      }

      const { createdCategories, updatedCategories, createdItems, updatedItems } =
        result.data || {};
      await refreshMenu();
      closeImportModal();
      const parts = [];
      if (createdCategories || updatedCategories) {
        parts.push(
          `${createdCategories || 0} new / ${updatedCategories || 0} updated categories`
        );
      }
      if (createdItems || updatedItems) {
        parts.push(`${createdItems || 0} new / ${updatedItems || 0} updated items`);
      }
      window.alert(`Menu imported successfully.\n${parts.join('\n')}`);
    } catch (err) {
      console.error(err);
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  // Generate slug from Albanian name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (loading) return <div className="loading">Loading menu…</div>;

  const renderItemBadges = (item) => (
    <div className="item-badges">
      {item.isVegetarian && <span className="badge vegetarian" title="Vegetarian">🌱</span>}
      {item.isSpicy && <span className="badge spicy" title="Spicy">🌶️</span>}
      {item.isRecommended && <span className="badge recommended" title="Recommended">⭐</span>}
      {item.isNew && <span className="badge new">NEW</span>}
      {item.isKg && <span className="badge kg">/kg</span>}
    </div>
  );

  return (
    <div className="menu-management">
      <div className="menu-management-header">
        <div className="menu-header-title">
          <h2>Menu</h2>
          <p className="menu-subtitle">
            {categories.length} categories · {allItems.length} items
          </p>
        </div>
        <div className="header-actions">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="import-file-input"
            onChange={handleImportFileSelect}
            aria-hidden
            tabIndex={-1}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => importInputRef.current?.click()}
            disabled={importParsing || clearingMenu}
          >
            {importParsing ? 'Reading…' : 'Import Excel'}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleClearMenu}
            disabled={clearingMenu || (categories.length === 0 && allItems.length === 0)}
            title="Delete all categories and items"
          >
            {clearingMenu ? 'Clearing…' : 'Clear menu'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCategoryForm(true)}>
            + Category
          </button>
          <button type="button" className="btn btn-secondary" onClick={openAddItem} disabled={!selectedCategory}>
            + Item
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {categories.length > 0 && (
        <div className="category-pills" role="tablist" aria-label="Categories">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === category.id}
              className={`category-pill ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category.id);
                setItemSearch('');
              }}
            >
              {category.nameAL}
              <span className="pill-count">{categoryCounts[category.id] || 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className="menu-content">
        <aside className="categories-sidebar">
          <div className="sidebar-header">
            <h3>Categories</h3>
            <span className="sidebar-hint">Drag to reorder</span>
          </div>
          <input
            type="search"
            className="menu-search"
            placeholder="Search categories…"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            aria-label="Search categories"
          />
          <div className="category-list">
            {filteredCategories.length === 0 ? (
              <p className="empty-hint">No categories match your search.</p>
            ) : (
              filteredCategories.map((category) => {
                const index = categories.findIndex((c) => c.id === category.id);
                return (
                  <div
                    key={category.id}
                    className={`category-item ${selectedCategory === category.id ? 'active' : ''} ${
                      dragOverIndex === index ? 'drag-over' : ''
                    } ${draggedCategory?.category.id === category.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, category, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setItemSearch('');
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="drag-handle" title="Drag to reorder" aria-hidden>⋮⋮</div>
                    <div className="category-info">
                      <h4>{category.nameAL}</h4>
                      <small>{category.nameEN}</small>
                    </div>
                    <span className="category-count">{categoryCounts[category.id] || 0}</span>
                    <div className="category-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Edit category"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryEdit(category);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Delete category"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryDelete(category.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section className="menu-items-section">
          {!selectedCategory ? (
            <div className="empty-state">
              <p>Add a category to start building your menu.</p>
              <button type="button" className="btn btn-primary" onClick={() => setShowCategoryForm(true)}>
                + Add Category
              </button>
            </div>
          ) : (
            <>
              <div className="items-toolbar">
                <div className="items-toolbar-title">
                  <h3>{selectedCategoryData?.nameAL}</h3>
                  <span className="items-meta">
                    {displayedItems.length}
                    {itemSearch ? ` of ${categoryCounts[selectedCategory] || 0}` : ''} items
                  </span>
                </div>
                <div className="items-toolbar-controls">
                  <input
                    type="search"
                    className="menu-search"
                    placeholder="Search items…"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    aria-label="Search menu items"
                  />
                  <div className="view-toggle" role="group" aria-label="View mode">
                    <button type="button" className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
                      List
                    </button>
                    <button type="button" className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                      Cards
                    </button>
                  </div>
                  <button type="button" className="btn btn-secondary btn-compact" onClick={openAddItem}>
                    + Item
                  </button>
                </div>
              </div>

              <div className="menu-items-body">
              {displayedItems.length === 0 ? (
                <div className="empty-state compact">
                  {itemSearch ? (
                    <p>No items match &ldquo;{itemSearch}&rdquo;.</p>
                  ) : (
                    <>
                      <p>No items in this category yet.</p>
                      <button type="button" className="btn btn-primary" onClick={openAddItem}>
                        + Add first item
                      </button>
                    </>
                  )}
                </div>
              ) : viewMode === 'list' ? (
                <div className="menu-items-list">
                  {displayedItems.map((item) => (
                    <article key={item.id} className="menu-item-row">
                      <div className="menu-item-row-main">
                        <div className="menu-item-row-head">
                          <h4>{item.nameAL}</h4>
                          <span className="price">
                            {item.price}
                            {item.isKg ? '/kg' : ''}
                          </span>
                        </div>
                        {item.descriptionAL && <p className="description">{item.descriptionAL}</p>}
                        {renderItemBadges(item)}
                      </div>
                      <div className="item-actions">
                        <button type="button" className="btn btn-small" onClick={() => handleItemEdit(item)}>Edit</button>
                        <button type="button" className="btn btn-small btn-danger" onClick={() => handleItemDelete(item.id)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="menu-items-grid">
                  {displayedItems.map((item) => (
                    <article key={item.id} className="menu-item-card">
                      <div className="item-header">
                        <h4>{item.nameAL}</h4>
                        <span className="price">{item.price}{item.isKg ? '/kg' : ''}</span>
                      </div>
                      {item.descriptionAL && <p className="description">{item.descriptionAL}</p>}
                      {renderItemBadges(item)}
                      <div className="item-actions">
                        <button type="button" className="btn btn-small" onClick={() => handleItemEdit(item)}>Edit</button>
                        <button type="button" className="btn btn-small btn-danger" onClick={() => handleItemDelete(item.id)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button 
                className="close-btn"
                onClick={resetCategoryForm}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label>Albanian Name</label>
                <input
                  type="text"
                  value={categoryForm.nameAL}
                  onChange={(e) => {
                    setCategoryForm({
                      ...categoryForm,
                      nameAL: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>English Name</label>
                <input
                  type="text"
                  value={categoryForm.nameEN}
                  onChange={(e) => setCategoryForm({...categoryForm, nameEN: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Italian Name</label>
                <input
                  type="text"
                  value={categoryForm.nameIT}
                  onChange={(e) => setCategoryForm({...categoryForm, nameIT: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({...categoryForm, displayOrder: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetCategoryForm}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item Form Modal */}
      {showItemForm && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>
                {editingItem ? 'Edit item' : 'Add item'}
                {selectedCategoryData && (
                  <span className="modal-category"> · {selectedCategoryData.nameAL}</span>
                )}
              </h3>
              <button 
                className="close-btn"
                onClick={resetItemForm}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="form-grid">
                {/* Names */}
                <div className="form-group">
                  <label>Albanian Name</label>
                  <input
                    type="text"
                    value={itemForm.nameAL}
                    onChange={(e) => setItemForm({...itemForm, nameAL: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>English Name <span className="label-hint">(optional)</span></label>
                  <input
                    type="text"
                    value={itemForm.nameEN}
                    onChange={(e) => setItemForm({...itemForm, nameEN: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Italian Name <span className="label-hint">(optional)</span></label>
                  <input
                    type="text"
                    value={itemForm.nameIT}
                    onChange={(e) => setItemForm({...itemForm, nameIT: e.target.value})}
                  />
                </div>

                {/* Descriptions */}
                <div className="form-group full-width">
                  <label>Albanian Description</label>
                  <textarea
                    value={itemForm.descriptionAL}
                    onChange={(e) => setItemForm({...itemForm, descriptionAL: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-group full-width">
                  <label>English Description</label>
                  <textarea
                    value={itemForm.descriptionEN}
                    onChange={(e) => setItemForm({...itemForm, descriptionEN: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Italian Description</label>
                  <textarea
                    value={itemForm.descriptionIT}
                    onChange={(e) => setItemForm({...itemForm, descriptionIT: e.target.value})}
                    rows="3"
                  />
                </div>

                {/* Ingredients */}
                <div className="form-group">
                  <label>Albanian Ingredients</label>
                  <input
                    type="text"
                    value={itemForm.ingredientsAL}
                    onChange={(e) => setItemForm({...itemForm, ingredientsAL: e.target.value})}
                    placeholder="Spinaq, djathë, vezë..."
                  />
                </div>
                <div className="form-group">
                  <label>English Ingredients</label>
                  <input
                    type="text"
                    value={itemForm.ingredientsEN}
                    onChange={(e) => setItemForm({...itemForm, ingredientsEN: e.target.value})}
                    placeholder="Spinach, cheese, eggs..."
                  />
                </div>
                <div className="form-group">
                  <label>Italian Ingredients</label>
                  <input
                    type="text"
                    value={itemForm.ingredientsIT}
                    onChange={(e) => setItemForm({...itemForm, ingredientsIT: e.target.value})}
                    placeholder="Spinaci, formaggio, uova..."
                  />
                </div>

                {/* Price and Properties */}
                <div className="form-group">
                  <label>Price (ALL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={itemForm.displayOrder}
                    onChange={(e) => setItemForm({...itemForm, displayOrder: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Image URL (optional)</label>
                  <input
                    type="url"
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm({...itemForm, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Checkboxes */}
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={itemForm.isVegetarian}
                      onChange={(e) => setItemForm({...itemForm, isVegetarian: e.target.checked})}
                    />
                    Vegetarian 🌱
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={itemForm.isSpicy}
                      onChange={(e) => setItemForm({...itemForm, isSpicy: e.target.checked})}
                    />
                    Spicy 🌶️
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={itemForm.isRecommended}
                      onChange={(e) => setItemForm({...itemForm, isRecommended: e.target.checked})}
                    />
                    Recommended ⭐
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={itemForm.isNew}
                      onChange={(e) => setItemForm({...itemForm, isNew: e.target.checked})}
                    />
                    New Item 🆕
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={itemForm.isKg}
                      onChange={(e) => setItemForm({...itemForm, isKg: e.target.checked})}
                    />
                    Kg ⚖️
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetItemForm}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Create'} Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && importPreview && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div
            className="modal large import-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="import-modal-title"
          >
            <div className="modal-header">
              <div>
                <h3 id="import-modal-title">Import menu from Excel</h3>
                <p className="import-modal-subtitle">{importFileName}</p>
              </div>
              <button type="button" className="btn-icon" onClick={closeImportModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="import-summary">
              <span>{importPreview.stats.categoryCount} categories</span>
              <span>{importPreview.stats.itemCount} items</span>
              {importPreview.errors.length > 0 && (
                <span className="import-warnings">
                  {importPreview.errors.length} row warning
                  {importPreview.errors.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <p className="import-hint">
              Columns: <strong>Category</strong> · <strong>Albanian Name</strong> ·{' '}
              <strong>English Name</strong> · <strong>Price (Lekë)</strong>. Use a section row with only
              the category (e.g. &quot;Sallata / Salad&quot;), then item rows below it.
            </p>

            {importPreview.errors.length > 0 && (
              <ul className="import-errors">
                {importPreview.errors.slice(0, 8).map((err) => (
                  <li key={`${err.row}-${err.message}`}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
                {importPreview.errors.length > 8 && (
                  <li>…and {importPreview.errors.length - 8} more</li>
                )}
              </ul>
            )}

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Albanian</th>
                    <th>English</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.categories.flatMap((cat) => {
                    const catItems = importPreview.items.filter((i) => i.categorySlug === cat.slug);
                    return [
                      <tr key={`cat-${cat.slug}`} className="import-row-section">
                        <td colSpan={4}>
                          {cat.nameAL} / {cat.nameEN}
                        </td>
                      </tr>,
                      ...catItems.map((item, idx) => (
                        <tr key={`${item.categorySlug}-${item.nameAL}-${idx}`}>
                          <td className="import-cell-muted">{cat.nameAL}</td>
                          <td>{item.nameAL}</td>
                          <td>{item.nameEN}</td>
                          <td className="import-cell-price">{item.price}</td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
              {importPreview.items.length > 200 && (
                <p className="import-more-hint">Showing first 200 items of {importPreview.items.length}.</p>
              )}
            </div>

            <div className="form-actions import-actions">
              <button type="button" onClick={closeImportModal} disabled={importing}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmImport}
                disabled={
                  importing ||
                  (importPreview.categories.length === 0 && importPreview.items.length === 0)
                }
              >
                {importing ? 'Importing…' : 'Import to menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuManagement; 