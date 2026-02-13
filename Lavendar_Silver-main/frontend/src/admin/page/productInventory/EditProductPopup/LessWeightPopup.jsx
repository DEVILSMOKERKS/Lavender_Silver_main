import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { lessWeightDatalistOptions } from '../../../../data/productOptions';
import './LessWeightPopup.css';

const LessWeightPopup = ({
    isOpen,
    onClose,
    lessWeightItems,
    setLessWeightItems,
    productId,
    hasLessWeightValue = false,
    onWeightUpdate = null // Callback to update parent with calculated weights
}) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [gemstoneCatalog, setGemstoneCatalog] = useState([]);

    // Fetch gemstone catalog from API
    const fetchGemstoneCatalog = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/gemstone-catalog`);
            if (response.data.success) {
                setGemstoneCatalog(response.data.data);
            } else {
                console.warn('⚠️ Gemstone catalog response not successful:', response.data);
                // Use fallback data if API fails
                setGemstoneCatalog(getFallbackGemstoneData());
            }
        } catch (error) {
            console.error('❌ Error fetching gemstone catalog:', error);
            // Use fallback data if API fails
            setGemstoneCatalog(getFallbackGemstoneData());
        }
    };

    // Fallback gemstone data if API fails
    const getFallbackGemstoneData = () => {
        return [
            // Diamonds
            { id: 1, name: 'Diamond', type: 'diamond' },
            { id: 2, name: 'Solitaire', type: 'diamond' },
            { id: 3, name: 'Brilliant', type: 'diamond' },
            { id: 4, name: 'Princess', type: 'diamond' },
            { id: 5, name: 'Round Diamond', type: 'diamond' },
            { id: 6, name: 'Pear Diamond', type: 'diamond' },
            { id: 7, name: 'Oval Diamond', type: 'diamond' },
            { id: 8, name: 'Marquise Diamond', type: 'diamond' },
            { id: 9, name: 'Emerald Cut Diamond', type: 'diamond' },
            { id: 10, name: 'Asscher Diamond', type: 'diamond' },
            { id: 11, name: 'Radiant Diamond', type: 'diamond' },
            { id: 12, name: 'Cushion Diamond', type: 'diamond' },
            { id: 13, name: 'Heart Diamond', type: 'diamond' },
            { id: 14, name: 'Trillion Diamond', type: 'diamond' },
            { id: 15, name: 'Baguette Diamond', type: 'diamond' },
            { id: 16, name: 'Rose Cut Diamond', type: 'diamond' },
            { id: 17, name: 'Old Mine Cut', type: 'diamond' },
            { id: 18, name: 'Old European Cut', type: 'diamond' },

            // Stones
            { id: 19, name: 'Ruby', type: 'stone' },
            { id: 20, name: 'Emerald', type: 'stone' },
            { id: 21, name: 'Sapphire', type: 'stone' },
            { id: 22, name: 'Pearl', type: 'stone' },
            { id: 23, name: 'Opal', type: 'stone' },
            { id: 24, name: 'Garnet', type: 'stone' },
            { id: 25, name: 'Topaz', type: 'stone' },
            { id: 26, name: 'Amethyst', type: 'stone' },
            { id: 27, name: 'Citrine', type: 'stone' },
            { id: 28, name: 'Peridot', type: 'stone' },
            { id: 29, name: 'Aquamarine', type: 'stone' },
            { id: 30, name: 'Tanzanite', type: 'stone' },
            { id: 31, name: 'Tourmaline', type: 'stone' },
            { id: 32, name: 'Zircon', type: 'stone' },
            { id: 33, name: 'Spinel', type: 'stone' },
            { id: 34, name: 'Alexandrite', type: 'stone' },
            { id: 35, name: 'Moonstone', type: 'stone' },
            { id: 36, name: 'Lapis Lazuli', type: 'stone' },
            { id: 37, name: 'Turquoise', type: 'stone' },
            { id: 38, name: 'Jade', type: 'stone' },
            { id: 39, name: 'Onyx', type: 'stone' },
            { id: 40, name: 'Agate', type: 'stone' },
            { id: 41, name: 'Coral', type: 'stone' },
            { id: 42, name: 'Amber', type: 'stone' },
            { id: 43, name: 'CZ', type: 'stone' },
            { id: 44, name: 'Cubic Zirconia', type: 'stone' },
            { id: 45, name: 'Lab Created', type: 'stone' },
            { id: 46, name: 'Synthetic', type: 'stone' },
            { id: 47, name: 'Stone', type: 'stone' },
            { id: 48, name: 'Gemstone', type: 'stone' },
            { id: 49, name: 'Gem', type: 'stone' },
            { id: 50, name: 'Birthstone', type: 'stone' }
        ];
    };

    useEffect(() => {
        if (isOpen) {
            // Fetch gemstone catalog when popup opens
            fetchGemstoneCatalog();

            // If no items exist, show one default empty row
            if (lessWeightItems.length === 0) {
                setItems([{
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
            } else {
                // If there are existing items, map backend fields to frontend fields
                const mappedItems = lessWeightItems.map(item => ({
                    ...item,
                    weight: item.weight || 0, // Ensure weight is explicitly included
                    purchase_value: item.purchase_rate || item.purchase_value || '', // Backend purchase_rate → Frontend purchase_value
                    per_value: item.purchase_value || item.per_value || '', // Backend purchase_value → Frontend per_value
                    profit: item.profit || item.total_profit || ''
                }));

                // Recalculate all fields for existing items to ensure consistency
                const recalculatedItems = mappedItems.map(item => {
                    // Trigger auto-calculation for each item to ensure all calculated fields are up-to-date
                    return autoCalculateFields(item, 'weight', item.weight);
                });

                setItems(recalculatedItems);
            }
        }
    }, [isOpen, lessWeightItems, hasLessWeightValue]);


    // Auto-calculation function (same as AddProductPopup)
    const autoCalculateFields = (item, field, value) => {
        const updatedItem = { ...item, [field]: value };

        // Auto-calculate fields based on weight, purchase_value, sale_rate, pieces, units, and tunch
        if (field === 'weight' || field === 'purchase_value' || field === 'sale_rate' || field === 'pieces' || field === 'units' || field === 'tunch') {
            const weight = parseFloat(updatedItem.weight) || 0;
            const purchaseValue = parseFloat(updatedItem.purchase_value) || 0;
            const saleRate = parseFloat(updatedItem.sale_rate) || 0;
            const pieces = parseFloat(updatedItem.pieces) || 1;
            const units = updatedItem.units || 'carat';
            const tunch = parseFloat(updatedItem.tunch) || 0;

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

            // Calculate per value (weight * purchase_value per unit) - EXACTLY like AddProductPopup
            const perValue = (weight * purchaseValue).toFixed(2);
            updatedItem.per_value = perValue;

            // Calculate sale value (weight * sale_rate per unit) - EXACTLY like AddProductPopup
            const saleValue = (weight * saleRate).toFixed(2);
            updatedItem.sale_value = saleValue;

            // Calculate profit (sale_value - per_value) - EXACTLY like AddProductPopup
            const profit = (parseFloat(saleValue) - parseFloat(perValue)).toFixed(2);
            updatedItem.profit = profit;

            // Calculate pieces rate (per_value * pieces) - this is the total purchase value for all pieces - EXACTLY like AddProductPopup
            const piecesRate = (parseFloat(perValue) * pieces).toFixed(2);
            updatedItem.pieces_rate = piecesRate;

            // Calculate total sale rate (sale_value * pieces) - this is the total sale value for all pieces - EXACTLY like AddProductPopup
            const totalSaleRate = (parseFloat(saleValue) * pieces).toFixed(2);
            updatedItem.total_sale_rate = totalSaleRate;

            // Calculate total profit (profit * pieces) - EXACTLY like AddProductPopup
            const totalProfit = (parseFloat(profit) * pieces).toFixed(2);
            updatedItem.total_profit = totalProfit;

            // Store the weight in grams for reference
            updatedItem.weight_in_grams = adjustedWeight.toFixed(3);
        }

        return updatedItem;
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
            'oval diamond', 'marquise diamond', 'emerald cut diamond', 'asscher diamond',
            'radiant diamond', 'cushion diamond', 'heart diamond', 'trillion diamond',
            'baguette diamond', 'rose cut diamond', 'old mine cut', 'old european cut'
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
            // Semi-Precious Stones
            'garnet', 'topaz', 'amethyst', 'citrine', 'peridot', 'aquamarine',
            'tanzanite', 'tourmaline', 'zircon', 'spinel', 'alexandrite',
            'moonstone', 'lapis lazuli', 'turquoise', 'jade', 'onyx',
            'agate', 'coral', 'amber', 'quartz', 'crystal',
            // Lab-created stones
            'cz', 'cubic zirconia', 'lab created', 'synthetic',
            // General terms
            'stone', 'gemstone', 'gem', 'birthstone'
        ];

        return stoneKeywords.some(keyword => itemName.includes(keyword));
    };

    // Calculate total less weight in grams
    const calculateTotalLessWeight = () => {
        return items.reduce((total, item) => {
            const weight = parseFloat(item.weight) || 0;
            const units = item.units || 'carat';

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

    // Calculate total diamond weight in carats
    const calculateTotalDiamondWeight = () => {
        return items.reduce((total, item) => {
            if (!isDiamondItem(item)) return total;

            const weight = parseFloat(item.weight) || 0;
            const units = item.units || 'carat';

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
        }, 0).toFixed(3);
    };

    // Calculate total stone weight in carats
    const calculateTotalStoneWeight = () => {
        return items.reduce((total, item) => {
            if (!isStoneItem(item)) return total;

            const weight = parseFloat(item.weight) || 0;
            const units = item.units || 'carat';

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
        }, 0).toFixed(3);
    };

    // Calculate total stone sell value
    const calculateTotalStoneSellValue = () => {
        return items.reduce((total, item) => {
            if (!isStoneItem(item)) return total;
            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0).toFixed(2);
    };

    // Calculate total diamond value
    const calculateTotalDiamondValue = () => {
        return items.reduce((total, item) => {
            if (!isDiamondItem(item)) return total;
            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0).toFixed(2);
    };

    // Calculate total sell value
    const calculateTotalSellValue = () => {
        return items.reduce((total, item) => {
            const totalSaleRate = parseFloat(item.total_sale_rate) || 0;
            return total + totalSaleRate;
        }, 0).toFixed(2);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Filter out empty items (items with no item name)
            const validItems = items.filter(item => item.item && item.item.trim() !== '');

            // Map frontend fields to backend fields (same as AddProductPopup)
            const mappedItems = validItems.map(item => ({
                ...item,
                weight: item.weight || 0, // Ensure weight is explicitly included
                purchase_rate: item.purchase_value ? parseFloat(item.purchase_value) : 0,
                purchase_value: item.per_value ? parseFloat(item.per_value) : 0
            }));

            const payload = {
                product_less_weight: mappedItems
            };


            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/product-data`,
                payload
            );
            setLessWeightItems(validItems);

            // Update parent component with calculated weights
            if (onWeightUpdate) {
                onWeightUpdate({
                    totalLessWeight: calculateTotalLessWeight(),
                    totalDiamondWeight: calculateTotalDiamondWeight(),
                    totalStoneWeight: calculateTotalStoneWeight()
                });
            }

            onClose();
        } catch (error) {
            console.error('Error saving less weight items:', error);
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Error saving less weight items. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, {
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
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index) {
                return autoCalculateFields(item, field, value);
            }
            return item;
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="less-weight-edit-popup-overlay">
            <div className="less-weight-edit-popup">
                <div className="less-weight-edit-popup-header">
                    <h3>Less Weight Items</h3>
                    <button onClick={onClose} className="less-weight-edit-popup-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="less-weight-edit-popup-content">
                    <div className="less-weight-edit-popup-actions">
                        <button onClick={addItem} className="less-weight-edit-add-item-btn">
                            <Plus size={16} />
                            Add Item
                        </button>
                    </div>

                    {/* Summary Section */}
                    <div className="less-weight-edit-summary">
                        <div className="less-weight-edit-summary-header">
                            <div>
                                <div>Total</div>
                                <div><strong>Items: {items.length}</strong></div>
                            </div>
                            <div>
                                <div>Total Less Weight:</div>
                                <div><strong>{calculateTotalLessWeight()}g</strong></div>
                            </div>
                            <div>
                                <div>Total Diamond Weight:</div>
                                <div><strong>{calculateTotalDiamondWeight()} carats</strong></div>
                            </div>
                            <div>
                                <div>Total Stone Weight:</div>
                                <div><strong>{calculateTotalStoneWeight()} carats</strong></div>
                            </div>
                            <div>
                                <div>Total Stone Sell Value:</div>
                                <div><strong>₹{calculateTotalStoneSellValue()}</strong></div>
                            </div>
                            <div>
                                <div>Total Diamond Value:</div>
                                <div><strong>₹{calculateTotalDiamondValue()}</strong></div>
                            </div>
                            <div>
                                <div>Total Sell Value:</div>
                                <div><strong>₹{calculateTotalSellValue()}</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="less-weight-edit-table-container">
                        <table className="less-weight-edit-table">
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
                                {items.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={
                                            isDiamondItem(item) ? 'less-weight-edit-diamond-item-row' :
                                                isStoneItem(item) ? 'less-weight-edit-stone-item-row' : ''
                                        }
                                    >
                                        <td>
                                            <input
                                                type="text"
                                                value={item.item || ''}
                                                onChange={(e) => updateItem(index, 'item', e.target.value)}
                                                className="less-weight-edit-table-input"
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
                                                value={item.stamp || ''}
                                                onChange={(e) => updateItem(index, 'stamp', e.target.value)}
                                                className="less-weight-edit-table-input"
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
                                                value={item.clarity || ''}
                                                onChange={(e) => updateItem(index, 'clarity', e.target.value)}
                                                className="less-weight-edit-table-input"
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
                                                value={item.color || ''}
                                                onChange={(e) => updateItem(index, 'color', e.target.value)}
                                                className="less-weight-edit-table-input"
                                                placeholder="Color"
                                                list={`colors-list-${index}`}
                                            />
                                            <datalist id={`colors-list-${index}`}>
                                                {lessWeightDatalistOptions.colors.map((color) => (
                                                    <option key={color} value={color} />
                                                ))}
                                            </datalist>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.cuts || ''}
                                                onChange={(e) => updateItem(index, 'cuts', e.target.value)}
                                                className="less-weight-edit-table-input"
                                                placeholder="Cuts"
                                                list={`cuts-list-${index}`}
                                            />
                                            <datalist id={`cuts-list-${index}`}>
                                                {lessWeightDatalistOptions.cuts.map((cut) => (
                                                    <option key={cut} value={cut} />
                                                ))}
                                            </datalist>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.shapes || ''}
                                                onChange={(e) => updateItem(index, 'shapes', e.target.value)}
                                                className="less-weight-edit-table-input"
                                                placeholder="Shapes"
                                                list={`shapes-list-${index}`}
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
                                            </datalist>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.remarks || ''}
                                                onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                                                className="less-weight-edit-table-input"
                                                placeholder="Remarks"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.pieces || 1}
                                                onChange={(e) => updateItem(index, 'pieces', e.target.value)}
                                                min="1"
                                                className="less-weight-edit-table-input"
                                                placeholder="1"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.weight || ''}
                                                onChange={(e) => updateItem(index, 'weight', e.target.value)}
                                                step="0.001"
                                                min="0"
                                                className="less-weight-edit-table-input"
                                                placeholder="0.00"
                                                title={`Weight in ${item.units || 'carat'}`}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={item.units || 'carat'}
                                                onChange={(e) => updateItem(index, 'units', e.target.value)}
                                                className="less-weight-edit-table-input"
                                            >
                                                <option value="carat">Carat</option>
                                                <option value="gram">Gram</option>
                                                <option value="cent">Cent</option>
                                                <option value="pc">PC</option>
                                                <option value="kg">KG</option>
                                                <option value="ratti">Ratti</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.tunch || ''}
                                                onChange={(e) => updateItem(index, 'tunch', e.target.value)}
                                                step="0.01"
                                                min="0"
                                                className="less-weight-edit-table-input"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.purchase_value || ''}
                                                onChange={(e) => updateItem(index, 'purchase_value', e.target.value)}
                                                step="0.01"
                                                min="0"
                                                className="less-weight-edit-table-input"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.sale_rate || ''}
                                                onChange={(e) => updateItem(index, 'sale_rate', e.target.value)}
                                                step="0.01"
                                                min="0"
                                                className="less-weight-edit-table-input"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.profit || ''}
                                                readOnly
                                                className="less-weight-edit-table-input less-weight-edit-table-input-readonly"
                                                placeholder="Auto calculated"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.per_value || ''}
                                                readOnly
                                                className="less-weight-edit-table-input less-weight-edit-table-input-readonly"
                                                placeholder="Auto calculated"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.sale_value || ''}
                                                readOnly
                                                className="less-weight-edit-table-input less-weight-edit-table-input-readonly"
                                                placeholder="Auto calculated"
                                            />
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="less-weight-edit-table-delete-btn"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="less-weight-edit-popup-footer">
                    <button onClick={onClose} className="less-weight-edit-cancel-btn">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="less-weight-edit-save-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessWeightPopup;
