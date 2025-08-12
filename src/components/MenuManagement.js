import React, { useState, useEffect, useCallback } from 'react';
import MenuService from '../services/menuService';
import './MenuManagement.css';

function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

  const loadMenuItems = useCallback(async (categoryId = selectedCategory) => {
    try {
      const result = await MenuService.getMenuItems(categoryId);
      if (result.success) {
        setMenuItems(result.data || []);
      } else {
        setError(result.error || 'Failed to load menu items');
      }
    } catch (error) {
      setError('Failed to load menu items');
      console.error(error);
    }
  }, [selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const result = await MenuService.getCategories();
      if (result.success) {
        const categoriesData = result.data || [];
        setCategories(categoriesData);
        if (categoriesData.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesData[0].id);
          loadMenuItems(categoriesData[0].id);
        }
      } else {
        setError(result.error || 'Failed to load categories');
      }
    } catch (error) {
      setError('Failed to load categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, loadMenuItems]);

  // Load data
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await MenuService.updateCategory(editingCategory.id, categoryForm);
      } else {
        await MenuService.createCategory(categoryForm);
      }
      await loadCategories();
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
        await loadCategories();
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
      await loadCategories();
    }

    setDraggedCategory(null);
  };

  // Menu item handlers
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        categoryId: selectedCategory
      };
      
      if (editingItem) {
        await MenuService.updateMenuItem(editingItem.id, itemData);
      } else {
        await MenuService.createMenuItem(itemData);
      }
      await loadMenuItems();
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
        await loadMenuItems();
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

  // Generate slug from Albanian name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (loading) return <div className="loading">Loading menu management...</div>;

  return (
    <div className="menu-management">
      <div className="menu-management-header">
        <h2>Menu Management</h2>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCategoryForm(true)}
          >
            + Add Category
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowItemForm(true)}
            disabled={!selectedCategory}
          >
            + Add Menu Item
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="menu-content">
        {/* Categories Sidebar */}
        <div className="categories-sidebar">
          <h3>Categories</h3>
          <div className="category-list">
            {categories.map((category, index) => (
              <div 
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''} ${
                  dragOverIndex === index ? 'drag-over' : ''
                } ${
                  draggedCategory?.category.id === category.id ? 'dragging' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, category, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => {
                  setSelectedCategory(category.id);
                  loadMenuItems(category.id);
                }}
              >
                <div className="drag-handle" title="Drag to reorder">
                  ⋮⋮
                </div>
                <div className="category-info">
                  <h4>{category.nameAL}</h4>
                  <small>{category.nameEN}</small>
                </div>
                <div className="category-actions">
                  <button 
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryEdit(category);
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryDelete(category.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="menu-items-section">
          {selectedCategory && (
            <>
              <h3>
                Menu Items - {categories.find(c => c.id === selectedCategory)?.nameAL}
              </h3>
              <div className="menu-items-grid">
                {menuItems.map(item => (
                  <div key={item.id} className="menu-item-card">
                    <div className="item-header">
                      <h4>{item.nameAL}</h4>
                      <span className="price">{item.price} {item.currency}</span>
                    </div>
                    <p className="description">{item.descriptionAL}</p>
                    <div className="item-badges">
                      {item.isVegetarian && <span className="badge vegetarian">🌱</span>}
                      {item.isSpicy && <span className="badge spicy">🌶️</span>}
                      {item.isRecommended && <span className="badge recommended">⭐</span>}
                      {item.isNew && <span className="badge new">NEW</span>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="btn btn-small"
                        onClick={() => handleItemEdit(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleItemDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
              <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
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
                  <label>English Name</label>
                  <input
                    type="text"
                    value={itemForm.nameEN}
                    onChange={(e) => setItemForm({...itemForm, nameEN: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Italian Name</label>
                  <input
                    type="text"
                    value={itemForm.nameIT}
                    onChange={(e) => setItemForm({...itemForm, nameIT: e.target.value})}
                    required
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
    </div>
  );
}

export default MenuManagement; 