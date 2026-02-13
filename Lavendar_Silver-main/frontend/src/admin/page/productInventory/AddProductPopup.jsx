import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { X, Upload, Plus, Trash2, X as CloseIcon } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import { AdminContext } from '../../../context/AdminContext';
import './AddProductPopup.css';

import {
    jewelryOptions,
    gemstoneTypes,
    statusOptions,
    unitsOptions,
    metalColorOptions,
    designTypeOptions,
    manufacturingTypeOptions,
    remarkOptions,
    batchOptions,
    certificateNumberOptions,
    unitOptions,
    labourTypeOptions,
    yesNoOptions,
    genderOptions,
    occasionOptions,
    lessWeightDatalistOptions
} from '../../../data/productOptions';

const AddProductPopup = ({ isOpen, onClose, onProductAdded }) => {
    const { showNotification } = useNotification();
    const { token: adminToken } = useContext(AdminContext);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedSubSubcategory, setSelectedSubSubcategory] = useState('');
    const [subSubcategories, setSubSubcategories] = useState([]);
    const [metalTypes, setMetalTypes] = useState([]);
    const [gemstones, setGemstones] = useState([]);
    const [gemstoneCatalog, setGemstoneCatalog] = useState([]);
    const [images, setImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [certificateFiles, setCertificateFiles] = useState([]);
    const [videos, setVideos] = useState([]);
    const [videoFiles, setVideoFiles] = useState([]);

    // Loading states for API fetches
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    const [loadingMetalTypes, setLoadingMetalTypes] = useState(false);

    // Existing options for reuse
    const [existingProducts, setExistingProducts] = useState([]); // For reference/validation

    // Flexible dropdown states
    const [showAddMetalType, setShowAddMetalType] = useState(false);
    const [showAddGemstone, setShowAddGemstone] = useState(false);
    const [showAddSubSubcategory, setShowAddSubSubcategory] = useState(false);
    const [newMetalType, setNewMetalType] = useState({ name: '', symbol: '', description: '', is_active: true, sort_order: 0 });
    const [newGemstone, setNewGemstone] = useState({
        name: '',
        type: '',
        description: '',
        image: null
    });
    const [newSubSubcategory, setNewSubSubcategory] = useState({ name: '', description: '' });
    const [addingMetalType, setAddingMetalType] = useState(false);
    const [addingGemstone, setAddingGemstone] = useState(false);
    const [addingSubSubcategory, setAddingSubSubcategory] = useState(false);
    const [deletingSubSubcategory, setDeletingSubSubcategory] = useState(null);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddSubcategory, setShowAddSubcategory] = useState(false);
    const [showLessWeightPopup, setShowLessWeightPopup] = useState(false);
    const [showProductOptionsPopup, setShowProductOptionsPopup] = useState(false);
    const [showProductFeaturesPopup, setShowProductFeaturesPopup] = useState(false);
    const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [deletingSubcategory, setDeletingSubcategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', image: null, status: 'active' });
    const [newSubcategory, setNewSubcategory] = useState({ name: '', slug: '', description: '', image: null, status: 'active' });
    const [addingCategory, setAddingCategory] = useState(false);
    const [addingSubcategory, setAddingSubcategory] = useState(false);

    const [formData, setFormData] = useState({
        sku: '',
        tag_number: '',
        description: '',
        status: 'active',
        created_by: '',

        // Product Data Entry fields
        batch: '',
        item_name: '',
        stamp: '',
        remark: '',
        unit: 'Gm',
        pieces: 1,
        additional_weight: '0',
        tunch: '100',
        wastage_percentage: '0',
        rate: '',
        diamond_weight: '',
        diamond_value: '',
        stone_weight: '',
        labour: '0',
        labour_on: 'Wt',
        other: '0',
        total_fine_weight: '',
        total_rs: '',

        // Design & Manufacturing fields
        design_type: '',
        manufacturing: '',
        customizable: false,
        engraving: false,
        hallmark: false,
        certificate_number: '',

        // Metal information
        metal_id: '',
        metal_purity_id: '',

        // Labour details (add missing fields)
        labour_type: 'Wt',
        labour_flat: '0',
        labour_percent: '0',
        labour_weight: '0',
        labour_value: '0'
    });

    // Add product input state (single item per product)
    const [productInput, setProductInput] = useState({
        supplier: '',
        remark: '',
        other_charges: '',
        rate: '',
        stone_weight: '',
        diamond_weight: '',
        touch: '',
        pc: '',
        stamp: '',
        pieces: 1,
        units: 'carat'
    });

    // Add product options state
    const [productOptions, setProductOptions] = useState([
        { size: '', weight: '', metal_color: '', gender: '', occasion: '', value: '', sell_price: '', quantity: 1 }
    ]);

    // Track if user has manually edited the stamp field
    const [userEditedStamp, setUserEditedStamp] = useState(false);

    // Add weight details state
    const [weightDetails, setWeightDetails] = useState({
        gross_weight: '',
        less_weight: '0',
        stone_weight: '',
        stone_pieces: '',
        stone_value: '',
        purchase_price: '',
        purchase_sell: '',
        actual_sell: '',
        sell_price: ''
    });

    // Add less weight popup state
    const [lessWeightItems, setLessWeightItems] = useState([
        {
            item: '',
            stamp: '',
            clarity: '',
            color: '',
            cuts: '',
            shapes: '',
            remarks: '',
            pieces: 1,
            weight: '',
            units: 'carat',
            tunch: '',
            purchase_value: '',
            sale_rate: '',
            profit: '',
            per_value: '',
            sale_value: ''
        }
    ]);
    const [lessWeightData, setLessWeightData] = useState({
        weight_reason: '',
        weight_description: '',
        weight_category: '',
        weight_notes: ''
    });





    // Add product features state
    const [productFeatures, setProductFeatures] = useState([
        {
            id: null,
            product_id: '',
            feature_points: '',
            created_at: '',
            updated_at: ''
        }
    ]);

    // Add feature input state for multiple inputs
    const [featureInputs, setFeatureInputs] = useState(['']);

    // Handler to update a product option
    const handleProductOptionChange = (idx, field, value) => {
        setProductOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt));
    };

    // Handler to add a new product option
    const addProductOption = () => {
        setProductOptions(prev => [...prev, { size: '', weight: '', metal_color: '', gender: '', occasion: '', value: '', sell_price: '', quantity: 1 }]);
    };

    // Handler to remove a product option
    const removeProductOption = (idx) => {
        setProductOptions(prev => {
            // Ensure at least one product option remains
            if (prev.length <= 1) {
                return prev;
            }
            return prev.filter((_, i) => i !== idx);
        });
    };

    // Handler to add a new feature input field
    const addFeatureInput = () => {
        setFeatureInputs(prev => [...prev, '']);
    };

    // Handler to update feature input
    const updateFeatureInput = (index, value) => {
        setFeatureInputs(prev => prev.map((input, i) => i === index ? value : input));
    };

    // Handler to remove feature input
    const removeFeatureInput = (index) => {
        setFeatureInputs(prev => prev.filter((_, i) => i !== index));
    };

    // Handler to save feature inputs to productFeatures
    const saveFeatureInputs = () => {
        const validInputs = featureInputs.filter(input => input.trim() !== '');

        if (validInputs.length > 0) {
            const featurePointsString = validInputs.join(',');

            setProductFeatures([{
                id: null,
                product_id: '',
                feature_points: featurePointsString,
                created_at: '',
                updated_at: ''
            }]);

        }
    };

    // Handler to update weight details
    const handleWeightDetailsChange = (field, value) => {
        setWeightDetails(prev => {
            const updated = { ...prev, [field]: value };
            return updated;
        });

        // Trigger total calculation when gross weight changes
        if (field === 'gross_weight') {
            // Force a re-render by updating a dependency that triggers the total calculation useEffect
            setTimeout(() => {
                setFormData(prev => ({
                    ...prev,
                    // Trigger the useEffect by updating a dependency
                    _weightUpdateTrigger: Date.now()
                }));
            }, 100);
        }

        // Trigger pricing update when weight changes (affects labour calculations)
        setTimeout(() => updatePricing(), 100);

        // Auto-fill product options weight when gross weight changes
        if (field === 'gross_weight' && value) {
            const grossWeight = parseFloat(value);
            if (grossWeight > 0) {
                setProductOptions(prev => prev.map(option => ({
                    ...option,
                    weight: grossWeight.toFixed(3)
                })));


            }
        }
    };

    const handleLessWeightItemChange = (index, field, value) => {
        setLessWeightItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // Auto-calculate fields based on weight, purchase_value, sale_rate, pieces, units, and tunch
            if (field === 'weight' || field === 'purchase_value' || field === 'sale_rate' || field === 'pieces' || field === 'units' || field === 'tunch') {
                const weight = parseFloat(updated[index].weight) || 0;
                const purchaseValue = parseFloat(updated[index].purchase_value) || 0;
                const saleRate = parseFloat(updated[index].sale_rate) || 0;
                const pieces = parseFloat(updated[index].pieces) || 1;
                const units = updated[index].units || 'carat';
                const tunch = parseFloat(updated[index].tunch) || 0;

                // Convert weight to grams for final calculation
                let weightInGrams = 0;
                switch (units) {
                    case 'carat':
                        weightInGrams = weight * 0.2; // 1 carat = 0.2 grams
                        break;
                    case 'gram':
                        weightInGrams = weight;
                        break;
                    case 'cent':
                        weightInGrams = weight * 0.01; // 1 cent = 0.01 grams
                        break;
                    case 'pc':
                        weightInGrams = weight * 0.1; // 1 pc = 0.1 grams (approximate)
                        break;
                    case 'kg':
                        weightInGrams = weight * 1000; // 1 kg = 1000 grams
                        break;
                    case 'ratti':
                        weightInGrams = weight * 0.182; // 1 ratti = 0.182 grams
                        break;
                    default:
                        weightInGrams = weight * 0.2; // Default to carat conversion
                }

                // Apply tunch calculation if provided
                let adjustedWeight = weightInGrams;
                if (tunch > 0) {
                    // Tunch is a percentage (e.g., 916 = 91.6%)
                    const tunchPercentage = tunch / 100;
                    adjustedWeight = weightInGrams * tunchPercentage;
                }

                // Calculate per value (weight * purchase_value per unit)
                const perValue = (weight * purchaseValue).toFixed(2);
                updated[index].per_value = perValue;

                // Calculate sale value (weight * sale_rate per unit)
                const saleValue = (weight * saleRate).toFixed(2);
                updated[index].sale_value = saleValue;

                // Calculate profit (sale_value - per_value)
                const profit = (parseFloat(saleValue) - parseFloat(perValue)).toFixed(2);
                updated[index].profit = profit;

                // Calculate pieces rate (per_value * pieces) - this is the total purchase value for all pieces
                const piecesRate = (parseFloat(perValue) * pieces).toFixed(2);
                updated[index].pieces_rate = piecesRate;

                // Calculate total sale rate (sale_value * pieces) - this is the total sale value for all pieces
                const totalSaleRate = (parseFloat(saleValue) * pieces).toFixed(2);
                updated[index].total_sale_rate = totalSaleRate;

                // Calculate total profit (profit * pieces)
                const totalProfit = (parseFloat(profit) * pieces).toFixed(2);
                updated[index].total_profit = totalProfit;

                // Store the weight in grams for reference
                updated[index].weight_in_grams = adjustedWeight.toFixed(3);
            }

            return updated;
        });

        // Mark as unsaved when user makes changes
        if (lessWeightData.saved) {
            setLessWeightData(prev => ({ ...prev, saved: false }));
        }
    };

    const addLessWeightItem = () => {
        setLessWeightItems(prev => [...prev, {
            item: '',
            stamp: '',
            clarity: '',
            color: '',
            cuts: '',
            shapes: '',
            remarks: '',
            pieces: 1,
            weight: '',
            units: 'carat',
            tunch: '',
            purchase_value: '',
            sale_rate: '',
            per_value: '',
            sale_value: '',
            pieces_rate: '',
            total_sale_rate: '',
            total_profit: '',
            weight_in_grams: ''
        }]);

        // Mark as unsaved when adding new items
        if (lessWeightData.saved) {
            setLessWeightData(prev => ({ ...prev, saved: false }));
        }
    };

    const removeLessWeightItem = (index) => {
        setLessWeightItems(prev => prev.filter((_, i) => i !== index));

        // Mark as unsaved when removing items
        if (lessWeightData.saved) {
            setLessWeightData(prev => ({ ...prev, saved: false }));
        }
    };

    const calculateTotalLessWeight = () => {
        return lessWeightItems.reduce((total, item) => {
            const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
            const units = item.units;

            // Convert to grams based on unit
            let weightInGrams = 0;
            switch (units) {
                case 'carat':
                    weightInGrams = weight * 0.2; // 1 carat = 0.2 grams
                    break;
                case 'gram':
                    weightInGrams = weight;
                    break;
                case 'cent':
                    weightInGrams = weight * 0.01; // 1 cent = 0.01 grams
                    break;
                case 'pc':
                    weightInGrams = weight * 0.1; // 1 pc = 0.1 grams (approximate)
                    break;
                case 'kg':
                    weightInGrams = weight * 1000; // 1 kg = 1000 grams
                    break;
                case 'ratti':
                    weightInGrams = weight * 0.182; // 1 ratti = 0.182 grams
                    break;
                default:
                    weightInGrams = weight * 0.2; // Default to carat conversion
            }

            return total + weightInGrams;
        }, 0).toFixed(3);
    };

    const handleLessWeightSubmit = () => {
        // Calculate total less weight in grams
        const totalLessWeight = calculateTotalLessWeight();

        // Calculate total diamond weight in carats from less weight items
        const totalDiamondWeight = lessWeightItems.reduce((total, item) => {
            if (!isDiamondItem(item)) return total;

            const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
            const units = item.units;

            // Convert to carats if needed
            let weightInCarats = 0;
            switch (units) {
                case 'carat':
                    weightInCarats = weight;
                    break;
                case 'gram':
                    weightInCarats = weight * 5; // 1 gram = 5 carats
                    break;
                case 'cent':
                    weightInCarats = weight * 0.05; // 1 cent = 0.05 carats
                    break;
                case 'pc':
                    weightInCarats = weight * 0.5; // 1 pc = 0.5 carats (approximate)
                    break;
                case 'kg':
                    weightInCarats = weight * 5000; // 1 kg = 5000 carats
                    break;
                case 'ratti':
                    weightInCarats = weight * 0.91; // 1 ratti = 0.91 carats
                    break;
                default:
                    weightInCarats = weight; // Default to carat
            }

            return total + weightInCarats;
        }, 0);

        // Calculate total stone weight in carats from less weight items
        const totalStoneWeight = lessWeightItems.reduce((total, item) => {
            if (!isStoneItem(item)) return total;

            const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
            const units = item.units;

            // Convert to carats if needed
            let weightInCarats = 0;
            switch (units) {
                case 'carat':
                    weightInCarats = weight;
                    break;
                case 'gram':
                    weightInCarats = weight * 5; // 1 gram = 5 carats
                    break;
                case 'cent':
                    weightInCarats = weight * 0.05; // 1 cent = 0.05 carats
                    break;
                case 'pc':
                    weightInCarats = weight * 0.5; // 1 pc = 0.5 carats (approximate)
                    break;
                case 'kg':
                    weightInCarats = weight * 5000; // 1 kg = 5000 carats
                    break;
                case 'ratti':
                    weightInCarats = weight * 0.91; // 1 ratti = 0.91 carats
                    break;
                default:
                    weightInCarats = weight; // Default to carat
            }

            return total + weightInCarats;
        }, 0);

        // Update weight details
        setWeightDetails(prev => ({ ...prev, less_weight: totalLessWeight }));

        // Update diamond weight in form data if diamond items are present
        if (totalDiamondWeight > 0) {
            setFormData(prev => ({
                ...prev,
                diamond_weight: totalDiamondWeight.toFixed(3)
            }));
        }

        // Update stone weight in form data if stone items are present
        if (totalStoneWeight > 0) {
            setFormData(prev => ({
                ...prev,
                stone_weight: totalStoneWeight.toFixed(3)
            }));
        }

        // Calculate and update diamond value (using sell value instead of purchase value)
        const totalDiamondValue = lessWeightItems.reduce((total, item) => {
            if (!isDiamondItem(item)) return total;
            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0);

        // Update diamond value in formData
        setFormData(prev => ({
            ...prev,
            diamond_value: totalDiamondValue.toFixed(2)
        }));

        // Calculate and update total sell value from all items
        const totalSellValue = lessWeightItems.reduce((total, item) => {
            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0);



        // Close modal and show success message
        setLessWeightData(prev => ({ ...prev, showModal: false, saved: true }));
        showNotification('Less weight data saved successfully', 'success');

        // Always close the popup after saving
        setShowLessWeightPopup(false);
    };

    const handleLessWeightCancel = () => {
        // Check if there are unsaved changes
        const hasUnsavedChanges = lessWeightItems.some(item =>
            item.item || item.stamp || item.clarity || item.color ||
            item.cuts || item.shapes || item.remarks ||
            item.weight || item.tunch || item.pur_rate ||
            item.profit || item.sale_rate
        );

        if (hasUnsavedChanges && !lessWeightData.saved) {
            // Ask user if they want to save before closing
            if (window.confirm('You have unsaved changes. Do you want to save them before closing?')) {
                handleLessWeightSubmit();
            }
        }

        // Just close the popup without resetting the data
        // The data will be preserved and can be accessed when the popup is reopened
        setShowLessWeightPopup(false);
        // Don't reset lessWeightItems - keep the user's data
        // Don't reset lessWeightData - keep the user's data
    };



    // Flexible dropdown handlers
    const handleAddMetalType = async () => {
        if (!newMetalType.name.trim()) {
            showNotification('Metal type name is required', 'error');
            return;
        }

        if (!newMetalType.symbol.trim()) {
            showNotification('Metal symbol is required', 'error');
            return;
        }

        setAddingMetalType(true);
        try {
            const metalTypeData = {
                name: newMetalType.name.trim(),
                symbol: newMetalType.symbol.trim(),
                description: newMetalType.description.trim(),
                is_active: newMetalType.is_active,
                sort_order: newMetalType.sort_order
            };

            const response = await axios.post(`${API_BASE_URL}/metal-rates/metal-types`, metalTypeData, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            if (response.data.success) {
                const newMetalTypeData = response.data.data || response.data;
                setMetalTypes(prev => [...prev, newMetalTypeData]);
                setNewMetalType({ name: '', symbol: '', description: '', is_active: true, sort_order: 0 });
                setShowAddMetalType(false);
                showNotification('Metal type added successfully', 'success');
            }
        } catch (error) {
            showNotification('Error adding metal type', error.response?.data?.message || 'error');
        } finally {
            setAddingMetalType(false);
        }
    };

    const handleAddGemstone = async () => {
        if (!newGemstone.name.trim()) {
            showNotification('Gemstone name is required', 'error');
            return;
        }

        setAddingGemstone(true);
        try {
            const gemstoneData = {
                name: newGemstone.name.trim(),
                type: newGemstone.type,
                description: newGemstone.description.trim(),
                is_active: newGemstone.is_active,
                sort_order: newGemstone.sort_order
            };

            const response = await axios.post(`${API_BASE_URL}/gemstones`, gemstoneData, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            if (response.data.success) {
                const newGemstoneData = response.data.data || response.data;
                setGemstones(prev => [...prev, newGemstoneData]);
                setNewGemstone({ name: '', type: 'other', description: '', is_active: true, sort_order: 0 });
                setShowAddGemstone(false);
                showNotification('Gemstone added successfully', 'success');
            }
        } catch (error) {
            showNotification('Error adding gemstone', error.response?.data?.message || 'error');
        } finally {
            setAddingGemstone(false);
        }
    };

    const handleAddSubSubcategory = async () => {
        if (!newSubSubcategory.name.trim() || !selectedSubcategory) {
            showNotification('Sub-subcategory name and subcategory are required', 'error');
            return;
        }

        setAddingSubSubcategory(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/sub-subcategories`, {
                name: newSubSubcategory.name,
                subcategory_id: selectedSubcategory,
                description: newSubSubcategory.description
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            if (response.data.success) {
                setSubSubcategories(prev => [...prev, response.data.data]);
                setNewSubSubcategory({ name: '', description: '' });
                setShowAddSubSubcategory(false);
                showNotification('Sub-subcategory added successfully', 'success');
            }
        } catch (error) {
            showNotification('Error adding sub-subcategory', error.response?.data?.message || 'error');
        } finally {
            setAddingSubSubcategory(false);
        }
    };

    const handleDeleteSubSubcategory = async (subSubcategoryId) => {
        if (!window.confirm('Are you sure you want to delete this sub-subcategory?')) return;

        setDeletingSubSubcategory(subSubcategoryId);
        try {
            const response = await axios.delete(`${API_BASE_URL}/sub-subcategories/${subSubcategoryId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            if (response.data.success) {
                setSubSubcategories(prev => prev.filter(ssc => ssc.id !== subSubcategoryId));
                showNotification('Sub-subcategory deleted successfully', 'success');
            }
        } catch (error) {
            showNotification('Error deleting sub-subcategory', error.response?.data?.message || 'error');
        } finally {
            setDeletingSubSubcategory(null);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            showNotification('Category name is required', 'error');
            return;
        }

        // Generate slug from name if not provided
        const slug = newCategory.slug.trim() || newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        setAddingCategory(true);
        try {
            const formData = new FormData();
            formData.append('name', newCategory.name.trim());
            formData.append('slug', slug);
            formData.append('description', newCategory.description.trim());
            formData.append('status', newCategory.status);

            if (newCategory.image) {
                formData.append('image', newCategory.image);
            }

            const response = await axios.post(`${API_BASE_URL}/categories`, formData, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                showNotification('Category added successfully', 'success');
                setNewCategory({ name: '', slug: '', description: '', image: null, status: 'active' });
                setShowAddCategory(false);
                await fetchCategories();
            } else {
                showNotification(response.data.message || 'Failed to add category', 'error');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showNotification('Error adding category', 'error');
        } finally {
            setAddingCategory(false);
        }
    };

    // Handle image file changes for categories and subcategories
    const handleCategoryImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewCategory(prev => ({ ...prev, image: file }));
        }
    };

    const handleSubcategoryImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewSubcategory(prev => ({ ...prev, image: file }));
        }
    };



    const handleAddSubcategory = async () => {
        if (!newSubcategory.name.trim()) {
            showNotification('Subcategory name is required', 'error');
            return;
        }

        if (!selectedCategory) {
            showNotification('Please select a category first', 'error');
            return;
        }

        // Generate slug from name if not provided
        const slug = newSubcategory.slug.trim() || newSubcategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        setAddingSubcategory(true);
        try {
            const formData = new FormData();
            formData.append('name', newSubcategory.name.trim());
            formData.append('slug', slug);
            formData.append('description', newSubcategory.description.trim());
            formData.append('status', newSubcategory.status);
            formData.append('category_id', selectedCategory);

            if (newSubcategory.image) {
                formData.append('image', newSubcategory.image);
            }

            const response = await axios.post(`${API_BASE_URL}/subcategories`, formData, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                showNotification('Subcategory added successfully', 'success');
                setNewSubcategory({ name: '', slug: '', description: '', image: null, status: 'active' });
                setShowAddSubcategory(false);
                await fetchSubcategories(selectedCategory);
            } else {
                showNotification(response.data.message || 'Failed to add subcategory', 'error');
            }
        } catch (error) {
            console.error('Error adding subcategory:', error);
            showNotification('Error adding subcategory', 'error');
        } finally {
            setAddingSubcategory(false);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        setDeletingCategory(categoryId);
        try {
            const response = await axios.delete(`${API_BASE_URL}/categories/${categoryId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            if (response.data.success) {
                showNotification('Category deleted successfully', 'success');
                await fetchCategories();
                setSelectedCategory('');
                setSelectedSubcategory('');
                setSelectedSubSubcategory('');
            } else {
                showNotification(response.data.message || 'Failed to delete category', 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showNotification('Error deleting category', 'error');
        } finally {
            setDeletingCategory(null);
        }
    };

    const handleDeleteSubcategory = async (subcategoryId) => {
        if (!window.confirm('Are you sure you want to delete this subcategory?')) return;

        setDeletingSubcategory(subcategoryId);
        try {
            const response = await axios.delete(`${API_BASE_URL}/subcategories/${subcategoryId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            if (response.data.success) {
                showNotification('Subcategory deleted successfully', 'success');
                await fetchSubcategories(selectedCategory);
                setSelectedSubcategory('');
                setSelectedSubSubcategory('');
            } else {
                showNotification(response.data.message || 'Failed to delete subcategory', 'error');
            }
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            showNotification('Error deleting subcategory', 'error');
        } finally {
            setDeletingSubcategory(null);
        }
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

    // Restore fetchCategories, fetchSubcategories, fetchProducts
    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/categories`);
            const data = response.data.success ? response.data.data : response.data;
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            showNotification('Error fetching categories', error.response?.data?.message || 'error');
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchSubcategories = async (categoryId) => {
        setLoadingSubcategories(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/subcategories/category/${categoryId}`);
            const data = response.data.success ? response.data.data : response.data;
            setSubcategories(Array.isArray(data) ? data : []);
        } catch (error) {
            showNotification('Error fetching subcategories', error.response?.data?.message || 'error');
        } finally {
            setLoadingSubcategories(false);
        }
    };

    const fetchSubSubcategories = async (subcategoryId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sub-subcategories?subcategory_id=${subcategoryId}`);
            const data = response.data.success ? response.data.data : response.data;
            setSubSubcategories(Array.isArray(data) ? data : []);
        } catch (error) {
            showNotification('Error fetching sub-subcategories', error.response?.data?.message || 'error');
        }
    };

    const fetchMetalTypes = async () => {
        setLoadingMetalTypes(true);
        try {

            // Fetch current metal rates directly - this contains all the data we need
            const ratesResponse = await axios.get(`${API_BASE_URL}/metal-rates/rates/current`);


            const ratesData = ratesResponse.data.success ? ratesResponse.data.data : ratesResponse.data;


            if (Array.isArray(ratesData)) {

                // Use the rates data directly as metal types since it contains all the information
                const processedMetalTypes = ratesData.map(rate => ({
                    id: rate.metal_type_id, // This is the metal_type_id (1, 2, 3, etc.)
                    metal_id: rate.metal_type_id, // Add metal_id field for product options
                    name: rate.metal_name,
                    symbol: rate.metal_symbol,
                    rate_per_gram: rate.rate_per_gram,
                    rate_per_10g: rate.rate_per_10g,
                    purity_name: rate.purity_name,
                    purity_value: rate.purity_value,
                    tunch_value: rate.tunch_value, // Add tunch_value field
                    purity_id: rate.purity_id, // Add purity_id field
                    metal_name: rate.metal_name,
                    metal_symbol: rate.metal_symbol,
                    source: rate.source,
                    updated_by: rate.updated_by,
                    is_live: rate.is_live,
                    created_at: rate.created_at,
                    updated_at: rate.updated_at
                }));


                setMetalTypes(processedMetalTypes);
            } else {

                setMetalTypes([]);
            }
        } catch (error) {
            console.error('❌ Error fetching metal types:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error fetching metal rates';
            showNotification(`Metal rates error: ${errorMsg}`, 'error');
            setMetalTypes([]);
        } finally {
            setLoadingMetalTypes(false);
        }
    };

    const fetchGemstones = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/gemstones`);
            const data = response.data.success ? response.data.data : response.data;
            setGemstones(Array.isArray(data) ? data : []);
        } catch (error) {
            showNotification('Error fetching gemstones', error.response?.data?.message || 'error');
        }
    };

    const fetchGemstoneCatalog = async () => {
        try {

            const response = await axios.get(`${API_BASE_URL}/gemstone-catalog`);


            if (response.data.success) {

                setGemstoneCatalog(response.data.data);
            } else {
                console.warn('⚠️ Gemstone catalog response not successful:', response.data);
            }
        } catch (error) {
            console.error('Error fetching gemstone catalog:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
            const response = await axios.get(`${API_BASE_URL}/products?limit=1000`, { headers });
            setExistingProducts(response.data.success ? response.data.data : []);
        } catch (error) {
            // Not critical, so no notification
            console.error('Error fetching products:', error?.response?.data?.message || error?.message);
        }
    };

    const generateTagNumber = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products/generate-tag`);
            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    tag_number: response.data.data.tag_number
                }));
            }
        } catch (error) {
            console.error('Error generating tag number:', error);
            // Fallback: generate a simple tag number
            const timestamp = Date.now().toString().slice(-6);
            const currentYear = new Date().getFullYear().toString().slice(-2);
            const fallbackTag = `TAG${currentYear}${timestamp}`;
            setFormData(prev => ({
                ...prev,
                tag_number: fallbackTag
            }));
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchProducts();
            fetchMetalTypes();
            fetchGemstones();
            fetchGemstoneCatalog();
            generateTagNumber();
            // Auto-generate product code and initial SKU
            setFormData(prev => ({
                ...prev,
                product_code: generateProductCode(),
                sku: `PRD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            }));
        }
    }, [isOpen]);

    // Update pricing when relevant fields change
    useEffect(() => {
        if (isOpen) {
            updatePricing();
        }
    }, [formData.metal_cost, formData.diamond_cost, formData.making_charges, formData.markup_percentage, formData.labour_flat, formData.labour_percent, formData.labour_weight, weightDetails.gross_weight, weightDetails.less_weight]);

    useEffect(() => {
        if (selectedCategory) {
            fetchSubcategories(selectedCategory);
        } else {
            setSubcategories([]);
            setSelectedSubcategory('');
            setSelectedSubSubcategory('');
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedSubcategory) {
            fetchSubSubcategories(selectedSubcategory);
        } else {
            setSubSubcategories([]);
            setSelectedSubSubcategory('');
        }
    }, [selectedSubcategory]);

    // Auto-populate Specifications based on other form data
    useEffect(() => {
        if (isOpen) {
            // Auto-populate dimensions based on product options
            if (productOptions.length > 0 && productOptions[0].size) {
                setFormData(prev => ({
                    ...prev,
                    dimensions: `${productOptions[0].size}mm x ${productOptions[0].size}mm`
                }));
            }

            // Auto-populate product weight based on weight details
            if (weightDetails.gross_weight) {
                setFormData(prev => ({
                    ...prev,
                    product_weight: `${weightDetails.gross_weight}g`
                }));
            }

            // Auto-populate diamond weight based on product input
            if (productInput.diamond_weight) {
                setFormData(prev => ({
                    ...prev,
                    diamond_total_weight: productInput.diamond_weight
                }));
            }



            // Auto-populate metal weight based on weight details
            if (weightDetails.gross_weight) {
                const netWeight = parseFloat(weightDetails.gross_weight) - parseFloat(weightDetails.less_weight || 0);
                setFormData(prev => ({
                    ...prev,
                    metal_weight: netWeight.toFixed(2)
                }));
            }
        }
    }, [isOpen, weightDetails, productInput]);



    // Auto-update product options when total value changes
    useEffect(() => {
        if (formData.total && productOptions.length > 0) {
            setProductOptions(prev => prev.map(option => {
                const totalValue = parseFloat(formData.total || 0);
                const extraValue = parseFloat(option.value || 0);
                const newSellPrice = totalValue + extraValue;

                return {
                    ...option,
                    sell_price: newSellPrice.toFixed(2)
                };
            }));
        }
    }, [formData.total]);

    // Auto-update weight to final weight when weight details change
    useEffect(() => {
        if (productOptions.length > 0) {
            const finalWeight = calculateFineValue();
            if (finalWeight && parseFloat(finalWeight) > 0) {
                setProductOptions(prev => prev.map(option => ({
                    ...option,
                    weight: finalWeight
                })));
            }
        }
    }, [weightDetails.gross_weight, weightDetails.less_weight, formData.additional_weight, formData.tunch, formData.wastage]);

    // Auto-sync metal type and ID when stamp changes (but keep stamp value as admin entered)
    useEffect(() => {
        if (productOptions.length > 0 && formData.stamp && !userEditedStamp) {
            const { metal_type, metal_id } = parseStampAndFindMetalType(formData.stamp);
            setProductOptions(prev => prev.map(option => ({
                ...option,
                metal_type: metal_type || option.metal_type,
                metal_id: metal_id || option.metal_id
                // Don't change metal_purity - keep admin's input as is
            })));
        }
    }, [formData.stamp, metalTypes, userEditedStamp]);

    // Auto-regenerate SKU when item name changes (using backend API)
    useEffect(() => {
        const updateSKU = async () => {
            if (isOpen && formData.item_name && formData.item_name.trim() !== '') {
                try {
                    const newSKU = await generateSKU();
                    setFormData(prev => ({
                        ...prev,
                        sku: newSKU
                    }));
                } catch (error) {
                    console.error('Failed to update SKU:', error);
                }
            }
        };

        updateSKU();
    }, [formData.item_name, isOpen]);

    // Auto-sync sell price when total changes
    useEffect(() => {
        if (productOptions.length > 0 && formData.total) {
            setProductOptions(prev => prev.map(option => ({
                ...option,
                sell_price: formData.total || formData.total_rs || option.sell_price
            })));
        }
    }, [formData.total, formData.total_rs]);

    // Remove all add/remove/isSelected handlers for old options

    // Function to handle Enter key press and move to next field
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Get all form inputs and selects
            const formElements = e.target.closest('.Add-product-form').querySelectorAll('input:not([readonly]):not([type="file"]):not([type="button"]), select, textarea');
            const currentIndex = Array.from(formElements).indexOf(e.target);

            // Move to next element if available
            if (currentIndex < formElements.length - 1) {
                formElements[currentIndex + 1].focus();
            }
        }
    };

    // Enhanced keyboard navigation for specific fields
    const handleEnhancedKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            const fieldName = e.target.name;

            // Specific navigation logic
            if (fieldName === 'gross_weight') {
                // Move to Less Weight field and open popup
                const lessWeightInput = e.target.closest('.Add-product-form').querySelector('input[placeholder="0.000"][readonly]');
                if (lessWeightInput) {
                    lessWeightInput.focus();
                    setShowLessWeightPopup(true);
                }
            } else if (fieldName === 'total') {
                // Move to Product Options button and open popup
                const productOptionsButton = e.target.closest('.Add-product-form').querySelector('button[name="product_options_button"]');
                if (productOptionsButton) {
                    productOptionsButton.focus();
                    setShowProductOptionsPopup(true);
                    // Auto-populate if no options exist
                    if (productOptions.length === 0) {
                        setTimeout(() => autoPopulateProductOptions(), 100);
                    }
                }
            } else if (fieldName === 'product_options_button') {
                // Open Product Options popup
                setShowProductOptionsPopup(true);
                // Auto-populate if no options exist
                if (productOptions.length === 0) {
                    setTimeout(() => autoPopulateProductOptions(), 100);
                }
                // Move to Product Features button after opening popup
                setTimeout(() => {
                    const productFeaturesButton = e.target.closest('.Add-product-form').querySelector('button[name="product_features_button"]');
                    if (productFeaturesButton) {
                        productFeaturesButton.focus();
                    }
                }, 100);
            } else if (fieldName === 'product_features_button') {
                // Open Product Features popup
                setShowProductFeaturesPopup(true);
                // Move to Description button after opening popup
                setTimeout(() => {
                    const descriptionButton = e.target.closest('.Add-product-form').querySelector('input[name="description_button"]');
                    if (descriptionButton) {
                        descriptionButton.focus();
                    }
                }, 100);
            } else if (fieldName === 'description_button') {
                // Open Description popup
                setShowDescriptionPopup(true);
                // Move to next field after opening popup
                setTimeout(() => {
                    const nextField = e.target.closest('.Add-product-form').querySelector('select[name="design_type"]');
                    if (nextField) {
                        nextField.focus();
                    }
                }, 100);
            } else if (fieldName === 'less_weight_button') {
                // Open Less Weight popup
                setShowLessWeightPopup(true);
            } else {
                // Default navigation behavior
                handleKeyDown(e);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle labour value input - set value in the appropriate field based on labour type
        if (name === 'labour_value') {
            setFormData(prev => {
                const newData = { ...prev };
                // Clear all labour fields first
                newData.labour_flat = '';
                newData.labour_percent = '';
                newData.labour_weight = '';

                // Set the value in the appropriate field based on current labour type
                const labourValue = value || ''; // Keep empty if no value
                if (prev.labour_type === 'Fl') {
                    newData.labour_flat = labourValue;
                } else if (prev.labour_type === 'Pc') {
                    newData.labour_percent = labourValue;
                } else if (prev.labour_type === 'Wt') {
                    newData.labour_weight = labourValue;
                }


                return newData;
            });
        }
        // Handle labour type change - preserve the labour value and recalculate
        else if (name === 'labour_type') {
            setFormData(prev => {
                // Get the current labour value from the input field based on current type
                let currentValue = '';
                if (prev.labour_type === 'Fl') {
                    currentValue = prev.labour_flat || '';
                } else if (prev.labour_type === 'Pc') {
                    currentValue = prev.labour_percent || '';
                } else if (prev.labour_type === 'Wt') {
                    currentValue = prev.labour_weight || '';
                }


                // Create new data object with all labour fields cleared
                const newData = {
                    ...prev,
                    labour_flat: '',
                    labour_percent: '',
                    labour_weight: '',
                    labour_type: value,
                    labour_on: value // Update labour_on to match labour_type
                };

                // Set the value in the appropriate field based on new type
                if (value === 'Fl') {
                    newData.labour_flat = currentValue;
                } else if (value === 'Pc') {
                    newData.labour_percent = currentValue;
                } else if (value === 'Wt') {
                    newData.labour_weight = currentValue;
                }


                return newData;
            });
        }
        // Handle stamp field - keep admin's input as is, don't auto-change
        else if (name === 'stamp') {
            setFormData(prev => ({ ...prev, [name]: value }));
            // Mark that user has manually edited the stamp field
            setUserEditedStamp(true);

            // Auto-populate metal_id, metal_purity_id, and rate based on stamp selection
            if (value) {
                const { metal_id, metal_purity_id, rate } = parseStampAndFindMetalType(value);



                if (metal_id) {

                    setFormData(prev => {
                        const newData = {
                            ...prev,
                            metal_id: metal_id.toString(),
                            metal_purity_id: metal_purity_id || '',
                            rate: rate || ''
                        };

                        return newData;
                    });

                    // Trigger pricing update after rate is set
                    if (rate) {
                        setTimeout(() => {

                            updatePricing();
                            // Also trigger the useEffect that watches for rate changes
                            setFormData(prev => ({
                                ...prev,
                                _rateUpdateTrigger: Date.now()
                            }));
                        }, 100);
                    } else {
                        // If no rate found, clear rate field
                        setFormData(prev => ({
                            ...prev,
                            rate: ''
                        }));
                    }
                } else {
                    // If no metal type found, clear metal_id, metal_purity_id, and rate
                    setFormData(prev => ({
                        ...prev,
                        metal_id: '',
                        metal_purity_id: '',
                        rate: ''
                    }));
                }
            } else {
                // Clear metal_id, metal_purity_id, and rate if stamp is cleared
                setFormData(prev => ({
                    ...prev,
                    metal_id: '',
                    metal_purity_id: '',
                    rate: ''
                }));
            }

            // Note: Rate auto-fill is now handled in the parseStampAndFindMetalType section above
            // This section is kept for any additional stamp-specific logic if needed
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Trigger pricing update for relevant fields
        if (['metal_cost', 'diamond_cost', 'making_charges', 'markup_percentage', 'labour_flat', 'labour_percent', 'labour_weight', 'labour_type', 'labour_value', 'rate'].includes(name)) {
            updatePricing();
        }

        // Special handling for stamp field to ensure pricing updates when rate is auto-filled
        if (name === 'stamp' && value) {
            setTimeout(() => {
                updatePricing();
            }, 200);
        }
    };

    // Helper function to parse stamp and find metal type - Generic and flexible matching
    const parseStampAndFindMetalType = (stampValue) => {
        if (!stampValue || !metalTypes.length) {
            return { metal_type: '', metal_id: '', metal_purity: '', metal_purity_id: '', rate: '' };
        }

        try {
            const normalizedStamp = stampValue.trim().toUpperCase();

            // Extract all numbers from stamp (potential tunch values)
            const numbersInStamp = stampValue.match(/\d+/g) || [];
            const numbers = numbersInStamp.map(n => parseInt(n, 10));

            // Extract all text/words from stamp (potential purity names or metal names)
            const wordsInStamp = stampValue.match(/[A-Za-z]+/g) || [];
            const words = wordsInStamp.map(w => w.toUpperCase().trim()).filter(w => w.length > 0);

            // Extract karat pattern (e.g., "24K", "22K")
            const karatPattern = stampValue.match(/(\d+K)/i);
            const karatValue = karatPattern ? karatPattern[1].toUpperCase() : null;

            let matchingMetalType = null;

            // Strategy 1: Exact match with stamp value (case-insensitive)
            // Try matching by constructing stamp from API data and comparing
            matchingMetalType = metalTypes.find(metalType => {
                if (metalType.purity_name && metalType.tunch_value) {
                    const apiTunchValue = Math.round(parseFloat(metalType.tunch_value));
                    const apiPurityName = metalType.purity_name.toUpperCase();
                    const constructedStamp = `${apiPurityName} / ${apiTunchValue}`;
                    return constructedStamp.toUpperCase() === normalizedStamp ||
                        constructedStamp.replace(/\s+/g, ' ').toUpperCase() === normalizedStamp.replace(/\s+/g, ' ');
                }
                return false;
            });

            // Strategy 2: Match by tunch value and purity_name/karat
            if (!matchingMetalType && numbers.length > 0) {
                const tunchValue = numbers[numbers.length - 1]; // Use last number as tunch value

                if (karatValue) {
                    // Match by karat and tunch
                    matchingMetalType = metalTypes.find(metalType => {
                        if (metalType.purity_name && metalType.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(metalType.tunch_value));
                            const apiKaratValue = metalType.purity_name.toUpperCase();
                            return apiKaratValue === karatValue && apiTunchValue === tunchValue;
                        }
                        return false;
                    });
                }

                // If still not found, try matching by tunch value and any word in purity_name
                if (!matchingMetalType && words.length > 0) {
                    matchingMetalType = metalTypes.find(metalType => {
                        if (metalType.purity_name && metalType.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(metalType.tunch_value));
                            const apiPurityName = metalType.purity_name.toUpperCase();
                            const tunchMatches = apiTunchValue === tunchValue;
                            const wordMatches = words.some(word => apiPurityName.includes(word)) ||
                                words.some(word => word.includes(apiPurityName)) ||
                                apiPurityName.includes(words.join(' '));
                            return tunchMatches && wordMatches;
                        }
                        return false;
                    });
                }

                // If still not found, try matching by tunch value and metal_name
                if (!matchingMetalType && words.length > 0) {
                    matchingMetalType = metalTypes.find(metalType => {
                        if (metalType.metal_name && metalType.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(metalType.tunch_value));
                            const apiMetalName = metalType.metal_name.toUpperCase();
                            const tunchMatches = apiTunchValue === tunchValue;
                            const wordMatches = words.some(word => apiMetalName.includes(word));
                            return tunchMatches && wordMatches;
                        }
                        return false;
                    });
                }

                // If still not found, try matching by tunch value only (last resort)
                if (!matchingMetalType) {
                    matchingMetalType = metalTypes.find(metalType => {
                        if (metalType.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(metalType.tunch_value));
                            return apiTunchValue === tunchValue;
                        }
                        return false;
                    });
                }
            }

            // Strategy 3: Match by karat only (if no tunch value found)
            if (!matchingMetalType && karatValue) {
                matchingMetalType = metalTypes.find(metalType => {
                    if (metalType.purity_name) {
                        const apiKaratValue = metalType.purity_name.toUpperCase();
                        return apiKaratValue === karatValue;
                    }
                    return false;
                });
            }

            // Strategy 4: Fuzzy match by words in purity_name or metal_name
            if (!matchingMetalType && words.length > 0) {
                matchingMetalType = metalTypes.find(metalType => {
                    const apiPurityName = (metalType.purity_name || '').toUpperCase();
                    const apiMetalName = (metalType.metal_name || '').toUpperCase();
                    return words.some(word => apiPurityName.includes(word) || apiMetalName.includes(word));
                });
            }

            if (matchingMetalType) {
                return {
                    metal_type: matchingMetalType.name || matchingMetalType.metal_name,
                    metal_id: matchingMetalType.id,
                    metal_purity: stampValue, // Return original stamp value for display
                    metal_purity_id: matchingMetalType.purity_id || '',
                    rate: matchingMetalType.rate_per_gram || ''
                };
            }

            return { metal_type: '', metal_id: '', metal_purity: stampValue, metal_purity_id: '', rate: '' };
        } catch (error) {
            console.error('Error parsing stamp:', error);
            return { metal_type: '', metal_id: '', metal_purity: stampValue, metal_purity_id: '', rate: '' };
        }
    };

    // Auto-populate product options from main form data
    const autoPopulateProductOptions = () => {
        try {
            const finalWeight = calculateFineValue(); // Use final weight instead of gross weight
            const defaultOption = {
                size: formData.size || '',
                weight: finalWeight || formData.gross_weight || weightDetails.gross_weight || '',
                metal_color: formData.metal_color || '',
                gender: formData.gender || '',
                occasion: formData.occasion || '',
                value: formData.total || formData.total_rs || '0',
                sell_price: formData.sell_price || formData.total || formData.total_rs || '0',
                quantity: formData.pieces || 1
            };
            setProductOptions([defaultOption]);
            showNotification('Product options auto-populated from main form data!', 'success');
        } catch (error) {
            console.error('Error auto-populating product options:', error);
            showNotification('Error auto-populating product options', 'error');
        }
    };

    // Restore image upload handlers
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        setImageFiles(prev => [...prev, ...files]);
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCertificateUpload = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate file types - only PDF allowed
        const validFiles = [];
        const invalidFiles = [];
        
        files.forEach(file => {
            if (file.type === 'application/pdf') {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });
        
        // Show error notification if invalid files found
        if (invalidFiles.length > 0) {
            showNotification(
                `Invalid file format. Only PDF files are allowed. Invalid files: ${invalidFiles.join(', ')}`,
                'error'
            );
            // Clear the input
            e.target.value = '';
            return;
        }
        
        // If all files are valid, proceed with upload
        if (validFiles.length > 0) {
            const newCertificates = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                name: file.name
            }));
            setCertificates(prev => [...prev, ...newCertificates]);
            setCertificateFiles(prev => [...prev, ...validFiles]);
        }
        
        // Clear the input after processing
        e.target.value = '';
    };

    const removeCertificate = (index) => {
        setCertificates(prev => prev.filter((_, i) => i !== index));
        setCertificateFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoUpload = (e) => {
        const files = Array.from(e.target.files);
        const newVideos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));
        setVideoFiles(prev => [...prev, ...files]);
        setVideos(prev => [...prev, ...newVideos]);
    };

    const removeVideo = (index) => {
        setVideos(prev => prev.filter((_, i) => i !== index));
        setVideoFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Field validation
        if (!formData.item_name || !selectedCategory) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        if (images.length === 0) {
            showNotification('Please upload at least one product image', 'error');
            return;
        }

        // Validate diamond weight calculation
        const diamondItemsForWeight = lessWeightItems.filter(item => isDiamondItem(item));
        if (diamondItemsForWeight.length > 0) {
            const calculatedDiamondWeight = diamondItemsForWeight.reduce((total, item) => {
                const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
                const units = item.units;

                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5;
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05;
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5;
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000;
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91;
                        break;
                    default:
                        weightInCarats = weight;
                }

                return total + weightInCarats;
            }, 0);

            const formDiamondWeight = parseFloat(formData.diamond_weight) || 0;
            if (Math.abs(calculatedDiamondWeight - formDiamondWeight) > 0.001) {
                showNotification('Diamond weight calculation mismatch. Please review less weight data.', 'warning');
            }
        }

        // Validate stone weight calculation
        const stoneItems = lessWeightItems.filter(item => isStoneItem(item));
        if (stoneItems.length > 0) {
            const calculatedStoneWeight = stoneItems.reduce((total, item) => {
                const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
                const units = item.units;

                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5;
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05;
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5;
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000;
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91;
                        break;
                    default:
                        weightInCarats = weight;
                }

                return total + weightInCarats;
            }, 0);

            const formStoneWeight = parseFloat(formData.stone_weight) || 0;
            if (Math.abs(calculatedStoneWeight - formStoneWeight) > 0.001) {
                showNotification('Stone weight calculation mismatch. Please review less weight data.', 'warning');
            }
        }


        setLoading(true);
        try {
            // Debug: log selectedCategory and selectedSubcategory
            // Prepare product payload - Only data from visible sections
            const productPayload = {
                // Basic product information from Product Data Entry section
                item_name: formData.item_name,
                sku: formData.sku,
                tag_number: formData.tag_number,
                description: formData.description,
                status: formData.status || 'active',

                // Product Data Entry fields
                batch: formData.batch,
                stamp: formData.stamp,
                remark: formData.remark,
                unit: formData.unit,
                pieces: formData.pieces ? parseInt(formData.pieces) : 1,
                gross_weight: weightDetails.gross_weight ? parseFloat(weightDetails.gross_weight) : 0,
                less_weight: weightDetails.less_weight ? parseFloat(weightDetails.less_weight) : 0,
                net_weight: weightDetails.gross_weight && weightDetails.less_weight ?
                    parseFloat(weightDetails.gross_weight) - parseFloat(weightDetails.less_weight) : 0,
                additional_weight: formData.additional_weight ? parseFloat(formData.additional_weight) : 0,
                tunch: formData.tunch ? parseFloat(formData.tunch) : 0,
                wastage_percentage: formData.wastage_percentage ? parseFloat(formData.wastage_percentage) : 0,
                rate: formData.rate ? parseFloat(formData.rate) : 0,
                diamond_weight: formData.diamond_weight ? parseFloat(formData.diamond_weight) : 0,
                diamond_value: formData.diamond_value ? parseFloat(formData.diamond_value) : 0,
                stone_weight: formData.stone_weight ? parseFloat(formData.stone_weight) : 0,

                labour: (() => {
                    // Send actual input value to database (not calculated cost)
                    // Calculation is only for total_rs, which happens in calculateTotalWithPurchaseRate()
                    const labourType = formData.labour_type || 'Wt';

                    // Get the actual input value based on labour type
                    if (labourType === 'Fl') {
                        return formData.labour_flat ? parseFloat(formData.labour_flat) : 0;
                    } else if (labourType === 'Pc') {
                        return formData.labour_percent ? parseFloat(formData.labour_percent) : 0;
                    } else if (labourType === 'Wt') {
                        return formData.labour_weight ? parseFloat(formData.labour_weight) : 0;
                    }

                    return 0;
                })(),
                labour_on: formData.labour_on,
                other: formData.other ? parseFloat(formData.other) : 0,
                total_fine_weight: formData.total_fine_weight ? parseFloat(formData.total_fine_weight) : 0,
                total_rs: formData.total ? parseFloat(formData.total) : 0,

                // Design & Manufacturing fields
                design_type: formData.design_type,
                manufacturing: formData.manufacturing,
                customizable: formData.customizable === 'true' || formData.customizable === true,
                engraving: formData.engraving === 'true' || formData.engraving === true,
                hallmark: formData.hallmark === 'true' || formData.hallmark === true,
                certificate_number: formData.certificate_number,

                // Category Selection
                category_id: selectedCategory,
                subcategory_id: selectedSubcategory || null,
                sub_subcategory_id: selectedSubSubcategory || null,
                metal_id: (() => {
                    const { metal_id } = parseStampAndFindMetalType(formData.stamp);
                    return metal_id ? parseInt(metal_id) : null;
                })(),
                metal_purity_id: (() => {
                    const { metal_id } = parseStampAndFindMetalType(formData.stamp);
                    if (metal_id) {
                        // Find the metal type and get its purity id
                        const metalType = metalTypes.find(mt => mt.id === parseInt(metal_id));
                        return metalType ? metalType.purity_id : null;
                    }
                    return null;
                })(),

                // Product Options (if any from Product Data Entry)
                product_options: productOptions.filter(opt => opt.size || opt.weight || opt.value || opt.sell_price).map(opt => ({
                    size: opt.size,
                    weight: opt.weight,
                    dimensions: opt.dimensions,
                    metal_color: opt.metal_color,
                    gender: opt.gender || '',
                    occasion: opt.occasion || '',
                    value: opt.value ? parseFloat(opt.value) : 0,
                    sell_price: opt.sell_price ? parseFloat(opt.sell_price) : 0
                })),

                // Less Weight Items (if any from Product Data Entry)
                product_less_weight: lessWeightItems.filter(item => item.item && item.item.trim() !== '').map(item => ({
                    item: item.item,
                    stamp: item.stamp,
                    clarity: item.clarity,
                    color: item.color,
                    cuts: item.cuts,
                    shapes: item.shapes,
                    remarks: item.remarks,
                    pieces: item.pieces ? parseInt(item.pieces) : 1,
                    weight: item.weight ? parseFloat(item.weight) : 0,
                    units: item.units,
                    tunch: item.tunch ? parseFloat(item.tunch) : 0,
                    purchase_rate: item.purchase_value ? parseFloat(item.purchase_value) : 0,
                    sale_rate: item.sale_rate ? parseFloat(item.sale_rate) : 0,
                    total_profit: item.total_profit ? parseFloat(item.total_profit) : 0,
                    purchase_value: item.per_value ? parseFloat(item.per_value) : 0,
                    sale_value: item.total_sale_rate ? parseFloat(item.total_sale_rate) : 0
                }))
            };

            const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

            // Create product
            const productResponse = await axios.post(`${API_BASE_URL}/products`, productPayload, { headers });
            const productData = productResponse.data;
            if (!productData.success) {
                throw new Error(productData.message || 'Error creating product');
            }
            const productId = productData.data.id;

            // Upload all images in one call (if backend supports array)
            if (imageFiles.length > 0) {
                const imgFormData = new FormData();
                imageFiles.forEach(file => imgFormData.append('images', file));
                const imgRes = await axios.post(`${API_BASE_URL}/products/${productId}/images`, imgFormData, {
                    headers: {
                        ...headers,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                const imgData = imgRes.data;
                if (!imgData.success) {
                    throw new Error(imgData.message || 'Image upload failed');
                }
            }

            // Upload all videos in one call
            if (videoFiles.length > 0) {
                const videoFormData = new FormData();
                videoFiles.forEach(file => videoFormData.append('videos', file));
                const videoRes = await axios.post(`${API_BASE_URL}/products/${productId}/videos`, videoFormData, {
                    headers: {
                        ...headers,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                const videoData = videoRes.data;
                if (!videoData.success) {
                    throw new Error(videoData.message || 'Video upload failed');
                }
            }

            // Upload all certificates in one call
            if (certificateFiles.length > 0) {

                const certFormData = new FormData();
                certificateFiles.forEach(file => {
                    certFormData.append('certificates', file);

                });

                try {
                    const certRes = await axios.post(`${API_BASE_URL}/products/${productId}/certificates`, certFormData, {
                        headers: {
                            ...headers,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    const certData = certRes.data;
                    if (!certData.success) {
                        throw new Error(certData.message || 'Certificate upload failed');
                    }

                } catch (certError) {
                    console.error('❌ Certificate upload error:', certError);
                    throw new Error(`Certificate upload failed: ${certError.message}`);
                }
            }

            // Update price breakup (PUT)
            if (formData.metal_cost || formData.diamond_cost || formData.making_charges || formData.labour_hours || formData.labour_price_per_hour) {
                const pricing = calculatePricing();
                const pricePayload = {
                    metal_cost: formData.metal_cost ? parseFloat(formData.metal_cost) : 0,
                    diamond_cost: formData.diamond_cost ? parseFloat(formData.diamond_cost) : 0,
                    making_charges: formData.making_charges ? parseFloat(formData.making_charges) : 0,
                    labour_hours: formData.labour_hours ? parseFloat(formData.labour_hours) : 0,
                    labour_price_per_hour: formData.labour_price_per_hour ? parseFloat(formData.labour_price_per_hour) : 0,
                    labour_cost: parseFloat(pricing.labourCost),
                    total_cost: parseFloat(pricing.totalCost),
                    markup_percentage: formData.markup_percentage ? parseFloat(formData.markup_percentage) : 11,
                    final_price: parseFloat(pricing.finalPrice),
                };
                const priceRes = await axios.put(`${API_BASE_URL}/products/${productId}/price-breakup`, pricePayload, { headers });
                const priceData = priceRes.data;
                if (!priceData.success) {
                    throw new Error(priceData.message || 'Price breakup update failed');
                }
            }

            // Create product features if any exist

            if (productFeatures && productFeatures.length > 0 && productFeatures[0].feature_points) {
                try {
                    const featuresResponse = await axios.post(`${API_BASE_URL}/products/${productId}/features`, {
                        feature_points: productFeatures[0].feature_points
                    }, { headers });

                    const featuresData = featuresResponse.data;
                    if (!featuresData.success) {
                        console.warn('⚠️ Product features creation failed:', featuresData.message);
                    }
                } catch (featuresError) {
                    console.error('❌ Error creating product features:', featuresError);
                    console.error('❌ Features error response:', featuresError.response?.data);
                    console.error('❌ Features error status:', featuresError.response?.status);
                    console.error('❌ Features error URL:', featuresError.config?.url);
                    // Don't throw error here, just log it as features are optional
                }
            }

            showNotification('Product created successfully', 'success');
            onProductAdded();
            handleClose();
        } catch (error) {
            console.error('Product creation error:', error);
            console.error('Error response:', error.response?.data);

            let msg = 'Error creating product';

            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                // Handle validation errors from backend
                msg = error.response.data.errors.join(', ');
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            } else if (error.message) {
                msg = error.message;
            }

            showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate product code
    const generateProductCode = () => {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PC-${timestamp}-${random}`;
    };

    // Auto-generate SKU using backend API (guaranteed unique)
    const generateSKU = async () => {
        try {
            const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
            const response = await axios.get(`${API_BASE_URL}/products/generate-sku?name=${formData.item_name || 'Product'}`, { headers });

            if (response.data.success) {
                return response.data.data.sku;
            } else {
                throw new Error('SKU generation failed');
            }
        } catch (error) {
            console.error('Backend SKU generation failed, using fallback:', error);
            // Fallback to simple frontend generation
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `PRD-${timestamp}-${random}`;
        }
    };

    // Calculate pricing
    const calculatePricing = () => {
        const metalCost = parseFloat(formData.metal_cost) || 0;
        const diamondCost = parseFloat(formData.diamond_cost) || 0;
        const makingCharges = parseFloat(formData.making_charges) || 0;
        const markupPercentage = parseFloat(formData.markup_percentage) || 11;

        // Calculate net weight for labour calculations (Net Weight + Additional Weight)
        const grossWeight = parseFloat(weightDetails.gross_weight || 0);
        const lessWeight = parseFloat(weightDetails.less_weight || 0);
        const additionalWeight = parseFloat(formData.additional_weight) || 0;
        const netWeight = (grossWeight - lessWeight) + additionalWeight;

        // Calculate labour cost based on labour type and value
        let labourCost = 0;
        let labourValue = 0;
        const labourType = formData.labour_type;

        // Validate labour type - use default if not specified
        const effectiveLabourType = labourType || 'Wt';
        if (!labourType) {
            console.warn('Labour type not specified, defaulting to Wt');
        }

        // Get the correct labour value based on labour type
        if (effectiveLabourType === 'Fl') {
            labourValue = parseFloat(formData.labour_flat) || 0;
        } else if (effectiveLabourType === 'Pc') {
            labourValue = parseFloat(formData.labour_percent) || 0;
        } else if (effectiveLabourType === 'Wt') {
            labourValue = parseFloat(formData.labour_weight) || 0;
        }

        // Validate labour value
        if (isNaN(labourValue)) {
            console.warn('Invalid labour value, defaulting to 0');
            labourValue = 0;
        }


        // Calculate labour cost based on type
        switch (effectiveLabourType) {
            case 'Wt':
                // Weight Type: labour_value × net_weight (including additional weight)
                if (labourValue > 0 && netWeight > 0) {
                    labourCost = labourValue * netWeight;

                } else {
                    labourCost = 0;
                }
                break;

            case 'Fl':
                // Flat Type: Direct labour_value amount
                labourCost = labourValue;
                break;

            case 'Pc':
                // Percentage Type: (net_weight × labour_percentage_value) × rate (including additional weight)
                if (labourValue > 0 && netWeight > 0) {
                    const rate = parseFloat(formData.rate) || 0;

                    // Calculate only labour portion: net_weight × labour_percentage_value
                    const labourWeight = netWeight * (labourValue / 100);

                    // Labour cost = labour weight × rate
                    labourCost = labourWeight * rate;

                } else {
                    labourCost = 0;
                }
                break;

            default:
                labourCost = 0;
                console.warn('Unknown labour type:', labourType);
        }

        // Calculate total cost
        const totalCost = metalCost + diamondCost + makingCharges + labourCost;

        // Calculate final price with markup
        const finalPrice = totalCost * (1 + markupPercentage / 100);

        return {
            labourCost: labourCost.toFixed(2),
            totalCost: totalCost.toFixed(2),
            finalPrice: finalPrice.toFixed(2),
            netWeight: netWeight.toFixed(3)
        };
    };

    // Update pricing when relevant fields change
    const updatePricing = () => {
        const pricing = calculatePricing();
        const newTotal = calculateTotalWithPurchaseRate();

        setFormData(prev => ({
            ...prev,
            labour_cost: pricing.labourCost,
            total: newTotal.total,
            total_fine_weight: newTotal.fine
        }));

    };

    const handleClose = () => {
        setFormData({
            name: '',
            sku: '',
            tag_number: '',
            description: '',
            discount: '0',
            status: 'active',
            created_by: '',
            // Product Type & Basic Details
            product_type: '',
            gender: '',
            ideal_for: '',
            occasion: '',
            // Pricing & Tax Information
            base_price: '',
            selling_price: '',
            cost_price: '',
            offer_discount: '0',
            gst_tax_rate: '3',
            price_per_gram: '',



            // Manufacturing & Design Details
            design_type: '',
            manufacturing_type: '',
            customizable: false,
            engraving_option: false,
            hallmark: false,
            certificate_number: '',
            // Specifications
            product_code: '',
            dimensions: '',
            product_weight: '',
            diamond_total_weight: '',
            diamond_count: '',
            diamond_quality: '',
            metal_weight: '',
            // Price breakup
            metal_cost: '',
            diamond_cost: '',
            markup_percentage: '11',
            // Labour details
            labour_type: 'Wt',
            labour_flat: '0',
            labour_percent: '0',
            labour_weight: '0'
        });
        setImages([]);
        setImageFiles([]);
        setVideos([]);
        setVideoFiles([]);
        setCertificates([]);
        setCertificateFiles([]);
        setSelectedCategory('');
        setSelectedSubcategory('');
        setSelectedSubSubcategory('');
        setProductInput({
            supplier: '',
            remark: '',
            other_charges: '',
            rate: '',
            stone_weight: '',
            diamond_weight: '',
            touch: '',
            pc: '',
            stamp: '',
            pieces: 1,
            units: 'carat'
        });
        setProductOptions([{ size: '', weight: '', metal_color: '', gender: '', occasion: '', value: '', sell_price: '', quantity: 1 }]);
        setWeightDetails({
            gross_weight: '',
            less_weight: '0',
            stone_weight: '',
            stone_pieces: '',
            stone_value: '',
            purchase_price: '',
            purchase_sell: '',
            actual_sell: '',
            sell_price: ''
        });
        setProductFeatures([{
            id: null,
            product_id: '',
            feature_title: '',
            feature_description: '',
            icon_url: '',
            sort_order: 0,
            is_active: '1',
            created_at: '',
            updated_at: ''
        }]);

        // Reset new state variables
        setShowAddCategory(false);
        setShowAddSubcategory(false);
        setNewCategory({ name: '', slug: '', description: '', image_url: '', status: 'active' });
        setNewSubcategory({ name: '', slug: '', description: '', image: null, status: 'active' });
        setNewMetalType({ name: '', symbol: '', description: '', is_active: true, sort_order: 0 });
        setNewGemstone({ name: '', type: 'other', description: '', is_active: true, sort_order: 0 });
        setAddingCategory(false);
        setAddingSubcategory(false);
        setAddingMetalType(false);
        setAddingGemstone(false);
        setDeletingCategory(null);
        setDeletingSubcategory(null);
        setShowLessWeightPopup(false);
        setLessWeightItems([{
            item: '',
            stamp: '',
            clarity: '',
            color: '',
            cuts: '',
            shapes: '',
            remarks: '',
            pieces: 1,
            weight: '',
            units: 'carat',
            tunch: '',
            purchase_value: '',
            sale_rate: '',
            per_value: '',
            sale_value: '',
            pieces_rate: '',
            total_sale_rate: '',
            total_profit: '',
            weight_in_grams: ''
        }]);
        setLessWeightData({
            weight_reason: '',
            weight_description: '',
            weight_category: '',
            weight_notes: ''
        });

        onClose();
    };

    // Add function to calculate total stone sell value from less weight items
    const calculateTotalStoneSellValue = () => {
        return lessWeightItems.reduce((total, item) => {
            if (!isStoneItem(item)) return total;

            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0).toFixed(2);
    };

    // Add function to calculate total diamond value from less weight items
    const calculateTotalDiamondValue = () => {
        return lessWeightItems.reduce((total, item) => {
            if (!isDiamondItem(item)) return total;

            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0).toFixed(2);
    };

    // Add function to calculate total sell value from all less weight items
    const calculateTotalSellValue = () => {
        return lessWeightItems.reduce((total, item) => {
            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0).toFixed(2);
    };

    // Add function to calculate fine value based on conditions
    const calculateFineValue = () => {
        const additionalWeight = parseFloat(formData.additional_weight) || 0;
        const tunch = parseFloat(formData.tunch) || 0;
        const wastage = parseFloat(formData.wastage) || 0;
        const grossWeight = parseFloat(weightDetails.gross_weight) || 0;
        const lessWeight = parseFloat(weightDetails.less_weight) || 0;

        // Calculate net weight
        const netWeight = grossWeight - lessWeight;

        // Step 1: Add additional weight to net weight
        let workingWeight = netWeight + additionalWeight;

        // Step 2: Apply tunch percentage
        if (tunch > 0) {
            workingWeight = workingWeight * (tunch / 100);
        }

        // Step 3: Add wastage percentage to the tunch-adjusted weight
        if (wastage > 0) {
            const wastageAmount = workingWeight * (wastage / 100);
            workingWeight = workingWeight + wastageAmount;
        }

        return workingWeight > 0 ? workingWeight.toFixed(5) : '0.00000';
    };

    // Function to check if item is diamond-related (using database catalog)
    const isDiamondItem = (item) => {
        const itemName = item.item?.toLowerCase() || '';

        // First check database catalog
        const catalogItem = gemstoneCatalog.find(gem =>
            gem.name.toLowerCase() === itemName && gem.type === 'diamond'
        );

        if (catalogItem) {
            return true;
        }

        // Fallback to hardcoded keywords if database is not loaded
        const diamondKeywords = [
            'diamond', 'solitaire', 'brilliant', 'princess', 'round diamond', 'pear diamond',
            'marquise diamond', 'asscher diamond', 'radiant diamond', 'cushion diamond',
            'baguette diamond', 'emerald cut diamond', 'oval cut diamond', 'heart diamond',
            'trillion diamond', 'briolette diamond', 'rose cut diamond', 'old mine cut diamond',
            'old european cut diamond', 'single cut diamond', 'full cut diamond', 'step cut diamond',
            'mixed cut diamond', 'fancy cut diamond', 'modified brilliant diamond', 'modified step diamond'
        ];

        return diamondKeywords.some(keyword => itemName.includes(keyword));
    };

    // Function to check if item is stone-related (non-diamond)
    const isStoneItem = (item) => {
        const itemName = item.item?.toLowerCase() || '';

        // First check database catalog
        const catalogItem = gemstoneCatalog.find(gem =>
            gem.name.toLowerCase() === itemName && gem.type === 'stone'
        );

        if (catalogItem) {
            return true;
        }

        const stoneKeywords = [
            // Precious Stones
            'ruby', 'emerald', 'sapphire', 'pearl', 'opal',

            // Semi-precious Stones
            'garnet', 'amethyst', 'topaz', 'aquamarine', 'citrine', 'peridot', 'tanzanite', 'tourmaline', 'zircon', 'spinel', 'alexandrite', 'moonstone', 'labradorite', 'onyx', 'jade', 'coral', 'turquoise', 'lapis', 'malachite', 'agate', 'jasper', 'carnelian', 'tiger eye', 'obsidian', 'hematite', 'pyrite', 'quartz', 'crystal',

            // Additional Gemstones
            'alexandrite', 'andalusite', 'apatite', 'azurite', 'beryl', 'bloodstone', 'calcite', 'chrysocolla', 'chrysoprase', 'diopside', 'dumortierite', 'euclase', 'fluorite', 'grossular', 'hessonite', 'iolite', 'kunzite', 'kyanite', 'lepidolite', 'morganite', 'nephrite', 'orthoclase', 'prehnite', 'rhodochrosite', 'rhodonite', 'scapolite', 'serpentine', 'smithsonite', 'sodalite', 'sphene', 'spodumene', 'staurolite', 'sunstone', 'tanzanite', 'thomsonite', 'variscite', 'vesuvianite', 'zoisite',

            // Pearl varieties
            'freshwater pearl', 'saltwater pearl', 'akoya pearl', 'south sea pearl', 'tahitian pearl', 'mabe pearl', 'keshi pearl', 'baroque pearl',

            // Opal varieties
            'white opal', 'black opal', 'fire opal', 'boulder opal', 'crystal opal', 'matrix opal', 'honey opal', 'milk opal', 'pink opal', 'blue opal', 'green opal',

            // Ruby varieties
            'burmese ruby', 'thai ruby', 'african ruby', 'pigeon blood ruby', 'star ruby',

            // Sapphire varieties
            'blue sapphire', 'yellow sapphire', 'pink sapphire', 'white sapphire', 'green sapphire', 'purple sapphire', 'orange sapphire', 'padparadscha', 'star sapphire', 'color change sapphire',

            // Emerald varieties
            'colombian emerald', 'zambian emerald', 'brazilian emerald', 'afghan emerald', 'pakistani emerald',

            // Garnet varieties
            'almandine', 'pyrope', 'spessartine', 'grossular', 'andradite', 'uvarovite', 'rhodolite', 'malaya', 'demantoid', 'tsavorite', 'hessonite', 'leuco',

            // Tourmaline varieties
            'rubellite', 'indicolite', 'verdelite', 'achroite', 'dravite', 'elbaite', 'liddicoatite', 'uvite', 'paraiba', 'watermelon tourmaline', 'bicolor tourmaline', 'tricolor tourmaline',

            // Quartz varieties
            'rock crystal', 'smoky quartz', 'rose quartz', 'amethyst', 'citrine', 'prasiolite', 'aventurine', 'tiger eye', 'cat eye', 'hawk eye', 'bull eye', 'rutilated quartz', 'tourmalinated quartz', 'phantom quartz', 'snow quartz', 'milky quartz', 'blue quartz', 'green quartz', 'pink quartz', 'yellow quartz', 'orange quartz', 'brown quartz', 'black quartz', 'white quartz',

            // Topaz varieties
            'imperial topaz', 'precious topaz', 'blue topaz', 'white topaz', 'pink topaz', 'yellow topaz', 'orange topaz', 'brown topaz', 'green topaz', 'red topaz',

            // Spinel varieties
            'red spinel', 'blue spinel', 'pink spinel', 'purple spinel', 'orange spinel', 'yellow spinel', 'green spinel', 'black spinel', 'white spinel', 'gray spinel',

            // Zircon varieties
            'blue zircon', 'white zircon', 'yellow zircon', 'orange zircon', 'brown zircon', 'green zircon', 'red zircon', 'pink zircon', 'purple zircon',

            // Jade varieties
            'nephrite jade', 'jadeite jade', 'imperial jade', 'lavender jade', 'yellow jade', 'white jade', 'black jade', 'brown jade', 'orange jade', 'red jade', 'blue jade', 'green jade',

            // Agate varieties
            'blue lace agate', 'crazy lace agate', 'moss agate', 'tree agate', 'fire agate', 'eye agate', 'banded agate', 'fortification agate', 'plume agate', 'sardonyx', 'onyx',

            // Jasper varieties
            'red jasper', 'yellow jasper', 'green jasper', 'blue jasper', 'brown jasper', 'black jasper', 'white jasper', 'picture jasper', 'landscape jasper', 'brecciated jasper', 'poppy jasper', 'kambaba jasper', 'mookaite jasper', 'ocean jasper', 'rainforest jasper', 'leopard jasper', 'dalmatian jasper', 'dragon blood jasper', 'imperial jasper', 'mahogany jasper', 'noreena jasper', 'orbicular jasper', 'polychrome jasper', 'ribbon jasper', 'spider web jasper', 'stromatolite jasper', 'suzorite jasper', 'unakite jasper',

            // Other popular stones
            'charoite', 'larimar', 'sugilite', 'seraphinite', 'chrysocolla', 'azurite', 'malachite', 'rhodochrosite', 'rhodonite', 'smithsonite', 'sodalite', 'sphene', 'spodumene', 'staurolite', 'sunstone', 'thomsonite', 'variscite', 'vesuvianite', 'zoisite', 'andalusite', 'apatite', 'beryl', 'bloodstone', 'calcite', 'chrysoprase', 'diopside', 'dumortierite', 'euclase', 'fluorite', 'iolite', 'kunzite', 'kyanite', 'lepidolite', 'morganite', 'orthoclase', 'prehnite', 'scapolite', 'serpentine', 'staurolite', 'thomsonite', 'variscite', 'vesuvianite'
        ];

        return stoneKeywords.some(keyword => itemName.includes(keyword));
    };


    // Add function to calculate total from all components including purchase rate
    const calculateTotalWithPurchaseRate = () => {
        const rate = parseFloat(formData.rate) || 0;

        const other = parseFloat(formData.other) || 0;

        // Calculate fine value with current weight details
        const additionalWeight = parseFloat(formData.additional_weight) || 0;
        const tunch = parseFloat(formData.tunch) || 0;
        const wastage = parseFloat(formData.wastage) || 0;
        const grossWeight = parseFloat(weightDetails.gross_weight) || 0;
        const lessWeight = parseFloat(weightDetails.less_weight) || 0;

        // Calculate net weight
        const netWeightForFine = grossWeight - lessWeight;

        // Step 1: Add additional weight to net weight
        let workingWeight = netWeightForFine + additionalWeight;

        // Step 2: Apply tunch percentage
        if (tunch > 0) {
            workingWeight = workingWeight * (tunch / 100);
        }

        // Step 3: Add wastage percentage to the tunch-adjusted weight
        if (wastage > 0) {
            const wastageAmount = workingWeight * (wastage / 100);
            workingWeight = workingWeight + wastageAmount;
        }

        const fine = workingWeight > 0 ? workingWeight : 0;

        // Calculate labour cost based on labour type
        const labourType = formData.labour_type || 'Wt';
        let labourCost = 0;
        let labourValue = 0;

        // Get the correct labour value based on labour type
        if (labourType === 'Fl') {
            labourValue = parseFloat(formData.labour_flat) || 0;
        } else if (labourType === 'Pc') {
            labourValue = parseFloat(formData.labour_percent) || 0;
        } else if (labourType === 'Wt') {
            labourValue = parseFloat(formData.labour_weight) || 0;
        }

        // Calculate labour cost based on type
        // Calculate net weight for labour calculation (Net Weight + Additional Weight)
        const netWeightForLabour = netWeightForFine + additionalWeight;

        switch (labourType) {
            case 'Wt':
                // Weight Type: labour_value × net_weight (including additional weight)
                if (labourValue > 0 && netWeightForLabour > 0) {
                    labourCost = labourValue * netWeightForLabour;
                }
                break;
            case 'Fl':
                // Flat Type: Direct labour_value amount
                labourCost = labourValue;
                break;
            case 'Pc':
                // Percentage Type: (net_weight × labour_percentage_value) × rate (including additional weight)
                if (labourValue > 0 && netWeightForLabour > 0 && rate > 0) {
                    const labourWeight = netWeightForLabour * (labourValue / 100);
                    labourCost = labourWeight * rate;
                }
                break;
            default:
                labourCost = 0;
        }

        // Calculate base total
        let total = 0;

        // Add metal value based on fine weight (not net weight)
        const metalValue = fine > 0 && rate > 0 ? fine * rate : 0;
        total += metalValue;



        // Add stone sell value from less weight items (excluding diamonds to avoid double counting)
        const stoneSellValue = lessWeightItems.reduce((total, item) => {
            if (isStoneItem(item)) {
                const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
                return total + totalSaleRate;
            }
            return total;
        }, 0);
        total += stoneSellValue;

        // Add diamond sell value from less weight items
        const diamondSellValue = lessWeightItems.reduce((total, item) => {
            if (isDiamondItem(item)) {
                const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
                return total + totalSaleRate;
            }
            return total;
        }, 0);
        total += diamondSellValue;

        // Add labour
        total += labourCost;

        // Add other charges
        total += other;



        return {
            total: total.toFixed(2),
            fine: fine.toFixed(3)
        };
    };

    // Update total calculation when relevant fields change
    useEffect(() => {
        if (isOpen) {
            const calculations = calculateTotalWithPurchaseRate();
            setFormData(prev => {
                return {
                    ...prev,
                    total: calculations.total,
                    total_fine_weight: calculations.fine
                };
            });
        }
    }, [
        formData.rate,
        formData.diamond_weight,
        formData.stone_weight,
        formData.labour_type,
        formData.labour_flat,
        formData.labour_percent,
        formData.labour_weight,
        formData.other,
        formData.fine,
        formData.additional_weight,
        formData.tunch,
        formData.wastage,
        formData._weightUpdateTrigger,
        formData._rateUpdateTrigger,
        weightDetails.gross_weight,
        weightDetails.less_weight,
        lessWeightItems
    ]);

    // Monitor rate changes
    useEffect(() => {

    }, [formData.rate]);

    // Auto-update diamond and stone weight when less weight items change
    useEffect(() => {
        if (isOpen && lessWeightItems.length > 0) {
            const totalDiamondWeight = lessWeightItems.reduce((total, item) => {
                if (!isDiamondItem(item)) return total;

                const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
                const units = item.units;

                // Convert to carats if needed
                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5; // 1 gram = 5 carats
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05; // 1 cent = 0.05 carats
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5; // 1 pc = 0.5 carats (approximate)
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000; // 1 kg = 5000 carats
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91; // 1 ratti = 0.91 carats
                        break;
                    default:
                        weightInCarats = weight; // Default to carat
                }

                return total + weightInCarats;
            }, 0);

            const totalStoneWeight = lessWeightItems.reduce((total, item) => {
                if (!isStoneItem(item)) return total;

                const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
                const units = item.units;

                // Convert to carats if needed
                let weightInCarats = 0;
                switch (units) {
                    case 'carat':
                        weightInCarats = weight;
                        break;
                    case 'gram':
                        weightInCarats = weight * 5; // 1 gram = 5 carats
                        break;
                    case 'cent':
                        weightInCarats = weight * 0.05; // 1 cent = 0.05 carats
                        break;
                    case 'pc':
                        weightInCarats = weight * 0.5; // 1 pc = 0.5 carats (approximate)
                        break;
                    case 'kg':
                        weightInCarats = weight * 5000; // 1 kg = 5000 carats
                        break;
                    case 'ratti':
                        weightInCarats = weight * 0.91; // 1 ratti = 0.91 carats
                        break;
                    default:
                        weightInCarats = weight; // Default to carat
                }

                return total + weightInCarats;
            }, 0);

            // Always update the values, even if they're 0
            setFormData(prev => ({
                ...prev,
                diamond_weight: totalDiamondWeight.toFixed(3),
                stone_weight: totalStoneWeight.toFixed(3)
            }));

            // Update diamond value from diamond items in less weight
            const totalDiamondValue = lessWeightItems.reduce((total, item) => {
                if (!isDiamondItem(item)) return total;
                const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
                return total + totalSaleRate;
            }, 0);

            // Update the diamond value in form data
            setFormData(prev => ({
                ...prev,
                diamond_value: totalDiamondValue.toFixed(2), // Store calculated diamond value
                _weightUpdateTrigger: Date.now() // Force recalculation when weights change
            }));


        }
    }, [lessWeightItems, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="Add-product-popup-overlay">
            <div className="Add-product-popup">
                <div className="Add-product-header">
                    <h2 className="Add-product-title">Add New Product</h2>
                    <button className="Add-product-close-btn" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="Add-product-form">
                    {/* Product Images Section */}
                    <div className="media-section">
                        <div className="media-section-header">
                            <h3 className="media-section-title">Product Images</h3>
                            <div>
                                <input
                                    type="file"
                                    id="Add-product-image-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="add-product-images-input"
                                />
                                <label
                                    htmlFor="Add-product-image-upload"
                                    className="media-section-upload-btn images"
                                >
                                    <Plus size={14} /> Upload Images
                                </label>
                            </div>
                        </div>
                        <div className="media-section-content">
                            {images.length > 0 && (
                                <div className="media-preview-grid">
                                    {images.map((image, index) => (
                                        <div key={index} className="media-preview-item">
                                            <img
                                                src={image.preview}
                                                alt={`Product Image ${index + 1}`}
                                                className="media-preview-image"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="media-remove-btn"
                                            >
                                                ×
                                            </button>
                                            <div className="media-hint">
                                                Image {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Videos Section */}
                    <div className="media-section">
                        <div className="media-section-header">
                            <h3 className="media-section-title">Product Videos</h3>
                            <div>
                                <input
                                    type="file"
                                    id="Add-product-video-upload"
                                    multiple
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className="add-product-videos-input"
                                />
                                <label
                                    htmlFor="Add-product-video-upload"
                                    className="media-section-upload-btn videos"
                                >
                                    <Plus size={14} /> Upload Videos
                                </label>
                            </div>
                        </div>
                        <div className="media-section-content">
                            {videos.length > 0 && (
                                <div className="media-preview-grid">
                                    {videos.map((video, index) => (
                                        <div key={index} className="media-preview-item">
                                            <video
                                                src={video.preview}
                                                controls
                                                className="media-preview-video"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeVideo(index)}
                                                className="media-remove-btn"
                                            >
                                                ×
                                            </button>
                                            <div className="media-hint">
                                                Video {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>



                    {/* Main Product Data Table - Excel-like Layout */}
                    <div className="Add-product-section">
                        <div className="Add-product-section-header">Product Data Entry</div>

                        <div className="add-product-data-entry-container">
                            {/* Data Row with Individual Field Containers */}
                            <div className="add-product-data-entry-row">
                                {/* Tag Number - Auto Generated */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Tag Number</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="tag_number"
                                            value={formData.tag_number || ''}
                                            onChange={handleInputChange}
                                            placeholder="Auto Generated"
                                            className="add-product-data-entry-input"
                                            readOnly
                                            style={{
                                                backgroundColor: '#f8f9fa',
                                                cursor: 'not-allowed',
                                                paddingRight: '30px'
                                            }}
                                            title="Tag number is automatically generated"
                                        />
                                        <span
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: '#28a745',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                            title="Auto-generated unique tag number"
                                        >
                                            🔄
                                        </span>
                                    </div>
                                </div>

                                {/* Batch */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Batch</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="batch"
                                            value={formData.batch || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Batch"
                                            className="add-product-data-entry-input"
                                            list="batch-list"
                                        />
                                        <datalist id="batch-list">
                                            {batchOptions.map((batch, index) => (
                                                <option key={index} value={batch} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Item Name */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Item Name</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="item_name"
                                            value={formData.item_name || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Item Name"
                                            required
                                            className="add-product-data-entry-input"
                                            list="item-names-list"
                                        />
                                        <datalist id="item-names-list">
                                            {jewelryOptions.metalTypes.map((type, index) => (
                                                <option key={index} value={`${type} Ring`} />
                                            ))}
                                            {jewelryOptions.metalTypes.map((type, index) => (
                                                <option key={`necklace-${index}`} value={`${type} Necklace`} />
                                            ))}
                                            {jewelryOptions.metalTypes.map((type, index) => (
                                                <option key={`earrings-${index}`} value={`${type} Earrings`} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Stamp */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Stamp</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="stamp"
                                            value={formData.stamp || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                            title="Select stamp to auto-fill rate from API"
                                        >
                                            <option value="">Select Stamp</option>
                                            {/* Dynamic stamp options from API metal rates */}
                                            {loadingMetalTypes ? (
                                                <option value="" disabled>Loading metal types...</option>
                                            ) : metalTypes.length === 0 ? (
                                                <option value="" disabled>No metal types available</option>
                                            ) : (
                                                metalTypes.map((metalType, index) => {
                                                    if (metalType.purity_name && metalType.tunch_value) {
                                                        // Use actual tunch_value from API (e.g., 999, 916, 750)
                                                        const tunchValue = parseFloat(metalType.tunch_value);
                                                        // Format purity_name to proper case (e.g., "22k" -> "22K")
                                                        const formattedPurityName = metalType.purity_name.toUpperCase().replace('K', 'K');
                                                        const stampValue = `${formattedPurityName} / ${tunchValue.toFixed(0)}`;
                                                        return (
                                                            <option key={`api-${index}`} value={stampValue}>
                                                                {stampValue}
                                                            </option>
                                                        );
                                                    }

                                                    return null;
                                                })
                                            )}
                                            {/* No fallback options - only show real API data */}
                                        </select>
                                        {formData.metal_purity && (
                                            <div className="field-info-tooltip">
                                                <span className="tooltip-text">
                                                    {(() => {
                                                        const matchingMetalType = metalTypes.find(metalType => {
                                                            if (metalType.purity_name && metalType.tunch_value) {
                                                                const tunchValue = parseFloat(metalType.tunch_value);
                                                                const formattedPurityName = metalType.purity_name.toUpperCase().replace('K', 'K');
                                                                const apiStampValue = `${formattedPurityName} / ${tunchValue.toFixed(0)}`;
                                                                return apiStampValue === formData.metal_purity;
                                                            }
                                                            return false;
                                                        });

                                                        if (matchingMetalType) {
                                                            return `Rate: ₹${matchingMetalType.rate_per_gram}/gram`;
                                                        } else {
                                                            return 'Custom stamp';
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>



                                {/* Remark */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Remark</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="remark"
                                            value={formData.remark || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Remark"
                                            className="add-product-data-entry-input"
                                            list="remark-list"
                                        />
                                        <datalist id="remark-list">
                                            {remarkOptions.map((remark, index) => (
                                                <option key={index} value={remark} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Unit */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Unit</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="unit"
                                            value={formData.unit || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                        >
                                            <option value="">Unit</option>
                                            {unitOptions.map((unit) => (
                                                <option key={unit.value} value={unit.value}>
                                                    {unit.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Pieces */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Pieces</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="pieces"
                                            value={formData.pieces || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="1"
                                            min="1"
                                            className="add-product-data-entry-input"
                                        />
                                    </div>
                                </div>

                                {/* Gross Weight */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Gross Weight</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="gross_weight"
                                            value={weightDetails.gross_weight || ''}
                                            onChange={e => handleWeightDetailsChange('gross_weight', e.target.value)}
                                            onKeyDown={handleEnhancedKeyDown}
                                            placeholder="0.000"
                                            step="0.001"
                                            min="0"
                                            className="add-product-data-entry-input"
                                        />
                                    </div>
                                </div>

                                {/* Less - with popup functionality */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Less Weight</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="less_weight_button"
                                            value={weightDetails.less_weight || ''}
                                            onClick={() => setShowLessWeightPopup(true)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="0.000"
                                            step="0.001"
                                            min="0"
                                            readOnly
                                            className="add-product-data-entry-input-readonly add-product-data-entry-input-clickable"
                                        />
                                    </div>
                                </div>

                                {/* Net Weight */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Net Weight</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            value={weightDetails.gross_weight && weightDetails.less_weight ?
                                                (parseFloat(weightDetails.gross_weight) - parseFloat(weightDetails.less_weight)).toFixed(3) : ''}
                                            placeholder="Auto"
                                            readOnly
                                            className="add-product-data-entry-input-readonly"
                                        />
                                    </div>
                                </div>

                                {/* Additional Weight */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Additional Weight</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="additional_weight"
                                            value={formData.additional_weight || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="0.000"
                                            step="0.001"
                                            min="0"
                                            className="add-product-data-entry-input"
                                        />
                                    </div>
                                </div>

                                {/* Purity */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Purity</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="tunch"
                                            value={formData.tunch || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="0.000"
                                            step="0.001"
                                            min="0"
                                            className="add-product-data-entry-input"
                                        />
                                    </div>
                                </div>

                                {/* Wastage */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Wastage (%)</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="wastage"
                                            value={formData.wastage || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            className="add-product-data-entry-input"
                                            title="Wastage percentage (0-100%)"
                                        />
                                    </div>
                                </div>

                                {/* Rate */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Rate</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="rate"
                                            value={formData.rate || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className="add-product-data-entry-input"
                                            title="Rate per gram (auto-filled from stamp or manually editable)"
                                        />
                                        {formData.rate && formData.metal_purity && (
                                            <div className="field-info-tooltip">
                                                <span className="tooltip-text">
                                                    {(() => {
                                                        const matchingMetalType = metalTypes.find(metalType => {
                                                            if (metalType.purity_name && metalType.purity_value) {
                                                                const tunchValue = parseFloat(metalType.tunch_value);
                                                                const formattedPurityName = metalType.purity_name.toUpperCase().replace('K', 'K');
                                                                const apiStampValue = `${formattedPurityName} / ${tunchValue.toFixed(0)}`;
                                                                return apiStampValue === formData.metal_purity;
                                                            }
                                                            return false;
                                                        });

                                                        if (matchingMetalType && parseFloat(matchingMetalType.rate_per_gram) === parseFloat(formData.rate)) {
                                                            return 'Auto-filled from API';
                                                        } else {
                                                            return 'Manually set';
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Labour */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Labour</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="labour_value"
                                            value={(() => {
                                                if (formData.labour_type === 'Fl') return formData.labour_flat || '';
                                                if (formData.labour_type === 'Pc') return formData.labour_percent || '';
                                                if (formData.labour_type === 'Wt') return formData.labour_weight || '';
                                                return '';
                                            })()}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className="add-product-data-entry-input"
                                        />
                                    </div>
                                </div>

                                {/* Labour Type Selection */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Labour Type</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="labour_type"
                                            value={formData.labour_type || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                        >
                                            {labourTypeOptions.map((labour) => (
                                                <option key={labour.value} value={labour.value}>
                                                    {labour.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Other */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Other</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="other"
                                            value={formData.other || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className="add-product-data-entry-input"
                                        />
                                    </div>
                                </div>

                                {/* Total Fine Weight */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Total Fine Weight</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="fine"
                                            value={calculateFineValue()}
                                            placeholder="0.000"
                                            step="0.001"
                                            min="0"
                                            readOnly
                                            className="add-product-data-entry-input add-product-data-entry-input-readonly"
                                            title="Total Fine Weight value (auto-calculated based on conditions)"
                                        />
                                        {parseFloat(calculateFineValue()) > 0 && (
                                            <div className="field-info-tooltip">
                                                <span className="tooltip-text">
                                                    {(() => {
                                                        const additionalWeight = parseFloat(formData.additional_weight || 0);
                                                        const tunch = parseFloat(formData.tunch || 0);
                                                        const wastage = parseFloat(formData.wastage || 0);

                                                        if (additionalWeight > 0 || tunch > 0 || wastage > 0) {
                                                            let calculation = 'Auto-calculated: ';
                                                            calculation += `(Net Weight + Additional Weight) × Purity% + Wastage%`;
                                                            return calculation;
                                                        } else {
                                                            return 'Auto-calculated (net weight)';
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Total Rs */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Total Rs</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="total"
                                            value={formData.total || ''}
                                            onChange={handleInputChange}
                                            onKeyDown={handleEnhancedKeyDown}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            className="add-product-data-entry-input add-product-data-entry-input-total"
                                        />
                                        {/* Always show tooltip for debugging */}
                                        <div className="total-breakdown-tooltip">
                                            <span className="tooltip-text">
                                                Breakdown:<br />
                                                • Metal Value: ₹{(parseFloat(calculateFineValue()) * parseFloat(formData.rate || 0)).toFixed(2)}<br />
                                                • Diamond Sell Value: ₹{(() => {
                                                    return lessWeightItems.reduce((total, item) => {
                                                        if (isDiamondItem(item)) {
                                                            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
                                                            return total + totalSaleRate;
                                                        }
                                                        return total;
                                                    }, 0).toFixed(2);
                                                })()}<br />
                                                • Stone Sell Value: ₹{(() => {
                                                    return lessWeightItems.reduce((total, item) => {
                                                        if (isStoneItem(item)) {
                                                            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
                                                            return total + totalSaleRate;
                                                        }
                                                        return total;
                                                    }, 0).toFixed(2);
                                                })()}<br />
                                                • Labour: ₹{(() => {
                                                    const labourType = formData.labour_type || 'Wt';
                                                    // Calculate net weight for labour calculation (Net Weight + Additional Weight)
                                                    const grossWeight = parseFloat(weightDetails.gross_weight || 0);
                                                    const lessWeight = parseFloat(weightDetails.less_weight || 0);
                                                    const additionalWeight = parseFloat(formData.additional_weight) || 0;
                                                    const netWeightForLabour = (grossWeight - lessWeight) + additionalWeight;
                                                    let labourCost = 0;
                                                    let labourValue = 0;

                                                    if (labourType === 'Fl') {
                                                        labourValue = parseFloat(formData.labour_flat) || 0;
                                                        labourCost = labourValue;
                                                    } else if (labourType === 'Pc') {
                                                        labourValue = parseFloat(formData.labour_percent) || 0;
                                                        if (labourValue > 0 && netWeightForLabour > 0 && parseFloat(formData.rate || 0) > 0) {
                                                            const labourWeight = netWeightForLabour * (labourValue / 100);
                                                            labourCost = labourWeight * parseFloat(formData.rate || 0);
                                                        }
                                                    } else if (labourType === 'Wt') {
                                                        labourValue = parseFloat(formData.labour_weight) || 0;
                                                        if (labourValue > 0 && netWeightForLabour > 0) {
                                                            labourCost = labourValue * netWeightForLabour;
                                                        }
                                                    }
                                                    return labourCost.toFixed(2);
                                                })()}<br />
                                                • Other: ₹{parseFloat(formData.other || 0).toFixed(2)}<br />
                                                • Total Fine Weight: {parseFloat(calculateFineValue()).toFixed(3)}<br />
                                                <strong>Total Rs: ₹{formData.total || '0.00'}</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Options Button */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Product Options</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <button
                                            type="button"
                                            name="product_options_button"
                                            onClick={() => {
                                                setShowProductOptionsPopup(true);
                                                // Auto-populate if no options exist
                                                if (productOptions.length === 0) {
                                                    setTimeout(() => autoPopulateProductOptions(), 100);
                                                }
                                            }}
                                            onKeyDown={handleEnhancedKeyDown}
                                            className="add-product-data-entry-button"
                                        >
                                            Options
                                        </button>
                                    </div>
                                </div>

                                {/* Product Features Button */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Product Features</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <button
                                            type="button"
                                            name="product_features_button"
                                            onClick={() => setShowProductFeaturesPopup(true)}
                                            onKeyDown={handleEnhancedKeyDown}
                                            className="add-product-data-entry-button"
                                        >
                                            Features
                                        </button>
                                    </div>
                                </div>

                                {/* Diamond Weight (Carats) */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Diamond Weight</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="diamond_weight"
                                            value={formData.diamond_weight || ''}
                                            placeholder="0.000"
                                            step="0.001"
                                            min="0"
                                            readOnly
                                            className="add-product-data-entry-input add-product-data-entry-input-readonly"
                                            title="Diamond weight in carats (calculated from less weight popup)"
                                        />
                                        <div className="field-unit-label">carats</div>
                                        {formData.diamond_weight && parseFloat(formData.diamond_weight) > 0 && (
                                            <div className="field-info-tooltip">
                                                <span className="tooltip-text">From less weight popup</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stone Weight (Carats) */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Stone Weight</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="number"
                                            name="stone_weight"
                                            value={formData.stone_weight || ''}
                                            placeholder="0.000"
                                            step="0.001"
                                            min="0"
                                            readOnly
                                            className="add-product-data-entry-input add-product-data-entry-input-readonly"
                                            title="Stone weight in carats (calculated from less weight popup)"
                                        />
                                        <div className="field-unit-label">carats</div>
                                        {formData.stone_weight && parseFloat(formData.stone_weight) > 0 && (
                                            <div className="field-info-tooltip">
                                                <span className="tooltip-text">From less weight popup</span>
                                            </div>
                                        )}
                                    </div>
                                </div>



                                {/* Description */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Description</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="description_button"
                                            value={formData.description || ''}
                                            onClick={() => setShowDescriptionPopup(true)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Click to edit description"
                                            readOnly
                                            className="add-product-data-entry-input add-product-data-entry-input-clickable"
                                        />
                                    </div>
                                </div>

                                {/* Design Type */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Design Type</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="design_type"
                                            value={formData.design_type}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                        >
                                            <option value="">Design Type</option>
                                            {designTypeOptions.map((design) => (
                                                <option key={design.value} value={design.value}>
                                                    {design.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Manufacturing */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Manufacturing</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="manufacturing_type"
                                            value={formData.manufacturing_type}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                        >
                                            <option value="">Manufacturing</option>
                                            {manufacturingTypeOptions.map((manufacturing) => (
                                                <option key={manufacturing.value} value={manufacturing.value}>
                                                    {manufacturing.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Customizable */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Customizable</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="customizable"
                                            value={formData.customizable}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                        >
                                            {yesNoOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Engraving */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Engraving</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="engraving_option"
                                            value={formData.engraving_option}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                        >
                                            {yesNoOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Hallmark */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Hallmark</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <select
                                            name="hallmark"
                                            value={formData.hallmark}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="add-product-data-entry-input"
                                        >
                                            {yesNoOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Certificate Number */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Certificate Number</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="certificate_number"
                                            value={formData.certificate_number}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Cert #"
                                            className="add-product-data-entry-input"
                                            list="certificate-number-list"
                                        />
                                        <datalist id="certificate-number-list">
                                            {certificateNumberOptions.map((cert, index) => (
                                                <option key={index} value={cert} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Metal Type (Readonly) */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Metal Type</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="metal_type_display"
                                            value={formData.metal_id || 'Auto-filled from stamp'}
                                            readOnly
                                            className="add-product-data-entry-input add-product-data-entry-input-readonly"
                                            title="Auto-filled from stamp selection"
                                        />
                                    </div>
                                </div>

                                {/* Metal Purity (Readonly) */}
                                <div className="add-product-data-entry-field">
                                    <div className="add-product-data-entry-field-label">Metal Purity</div>
                                    <div className="add-product-data-entry-field-input-container">
                                        <input
                                            type="text"
                                            name="metal_purity_display"
                                            value={formData.metal_purity_id || 'Auto-filled from stamp'}
                                            readOnly
                                            className="add-product-data-entry-input add-product-data-entry-input-readonly"
                                            title="Auto-filled from stamp selection"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Data Preview */}
                    <div className="Add-product-section">
                        <div className="Add-product-section-header">Product Data Preview</div>
                        <div className="product-preview-container">
                            <div className="product-preview-grid">
                                {/* Basic Information */}
                                <div className="preview-section">
                                    <h4>Basic Information</h4>
                                    <div className="preview-row">
                                        <span className="preview-label">Tag Number:</span>
                                        <span className="preview-value" style={{ color: '#28a745', fontWeight: '500' }}>
                                            {formData.tag_number || 'Auto-generating...'}
                                        </span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Batch:</span>
                                        <span className="preview-value">{formData.batch || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Item Name:</span>
                                        <span className="preview-value">{formData.item_name || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Stamp:</span>
                                        <span className="preview-value">{formData.metal_purity || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Remark:</span>
                                        <span className="preview-value">{formData.remark || 'Not set'}</span>
                                    </div>
                                </div>

                                {/* Weight Information */}
                                <div className="preview-section">
                                    <h4>Weight Information</h4>
                                    <div className="preview-row">
                                        <span className="preview-label">Unit:</span>
                                        <span className="preview-value">{formData.unit || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Pieces:</span>
                                        <span className="preview-value">{formData.pieces || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Gross Weight:</span>
                                        <span className="preview-value">{weightDetails.gross_weight || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Less Weight:</span>
                                        <span className="preview-value">{weightDetails.less_weight || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Net Weight:</span>
                                        <span className="preview-value">
                                            {weightDetails.gross_weight && weightDetails.less_weight
                                                ? (parseFloat(weightDetails.gross_weight) - parseFloat(weightDetails.less_weight)).toFixed(3)
                                                : 'Not set'
                                            }
                                        </span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Additional Weight:</span>
                                        <span className="preview-value">{formData.additional_weight || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Total Fine Weight:</span>
                                        <span className="preview-value">{calculateFineValue()}</span>
                                    </div>
                                </div>

                                {/* Pricing Information */}
                                <div className="preview-section">
                                    <h4>Pricing Information</h4>
                                    <div className="preview-row">
                                        <span className="preview-label">Rate (₹/gram):</span>
                                        <span className="preview-value">₹{formData.rate || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Diamond Weight:</span>
                                        <span className="preview-value">{formData.diamond_weight || 'Not set'} carats</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Stone Weight:</span>
                                        <span className="preview-value">{formData.stone_weight || 'Not set'} carats</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Diamond Value:</span>

                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Labour:</span>
                                        <span className="preview-value">₹{formData.labour_flat || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Other:</span>
                                        <span className="preview-value">₹{formData.other || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Total Rs:</span>
                                        <span className="preview-value total-highlight">₹{formData.total || 'Not set'}</span>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="preview-section">
                                    <h4>Additional Information</h4>
                                    <div className="preview-row">
                                        <span className="preview-label">Purity:</span>
                                        <span className="preview-value">{formData.tunch || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Wastage:</span>
                                        <span className="preview-value">{formData.wastage || 'Not set'}%</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Design Type:</span>
                                        <span className="preview-value">{formData.design_type || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Manufacturing:</span>
                                        <span className="preview-value">{formData.manufacturing_type || 'Not set'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Customizable:</span>
                                        <span className="preview-value">{formData.customizable ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Engraving:</span>
                                        <span className="preview-value">{formData.engraving_option ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Hallmark:</span>
                                        <span className="preview-value">{formData.hallmark ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Certificate #:</span>
                                        <span className="preview-value">{formData.certificate_number || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="Add-product-section">
                        <div className="Add-product-section-header">Category Selection</div>
                        <div className="add-product-category-row">
                            <div className="Add-product-group">
                                <label className="add-product-category-label">Category *</label>
                                <div className="flexible-dropdown-container">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        required
                                        className="add-product-category-select"
                                    >
                                        <option value="">Category</option>
                                        {loadingCategories ? (
                                            <option>Loading...</option>
                                        ) : Array.isArray(categories) && categories.length > 0 ? (
                                            categories.map(category => (
                                                <option key={category.id} value={category.id}>{category.name}</option>
                                            ))
                                        ) : (
                                            <option value="">No categories found</option>
                                        )}
                                    </select>
                                    <div className="flexible-dropdown-actions">
                                        <button
                                            type="button"
                                            className="add-option-btn"
                                            onClick={() => setShowAddCategory(true)}
                                            title="Add new category"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        {selectedCategory && (
                                            <button
                                                type="button"
                                                className="delete-option-btn"
                                                onClick={() => handleDeleteCategory(selectedCategory)}
                                                disabled={deletingCategory === selectedCategory}
                                                title="Delete category"
                                            >
                                                {deletingCategory === selectedCategory ? (
                                                    <Loader2 size={14} />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="Add-product-group">
                                <label className="add-product-category-label">Subcategory</label>
                                <div className="flexible-dropdown-container">
                                    <select
                                        value={selectedSubcategory}
                                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                                        disabled={!selectedCategory}
                                        className="add-product-category-select"
                                    >
                                        <option value="">Subcategory</option>
                                        {loadingSubcategories ? (
                                            <option>Loading...</option>
                                        ) : Array.isArray(subcategories) && subcategories.length > 0 ? (
                                            subcategories.map(subcategory => (
                                                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                                            ))
                                        ) : (
                                            <option value="">No subcategories found</option>
                                        )}
                                    </select>
                                    <div className="flexible-dropdown-actions">
                                        <button
                                            type="button"
                                            className="add-option-btn"
                                            onClick={() => setShowAddSubcategory(true)}
                                            disabled={!selectedCategory}
                                            title="Add new subcategory"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        {selectedSubcategory && (
                                            <button
                                                type="button"
                                                className="delete-option-btn"
                                                onClick={() => handleDeleteSubcategory(selectedSubcategory)}
                                                disabled={deletingSubcategory === selectedSubcategory}
                                                title="Delete subcategory"
                                            >
                                                {deletingSubcategory === selectedSubcategory ? (
                                                    <Loader2 size={14} />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="Add-product-group">
                                <label className="add-product-category-label">Sub-Subcategory</label>
                                <div className="flexible-dropdown-container">
                                    <select
                                        value={selectedSubSubcategory}
                                        onChange={(e) => setSelectedSubSubcategory(e.target.value)}
                                        disabled={!selectedSubcategory}
                                        className="add-product-category-select"
                                    >
                                        <option value="">Sub-Subcategory</option>
                                        {loadingSubcategories ? (
                                            <option>Loading...</option>
                                        ) : Array.isArray(subSubcategories) && subSubcategories.length > 0 ? (
                                            subSubcategories.map(subSubcategory => (
                                                <option key={subSubcategory.id} value={subSubcategory.id}>
                                                    {subSubcategory.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">No sub-subcategories found</option>
                                        )}
                                    </select>
                                    <div className="flexible-dropdown-actions">
                                        <button
                                            type="button"
                                            className="add-option-btn"
                                            onClick={() => setShowAddSubSubcategory(true)}
                                            disabled={!selectedSubcategory}
                                            title="Add new sub-subcategory"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        {selectedSubSubcategory && (
                                            <button
                                                type="button"
                                                className="delete-option-btn"
                                                onClick={() => handleDeleteSubSubcategory(selectedSubSubcategory)}
                                                disabled={deletingSubSubcategory === selectedSubSubcategory}
                                                title="Delete sub-subcategory"
                                            >
                                                {deletingSubSubcategory === selectedSubSubcategory ? (
                                                    <Loader2 size={14} />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
























                    {/* Certificates */}
                    <div className="Add-product-section">
                        <div className="Add-product-section-header">Certificates</div>
                        <div className="certificate-upload-section">
                            <input
                                type="file"
                                id="Add-product-certificate-upload"
                                multiple
                                accept=".pdf"
                                onChange={handleCertificateUpload}
                                className="certificate-upload-input"
                            />
                            <label htmlFor="Add-product-certificate-upload" className="certificate-upload-area">
                                <div className="certificate-upload-icon">
                                    <Upload size={16} />
                                </div>
                                <div className="certificate-upload-text">Upload Certificates</div>
                                <div className="certificate-upload-hint">PDF Only (.pdf)</div>
                            </label>
                        </div>
                        {certificates.length > 0 && (
                            <div className="Add-product-image-preview-grid">
                                {certificates.map((certificate, index) => (
                                    <div key={index} className="Add-product-image-preview-item">
                                        <div className="certificate-preview">
                                            <div className="certificate-icon">📄</div>
                                            <div className="certificate-name">{certificate.name}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="Add-product-remove-image-btn"
                                            onClick={() => removeCertificate(index)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="Add-product-actions">
                        <button type="button" className="Add-product-cancel-btn" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="Add-product-submit-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>

                {/* Add Metal Type Modal */}
                {
                    showAddMetalType && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Add New Metal Type</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowAddMetalType(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="modal-form-group">
                                        <label>Metal Name *</label>
                                        <input
                                            type="text"
                                            value={newMetalType.name}
                                            onChange={(e) => setNewMetalType(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Gold, Silver, Platinum"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Symbol</label>
                                        <input
                                            type="text"
                                            value={newMetalType.symbol}
                                            onChange={(e) => setNewMetalType(prev => ({ ...prev, symbol: e.target.value }))}
                                            placeholder="e.g., Au, Ag, Pt"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={newMetalType.description}
                                            onChange={(e) => setNewMetalType(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Brief description of the metal type"
                                            rows="3"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Sort Order</label>
                                        <input
                                            type="number"
                                            value={newMetalType.sort_order}
                                            onChange={(e) => setNewMetalType(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                                            placeholder="Display order (0, 1, 2...)"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Status</label>
                                        <select
                                            value={newMetalType.is_active ? 'active' : 'inactive'}
                                            onChange={(e) => setNewMetalType(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                                            className="modal-input"
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowAddMetalType(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={handleAddMetalType}
                                        disabled={addingMetalType}
                                    >
                                        {addingMetalType ? 'Adding...' : 'Add Metal Type'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Add Gemstone Modal */}
                {
                    showAddGemstone && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Add New Gemstone</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowAddGemstone(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="modal-form-group">
                                        <label>Gemstone Name *</label>
                                        <input
                                            type="text"
                                            value={newGemstone.name}
                                            onChange={(e) => setNewGemstone(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Ruby, Diamond, Emerald"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Type</label>
                                        <select
                                            value={newGemstone.type}
                                            onChange={(e) => setNewGemstone(prev => ({ ...prev, type: e.target.value }))}
                                            className="modal-input"
                                        >
                                            {gemstoneTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={newGemstone.description}
                                            onChange={(e) => setNewGemstone(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Brief description of the gemstone"
                                            rows="3"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Sort Order</label>
                                        <input
                                            type="number"
                                            value={newGemstone.sort_order}
                                            onChange={(e) => setNewGemstone(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                                            placeholder="Display order (0, 1, 2...)"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Status</label>
                                        <select
                                            value={newGemstone.is_active ? 'active' : 'inactive'}
                                            onChange={(e) => setNewGemstone(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                                            className="modal-input"
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowAddGemstone(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={handleAddGemstone}
                                        disabled={addingGemstone}
                                    >
                                        {addingGemstone ? 'Adding...' : 'Add Gemstone'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Add Category Modal */}
                {
                    showAddCategory && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Add New Category</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowAddCategory(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="modal-form-group">
                                        <label>Category Name *</label>
                                        <input
                                            type="text"
                                            value={newCategory.name}
                                            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Rings, Necklaces, Earrings"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Slug</label>
                                        <input
                                            type="text"
                                            value={newCategory.slug}
                                            onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                                            placeholder="Auto-generated from name if empty"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={newCategory.description}
                                            onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Brief description of the category"
                                            rows="3"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Category Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCategoryImageChange}
                                            className="modal-input file-input-padding"
                                        />
                                        {newCategory.image && (
                                            <div className="file-selected-info">
                                                Selected: {newCategory.image.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Status</label>
                                        <select
                                            value={newCategory.status}
                                            onChange={(e) => setNewCategory(prev => ({ ...prev, status: e.target.value }))}
                                            className="modal-input"
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowAddCategory(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={handleAddCategory}
                                        disabled={addingCategory}
                                    >
                                        {addingCategory ? 'Adding...' : 'Add Category'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Add Subcategory Modal */}
                {
                    showAddSubcategory && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Add New Subcategory</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowAddSubcategory(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="modal-form-group">
                                        <label>Subcategory Name *</label>
                                        <input
                                            type="text"
                                            value={newSubcategory.name}
                                            onChange={(e) => setNewSubcategory(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Gold Rings, Diamond Necklaces"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Slug</label>
                                        <input
                                            type="text"
                                            value={newSubcategory.slug}
                                            onChange={(e) => setNewSubcategory(prev => ({ ...prev, slug: e.target.value }))}
                                            placeholder="Auto-generated from name if empty"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={newSubcategory.description}
                                            onChange={(e) => setNewSubcategory(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Brief description of the subcategory"
                                            rows="3"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Subcategory Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleSubcategoryImageChange}
                                            className="modal-input file-input-padding"
                                        />
                                        {newSubcategory.image && (
                                            <div className="file-selected-info">
                                                Selected: {newSubcategory.image.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Status</label>
                                        <select
                                            value={newSubcategory.status}
                                            onChange={(e) => setNewSubcategory(prev => ({ ...prev, status: e.target.value }))}
                                            className="modal-input"
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowAddSubcategory(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={handleAddSubcategory}
                                        disabled={addingSubcategory}
                                    >
                                        {addingSubcategory ? 'Adding...' : 'Add Subcategory'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Less Weight Details Popup */}
                {
                    showLessWeightPopup && (
                        <div className="modal-overlay">
                            <div className="modal-content modal-content-large">
                                <div className="modal-header">
                                    <h3>
                                        Less Weight Details
                                        {lessWeightItems.some(item =>
                                            item.item || item.stamp || item.clarity || item.color ||
                                            item.cuts || item.shapes || item.remarks ||
                                            item.weight || item.tunch || item.pur_rate ||
                                            item.profit || item.sale_rate
                                        ) && !lessWeightData.saved && (
                                                <span style={{ color: '#f59e0b', fontSize: '14px', marginLeft: '10px' }}>
                                                    (Unsaved Changes)
                                                </span>
                                            )}
                                    </h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={handleLessWeightCancel}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {/* Summary Section */}
                                    <div className="less-weight-summary">
                                        <div className="less-weight-summary-header">
                                            <div>
                                                <strong>Total Items: {lessWeightItems.length}</strong>
                                            </div>
                                            <div>
                                                <strong>Total Less Weight: {calculateTotalLessWeight()}g</strong>
                                            </div>
                                            <div>
                                                <strong>Total Diamond Weight: {lessWeightItems.reduce((total, item) => {
                                                    if (!isDiamondItem(item)) return total;

                                                    const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
                                                    const units = item.units;

                                                    // Convert to carats if needed
                                                    let weightInCarats = 0;
                                                    switch (units) {
                                                        case 'carat':
                                                            weightInCarats = weight;
                                                            break;
                                                        case 'gram':
                                                            weightInCarats = weight * 5;
                                                            break;
                                                        case 'cent':
                                                            weightInCarats = weight * 0.05;
                                                            break;
                                                        case 'pc':
                                                            weightInCarats = weight * 0.5;
                                                            break;
                                                        case 'kg':
                                                            weightInCarats = weight * 5000;
                                                            break;
                                                        case 'ratti':
                                                            weightInCarats = weight * 0.91;
                                                            break;
                                                        default:
                                                            weightInCarats = weight;
                                                    }
                                                    return total + weightInCarats;
                                                }, 0).toFixed(3)} carats</strong>
                                            </div>
                                            <div>
                                                <strong>Total Stone Weight: {lessWeightItems.reduce((total, item) => {
                                                    if (!isStoneItem(item)) return total;

                                                    const weight = parseFloat(item.weight) || 0; // Use 'weight' field instead of 'weight_carat'
                                                    const units = item.units;

                                                    // Convert to carats if needed
                                                    let weightInCarats = 0;
                                                    switch (units) {
                                                        case 'carat':
                                                            weightInCarats = weight;
                                                            break;
                                                        case 'gram':
                                                            weightInCarats = weight * 5;
                                                            break;
                                                        case 'cent':
                                                            weightInCarats = weight * 0.05;
                                                            break;
                                                        case 'pc':
                                                            weightInCarats = weight * 0.5;
                                                            break;
                                                        case 'kg':
                                                            weightInCarats = weight * 5000;
                                                            break;
                                                        case 'ratti':
                                                            weightInCarats = weight * 0.91;
                                                            break;
                                                        default:
                                                            weightInCarats = weight;
                                                    }
                                                    return total + weightInCarats;
                                                }, 0).toFixed(3)} carats</strong>
                                            </div>
                                            <div>
                                                <strong>Total Stone Sell Value: ₹{calculateTotalStoneSellValue()}</strong>
                                            </div>
                                            <div>
                                                <strong>Total Diamond Value: ₹{calculateTotalDiamondValue()}</strong>
                                            </div>
                                            <div>
                                                <strong>Total Sell Value: ₹{calculateTotalSellValue()}</strong>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addLessWeightItem}
                                                className="add-item-btn"
                                            >
                                                <Plus size={16} /> Add Item
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="less-weight-table-container">
                                        <table className="less-weight-table">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Stamp</th>
                                                    <th>Clarity</th>
                                                    <th>Color</th>
                                                    <th>Cuts</th>
                                                    <th>Shapes</th>
                                                    <th>Remarks</th>
                                                    <th>Pieces</th>
                                                    <th>Weight</th>
                                                    <th>Units</th>
                                                    <th>Purity</th>
                                                    <th>Purchase Rate (₹/unit)</th>
                                                    <th>Sale Rate (₹/unit)</th>
                                                    <th>Total Profit</th>
                                                    <th>Purchase Value</th>
                                                    <th>Sale Value</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lessWeightItems.map((item, index) => (
                                                    <tr key={index} className={
                                                        isDiamondItem(item) ? 'diamond-item-row' :
                                                            isStoneItem(item) ? 'stone-item-row' : ''
                                                    }>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={item.item}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'item', e.target.value)}
                                                                placeholder="Item name"
                                                                list={`items-list-${index}`}
                                                            />
                                                            <datalist id={`items-list-${index}`}>
                                                                {gemstoneCatalog && gemstoneCatalog.length > 0 ? (
                                                                    gemstoneCatalog.map((gemstone) => (
                                                                        <option key={gemstone.id} value={gemstone.name} />
                                                                    ))
                                                                ) : (
                                                                    <option value="Loading..." disabled />
                                                                )}
                                                            </datalist>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={item.stamp}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'stamp', e.target.value)}
                                                                placeholder="Stamp"
                                                                list={`stamps-list-${index}`}
                                                            />
                                                            <datalist id={`stamps-list-${index}`}>
                                                                {lessWeightDatalistOptions.stamps.map((stamp) => (
                                                                    <option key={stamp} value={stamp} />
                                                                ))}
                                                            </datalist>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={item.clarity}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'clarity', e.target.value)}
                                                                placeholder="Clarity"
                                                                list={`clarities-list-${index}`}
                                                            />
                                                            <datalist id={`clarities-list-${index}`}>
                                                                {lessWeightDatalistOptions.clarities.map((clarity) => (
                                                                    <option key={clarity} value={clarity} />
                                                                ))}
                                                            </datalist>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={item.color}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'color', e.target.value)}
                                                                placeholder="Color"
                                                                list={`colors-list-${index}`}
                                                            />
                                                            <datalist id={`colors-list-${index}`}>
                                                                {lessWeightDatalistOptions.colors.map((color) => (
                                                                    <option key={color} value={color} />
                                                                ))}
                                                            </datalist>
                                                        </td>
                                                        <td className="table-cell-padding">
                                                            <input
                                                                type="text"
                                                                value={item.cuts}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'cuts', e.target.value)}
                                                                placeholder="Cuts"
                                                                list={`cuts-list-${index}`}
                                                                className="table-input"
                                                            />
                                                            <datalist id={`cuts-list-${index}`}>
                                                                {lessWeightDatalistOptions.cuts.map((cut) => (
                                                                    <option key={cut} value={cut} />
                                                                ))}
                                                            </datalist>
                                                        </td>
                                                        <td className="table-cell-padding">
                                                            <input
                                                                type="text"
                                                                value={item.shapes}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'shapes', e.target.value)}
                                                                placeholder="Shapes"
                                                                list={`shapes-list-${index}`}
                                                                className="table-input"
                                                            />
                                                            <datalist id={`shapes-list-${index}`}>
                                                                {/* Valid Shape Options */}
                                                                <option value="Round" />
                                                                <option value="Princess" />
                                                                <option value="Oval" />
                                                                <option value="Marquise" />
                                                                <option value="Pear" />
                                                                <option value="Emerald" />
                                                                <option value="Asscher" />
                                                                <option value="Radiant" />
                                                                <option value="Cushion" />
                                                                <option value="Heart" />
                                                                <option value="Trillion" />
                                                                <option value="Baguette" />
                                                                <option value="Square" />
                                                                <option value="Rectangle" />
                                                                <option value="Triangle" />
                                                                <option value="Hexagon" />
                                                                <option value="Octagon" />
                                                                <option value="Pentagon" />
                                                                <option value="Diamond" />
                                                                <option value="Star" />
                                                                <option value="Cross" />
                                                                <option value="Flower" />
                                                                <option value="Butterfly" />
                                                                <option value="Leaf" />
                                                                <option value="Animal" />
                                                                <option value="Barrel" />
                                                                <option value="Drop" />
                                                                <option value="Nugget" />
                                                                <option value="Freeform" />
                                                                <option value="Organic" />
                                                                <option value="Geometric" />
                                                                <option value="Abstract" />
                                                                <option value="Natural" />
                                                                <option value="Irregular" />
                                                                <option value="Teardrop" />
                                                                <option value="Briolette" />
                                                                <option value="Rose" />
                                                                <option value="Cabochon" />
                                                                <option value="Bead" />
                                                                <option value="Chip" />
                                                                <option value="Slice" />
                                                                <option value="Sphere" />
                                                                <option value="Oblong" />
                                                                <option value="Rhombus" />
                                                                <option value="Trapezoid" />
                                                                <option value="Cone" />
                                                                <option value="Pyramid" />
                                                                <option value="Cube" />
                                                                <option value="Cylinder" />
                                                                <option value="Torus" />
                                                                <option value="Spiral" />
                                                                <option value="Wave" />
                                                                <option value="Curved" />
                                                                <option value="Angular" />
                                                                <option value="Smooth" />
                                                                <option value="Textured" />
                                                                <option value="Faceted" />
                                                                <option value="Polished" />
                                                                <option value="Rough" />
                                                                <option value="Tumbled" />
                                                                <option value="Carved" />
                                                                <option value="Engraved" />
                                                                <option value="Beaded" />
                                                                <option value="Drilled" />
                                                                <option value="Sliced" />
                                                            </datalist>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={item.remarks}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'remarks', e.target.value)}
                                                                placeholder="Remarks"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.pieces}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'pieces', e.target.value)}
                                                                placeholder="1"
                                                                min="1"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.weight}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'weight', e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.001"
                                                                min="0"
                                                                title={`Weight in ${item.units || 'carat'}`}
                                                                className="table-input"
                                                            />
                                                        </td>
                                                        <td>
                                                            <select
                                                                value={item.units}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'units', e.target.value)}
                                                            >
                                                                {unitsOptions.map((unit) => (
                                                                    <option key={unit.value} value={unit.value}>
                                                                        {unit.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.tunch}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'tunch', e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.purchase_value}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'purchase_value', e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                                title={`Purchase rate per ${item.units || 'carat'}`}
                                                                className="table-input"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.sale_rate}
                                                                onChange={(e) => handleLessWeightItemChange(index, 'sale_rate', e.target.value)}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                                title={`Sale rate per ${item.units || 'carat'}`}
                                                                className="table-input"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.total_profit || ''}
                                                                placeholder="Auto-calculated"
                                                                readOnly
                                                                title="Total profit for all pieces"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.per_value || ''}
                                                                placeholder="Auto-calculated"
                                                                readOnly
                                                                title="Purchase value per piece"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={item.total_sale_rate || ''}
                                                                placeholder="Auto-calculated"
                                                                readOnly
                                                                title="Total sale value for all pieces"
                                                            />
                                                        </td>
                                                        <td className="table-cell-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeLessWeightItem(index)}
                                                                className="remove-btn"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={handleLessWeightCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={handleLessWeightSubmit}
                                    >
                                        Save & Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Add Sub-Subcategory Modal */}
                {
                    showAddSubSubcategory && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Add New Sub-Subcategory</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowAddSubSubcategory(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="modal-form-group">
                                        <label>Sub-Subcategory Name *</label>
                                        <input
                                            type="text"
                                            value={newSubSubcategory.name}
                                            onChange={(e) => setNewSubSubcategory(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Gold Metal, Silver Metal"
                                            className="modal-input"
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={newSubSubcategory.description}
                                            onChange={(e) => setNewSubSubcategory(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Brief description of the sub-subcategory"
                                            rows="3"
                                            className="modal-input"
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowAddSubSubcategory(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={handleAddSubSubcategory}
                                        disabled={addingSubSubcategory}
                                    >
                                        {addingSubSubcategory ? 'Adding...' : 'Add Sub-Subcategory'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Description Popup Modal */}
                {
                    showDescriptionPopup && (
                        <div className="modal-overlay">
                            <div className="modal-content modal-content-medium">
                                <div className="modal-header">
                                    <h3>Product Description</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowDescriptionPopup(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="modal-form-group">
                                        <label>Description *</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Enter detailed product description..."
                                            rows="8"
                                            className="modal-input description-textarea"
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowDescriptionPopup(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={() => setShowDescriptionPopup(false)}
                                    >
                                        Save Description
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Product Options Popup Modal */}
                {
                    showProductOptionsPopup && (
                        <div className="modal-overlay">
                            <div className="modal-content modal-content-large">
                                <div className="modal-header">
                                    <h3>Product Options</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowProductOptionsPopup(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div className="product-options-table-container">
                                        {/* Table Header */}
                                        <div className="product-options-table-header">
                                            <div className="product-options-table-header-cell">Size</div>
                                            <div className="product-options-table-header-cell">Weight</div>
                                            <div className="product-options-table-header-cell">Dimensions</div>

                                            <div className="product-options-table-header-cell">Metal Color</div>
                                            <div className="product-options-table-header-cell">Gender</div>
                                            <div className="product-options-table-header-cell">Occasion</div>
                                            <div className="product-options-table-header-cell">Value</div>
                                            <div className="product-options-table-header-cell">Sell Price</div>
                                            <div className="product-options-table-header-cell">Actions</div>
                                        </div>

                                        {/* Data Rows */}
                                        {productOptions.map((option, idx) => (
                                            <div key={idx} className="product-options-table-row">
                                                {/* Size */}
                                                <input
                                                    type="text"
                                                    value={option.size}
                                                    onChange={e => handleProductOptionChange(idx, 'size', e.target.value)}
                                                    placeholder="Size"
                                                    className="product-options-table-input"
                                                />

                                                {/* Weight */}
                                                <input
                                                    type="text"
                                                    value={option.weight}
                                                    onChange={e => handleProductOptionChange(idx, 'weight', e.target.value)}
                                                    placeholder="Weight"
                                                    className="product-options-table-input"
                                                />

                                                {/* Dimensions */}
                                                <div className="dimensions-inputs">
                                                    <input
                                                        type="text"
                                                        value={option.length || ''}
                                                        onChange={e => {
                                                            const length = e.target.value;
                                                            const width = option.width || '';
                                                            const height = option.height || '';
                                                            const dimensions = [length, width, height].filter(val => val.trim()).join(' x ');
                                                            handleProductOptionChange(idx, 'length', length);
                                                            handleProductOptionChange(idx, 'dimensions', dimensions);
                                                        }}
                                                        placeholder="Length"
                                                        className="dimension-input"
                                                    />
                                                    <span className="dimension-separator">x</span>
                                                    <input
                                                        type="text"
                                                        value={option.width || ''}
                                                        onChange={e => {
                                                            const length = option.length || '';
                                                            const width = e.target.value;
                                                            const height = option.height || '';
                                                            const dimensions = [length, width, height].filter(val => val.trim()).join(' x ');
                                                            handleProductOptionChange(idx, 'width', width);
                                                            handleProductOptionChange(idx, 'dimensions', dimensions);
                                                        }}
                                                        placeholder="Width"
                                                        className="dimension-input"
                                                    />
                                                    <span className="dimension-separator">x</span>
                                                    <input
                                                        type="text"
                                                        value={option.height || ''}
                                                        onChange={e => {
                                                            const length = option.length || '';
                                                            const width = option.width || '';
                                                            const height = e.target.value;
                                                            const dimensions = [length, width, height].filter(val => val.trim()).join(' x ');
                                                            handleProductOptionChange(idx, 'height', height);
                                                            handleProductOptionChange(idx, 'dimensions', dimensions);
                                                        }}
                                                        placeholder="Height"
                                                        className="dimension-input"
                                                    />
                                                </div>



                                                {/* Metal Color */}
                                                <select
                                                    value={option.metal_color || ''}
                                                    onChange={e => handleProductOptionChange(idx, 'metal_color', e.target.value)}
                                                    className="product-options-table-select"
                                                >
                                                    <option value="">Color</option>
                                                    {metalColorOptions.map((color, index) => (
                                                        <option key={index} value={color.value}>
                                                            {color.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                {/* Gender */}
                                                <div className="product-options-gender-container">
                                                    <button
                                                        type="button"
                                                        className="product-options-select-btn"
                                                        onClick={() => {
                                                            // Create a popup for gender selection
                                                            const selectedGenders = option.gender ? option.gender.split(',').map(g => g.trim()) : [];
                                                            const genderPopup = window.open('', 'genderPopup', 'width=400,height=500,scrollbars=yes,resizable=yes');
                                                            genderPopup.document.write(`
                                                                <html>
                                                                <head>
                                                                    <title>Select Gender</title>
                                                                    <style>
                                                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                                                        .gender-option { margin: 10px 0; }
                                                                        .gender-option label { display: flex; align-items: center; cursor: pointer; }
                                                                        .gender-option input { margin-right: 10px; }
                                                                        .buttons { margin-top: 20px; text-align: center; }
                                                                        .btn { padding: 8px 16px; margin: 0 5px; cursor: pointer; }
                                                                        .btn-primary { background: #007bff; color: white; border: none; border-radius: 4px; }
                                                                        .btn-secondary { background: #6c757d; color: white; border: none; border-radius: 4px; }
                                                                    </style>
                                                                </head>
                                                                <body>
                                                                    <h3>Select Gender (Multiple)</h3>
                                                                    ${genderOptions.map((gender) => `
                                                                        <div class="gender-option">
                                                                            <label>
                                                                                <input type="checkbox" value="${gender.value}" ${selectedGenders.includes(gender.value) ? 'checked' : ''}>
                                                                                ${gender.label}
                                                                            </label>
                                                                        </div>
                                                                    `).join('')}
                                                                    <div class="buttons">
                                                                        <button class="btn btn-primary" onclick="saveSelection()">Save</button>
                                                                        <button class="btn btn-secondary" onclick="window.close()">Cancel</button>
                                                                    </div>
                                                                    <script>
                                                                        function saveSelection() {
                                                                            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                                                                            const selectedValues = Array.from(checkboxes).map(cb => cb.value);
                                                                            window.opener.postMessage({
                                                                                type: 'genderSelection',
                                                                                data: selectedValues.join(', ')
                                                                            }, '*');
                                                                            window.close();
                                                                        }
                                                                    </script>
                                                                </body>
                                                                </html>
                                                            `);

                                                            // Listen for the selection
                                                            window.addEventListener('message', function (event) {
                                                                if (event.data.type === 'genderSelection') {
                                                                    handleProductOptionChange(idx, 'gender', event.data.data);
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        {option.gender ? option.gender.split(',').map(g => genderOptions.find(go => go.value === g.trim())?.label).filter(Boolean).join(', ') : 'Select Gender'}
                                                    </button>
                                                </div>

                                                {/* Occasion */}
                                                <div className="product-options-occasion-container">
                                                    <button
                                                        type="button"
                                                        className="product-options-select-btn"
                                                        onClick={() => {
                                                            // Create a popup for occasion selection
                                                            const selectedOccasions = option.occasion ? option.occasion.split(',').map(o => o.trim()) : [];
                                                            const occasionPopup = window.open('', 'occasionPopup', 'width=500,height=600,scrollbars=yes,resizable=yes');
                                                            occasionPopup.document.write(`
                                                                <html>
                                                                <head>
                                                                    <title>Select Occasion</title>
                                                                    <style>
                                                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                                                        .occasion-option { margin: 8px 0; }
                                                                        .occasion-option label { display: flex; align-items: center; cursor: pointer; }
                                                                        .occasion-option input { margin-right: 10px; }
                                                                        .buttons { margin-top: 20px; text-align: center; }
                                                                        .btn { padding: 8px 16px; margin: 0 5px; cursor: pointer; }
                                                                        .btn-primary { background: #007bff; color: white; border: none; border-radius: 4px; }
                                                                        .btn-secondary { background: #6c757d; color: white; border: none; border-radius: 4px; }
                                                                        .selected-count { color: #007bff; font-weight: bold; margin-bottom: 10px; }
                                                                    </style>
                                                                </head>
                                                                <body>
                                                                    <h3>Select Occasion (Multiple)</h3>
                                                                    <div class="selected-count" id="selectedCount">Selected: 0</div>
                                                                    ${occasionOptions.map((occasion) => `
                                                                        <div class="occasion-option">
                                                                            <label>
                                                                                <input type="checkbox" value="${occasion.value}" ${selectedOccasions.includes(occasion.value) ? 'checked' : ''} onchange="updateCount()">
                                                                                ${occasion.label}
                                                                </label>
                                                    </div>
                                                                    `).join('')}
                                                                    <div class="buttons">
                                                                        <button class="btn btn-primary" onclick="saveSelection()">Save</button>
                                                                        <button class="btn btn-secondary" onclick="window.close()">Cancel</button>
                                                </div>
                                                                    <script>
                                                                        function updateCount() {
                                                                            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                                                                            document.getElementById('selectedCount').textContent = 'Selected: ' + checkboxes.length;
                                                                        }
                                                                        function saveSelection() {
                                                                            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                                                                            const selectedValues = Array.from(checkboxes).map(cb => cb.value);
                                                                            window.opener.postMessage({
                                                                                type: 'occasionSelection',
                                                                                data: selectedValues.join(', ')
                                                                            }, '*');
                                                                            window.close();
                                                                        }
                                                                        updateCount();
                                                                    </script>
                                                                </body>
                                                                </html>
                                                            `);

                                                            // Listen for the selection
                                                            window.addEventListener('message', function (event) {
                                                                if (event.data.type === 'occasionSelection') {
                                                                    handleProductOptionChange(idx, 'occasion', event.data.data);
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        {option.occasion ? option.occasion.split(',').map(o => occasionOptions.find(oo => oo.value === o.trim())?.label).filter(Boolean).join(', ') : 'Select Occasion'}
                                                    </button>
                                                </div>

                                                {/* Value */}
                                                <input
                                                    type="number"
                                                    value={option.value}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        handleProductOptionChange(idx, 'value', value);

                                                        // Auto-calculate sell price: total + extra value
                                                        const totalValue = parseFloat(formData.total || 0);
                                                        const extraValue = parseFloat(value || 0);
                                                        const newSellPrice = totalValue + extraValue;
                                                        handleProductOptionChange(idx, 'sell_price', newSellPrice.toFixed(2));
                                                    }}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    className="product-options-table-input"
                                                />

                                                {/* Sell Price */}
                                                <input
                                                    type="number"
                                                    value={option.sell_price || formData.total || '0.00'}
                                                    onChange={e => handleProductOptionChange(idx, 'sell_price', e.target.value)}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    className="product-options-table-input"
                                                />

                                                {/* Actions */}
                                                <div className="product-options-table-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProductOption(idx)}
                                                        className="product-options-remove-btn"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Option Button */}
                                        <button
                                            type="button"
                                            onClick={addProductOption}
                                            className="product-options-add-btn"
                                        >
                                            <Plus size={14} /> Add Option
                                        </button>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowProductOptionsPopup(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={() => setShowProductOptionsPopup(false)}
                                    >
                                        Save Options
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Product Features Popup Modal */}
                {
                    showProductFeaturesPopup && (
                        <div className="modal-overlay">
                            <div className="modal-content modal-content-large">
                                <div className="modal-header">
                                    <h3>Product Features</h3>
                                    <button
                                        type="button"
                                        className="modal-close-btn"
                                        onClick={() => setShowProductFeaturesPopup(false)}
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>
                                <div className="modal-body">
                                    {/* Feature Points Multiple Inputs */}
                                    <div className="feature-points-container">
                                        <label className="feature-points-label">Feature Points:</label>
                                        <div className="feature-inputs-list">
                                            {featureInputs.map((input, index) => (
                                                <div key={index} className="feature-input-row">
                                                    <input
                                                        type="text"
                                                        value={input}
                                                        onChange={(e) => updateFeatureInput(index, e.target.value)}
                                                        placeholder={`Feature point ${index + 1}`}
                                                        className="feature-input-field"
                                                    />
                                                    {featureInputs.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFeatureInput(index)}
                                                            className="feature-remove-btn"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addFeatureInput}
                                                className="feature-add-btn"
                                            >
                                                + Add Feature Point
                                            </button>
                                        </div>
                                        <div className="feature-points-help">
                                            Add multiple feature points. Each input will be saved as a separate feature.
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-cancel-btn"
                                        onClick={() => setShowProductFeaturesPopup(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="modal-submit-btn"
                                        onClick={() => {
                                            saveFeatureInputs();
                                            setShowProductFeaturesPopup(false);
                                        }}
                                    >
                                        Save Features
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default AddProductPopup;