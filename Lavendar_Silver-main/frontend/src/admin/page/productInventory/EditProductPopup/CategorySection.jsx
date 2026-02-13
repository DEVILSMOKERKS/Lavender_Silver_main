import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../../../context/NotificationContext';
import './CategorySection.css';

const CategorySection = ({
    productId,
    formData,
    setFormData,
    onDataUpdate
}) => {
    const { showNotification } = useNotification();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [subSubcategories, setSubSubcategories] = useState([]);

    // Fetch categories hierarchy on component mount
    useEffect(() => {
        fetchCategoriesHierarchy();
    }, []);

    const fetchCategoriesHierarchy = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/admin/categories/hierarchy`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                const data = response.data.data;
                setCategories(data);

                // Extract all subcategories and sub-subcategories
                const allSubcategories = [];
                const allSubSubcategories = [];

                data.forEach(category => {
                    if (category.subcategories) {
                        category.subcategories.forEach(subcategory => {
                            allSubcategories.push({
                                ...subcategory,
                                category_id: category.id
                            });
                            if (subcategory.sub_subcategories) {
                                subcategory.sub_subcategories.forEach(subSubcategory => {
                                    allSubSubcategories.push({
                                        ...subSubcategory,
                                        subcategory_id: subcategory.id
                                    });
                                });
                            }
                        });
                    }
                });

                setSubcategories(allSubcategories);
                setSubSubcategories(allSubSubcategories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            showNotification(
                error.response?.data?.message || 'Error fetching categories',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/categories`,
                {
                    category_id: formData.category_id,
                    subcategory_id: formData.subcategory_id,
                    sub_subcategory_id: formData.sub_subcategory_id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                showNotification('Categories updated successfully', 'success');
                if (onDataUpdate) {
                    onDataUpdate();
                }
            }
        } catch (error) {
            console.error('Error updating categories:', error);
            showNotification(
                error.response?.data?.message || 'Error updating categories',
                'error'
            );
        } finally {
            setSaving(false);
        }
    };

    // Filter subcategories based on selected category
    const filteredSubcategories = useMemo(() => {
        if (!formData.category_id) return [];
        return subcategories.filter(
            sub => sub.category_id === parseInt(formData.category_id) || sub.category_id === formData.category_id
        );
    }, [subcategories, formData.category_id]);

    // Filter sub-subcategories based on selected subcategory
    const filteredSubSubcategories = useMemo(() => {
        if (!formData.subcategory_id) return [];
        return subSubcategories.filter(
            subSub => subSub.subcategory_id === parseInt(formData.subcategory_id) || subSub.subcategory_id === formData.subcategory_id
        );
    }, [subSubcategories, formData.subcategory_id]);

    // Memoized onChange handlers
    const handleCategoryChange = useCallback((e) => {
        const categoryId = e.target.value;
        setFormData(prev => ({
            ...prev,
            category_id: categoryId,
            subcategory_id: '',
            sub_subcategory_id: ''
        }));
    }, [setFormData]);

    const handleSubcategoryChange = useCallback((e) => {
        const subcategoryId = e.target.value;
        setFormData(prev => ({
            ...prev,
            subcategory_id: subcategoryId,
            sub_subcategory_id: ''
        }));
    }, [setFormData]);

    const handleSubSubcategoryChange = useCallback((e) => {
        const subSubcategoryId = e.target.value;
        setFormData(prev => ({
            ...prev,
            sub_subcategory_id: subSubcategoryId
        }));
    }, [setFormData]);

    if (loading) {
        return (
            <div className="category-section-container">
                <h3 className="category-section-title">Product Categories</h3>
                <div className="category-loading">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Loading categories...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="category-section-container">
            <div className="category-section-header">
                <h3 className="category-section-title">Product Categories</h3>
                <button
                    type="button"
                    onClick={fetchCategoriesHierarchy}
                    className="category-refresh-btn"
                    title="Refresh categories"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="category-form-grid">
                {/* Category Selection */}
                <div className="category-form-group">
                    <label>Category *</label>
                    <select
                        value={formData.category_id}
                        onChange={handleCategoryChange}
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Subcategory Selection */}
                <div className="category-form-group">
                    <label>Subcategory</label>
                    <select
                        value={formData.subcategory_id}
                        onChange={handleSubcategoryChange}
                        disabled={!formData.category_id}
                    >
                        <option value="">Select Subcategory</option>
                        {filteredSubcategories.map(subcategory => (
                            <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Sub-subcategory Selection */}
                <div className="category-form-group">
                    <label>Sub-subcategory</label>
                    <select
                        value={formData.sub_subcategory_id}
                        onChange={handleSubSubcategoryChange}
                        disabled={!formData.subcategory_id}
                    >
                        <option value="">Select Sub-subcategory</option>
                        {filteredSubSubcategories.map(subSubcategory => (
                            <option key={subSubcategory.id} value={subSubcategory.id}>
                                {subSubcategory.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Save Button */}
            <div className="category-form-actions">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="category-save-btn"
                >
                    {saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Categories
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CategorySection;
