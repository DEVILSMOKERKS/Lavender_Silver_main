import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Loader2, Plus, Trash2, X } from 'lucide-react';
import axios from 'axios';
import './ProductDataSection.css';
import LessWeightPopup from './LessWeightPopup';
import DescriptionPopup from './DescriptionPopup';
import MultipleSelectionPopup from './MultipleSelectionPopup';
import {
    batchOptions,
    unitOptions,
    labourTypeOptions,
    designTypeOptions,
    manufacturingTypeOptions,
    yesNoOptions
} from '../../../../data/productOptions';

const ProductDataSection = ({ productId, formData, setFormData, onDataUpdate, metalTypes: parentMetalTypes, gemstones: parentGemstones }) => {

    // States
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [metalTypes, setMetalTypes] = useState([]);
    const [lessWeightItems, setLessWeightItems] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [showLessWeightPopup, setShowLessWeightPopup] = useState(false);
    const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
    const [showGenderPopup, setShowGenderPopup] = useState(false);
    const [showOccasionPopup, setShowOccasionPopup] = useState(false);
    const [currentSelectionContext, setCurrentSelectionContext] = useState(null);

    const [weightDetails, setWeightDetails] = useState({
        gross_weight: '',
        less_weight: ''
    });
    const [dataLoaded, setDataLoaded] = useState(false);

    // Gender and Occasion options
    const genderOptions = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'woman', label: 'Woman' },
        { value: 'unisex', label: 'Unisex' },
        { value: 'kids', label: 'Kids' }
    ];

    const occasionOptions = [
        { value: 'wedding', label: 'Wedding' },
        { value: 'engagement', label: 'Engagement' },
        { value: 'anniversary', label: 'Anniversary' },
        { value: 'birthday', label: 'Birthday' },
        { value: 'festival', label: 'Festival' },
        { value: 'party', label: 'Party' },
        { value: 'formal', label: 'Formal' },
        { value: 'casual', label: 'Casual' },
        { value: 'daily-wear', label: 'Daily Wear' },
        { value: 'office', label: 'Office' },
        { value: 'travel', label: 'Travel' },
        { value: 'sports', label: 'Sports' }
    ];

    // Use parent metal types if available, otherwise fetch our own
    const effectiveMetalTypes = parentMetalTypes && parentMetalTypes.length > 0 ? parentMetalTypes : metalTypes;

    // Fetch data on component mount or productId change
    useEffect(() => {
        if (productId && !dataLoaded) {
            fetchAllData();
        }
    }, [productId, dataLoaded]);

    // Update metal types when parent provides them
    useEffect(() => {
        if (parentMetalTypes && parentMetalTypes.length > 0) {
            setMetalTypes(parentMetalTypes);
        }
    }, [parentMetalTypes]);

    const fetchAllData = async () => {
        if (!productId) return;

        setLoading(true);
        try {
            // Fetch metal types if not provided by parent
            if (!parentMetalTypes || parentMetalTypes.length === 0) {
                try {
                    const metalTypesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/metal-rates/rates/current`);
                    const ratesData = metalTypesRes.data.success ? metalTypesRes.data.data : metalTypesRes.data;
                    setMetalTypes(Array.isArray(ratesData) ? ratesData : []);
                } catch (metalError) {
                    console.warn('Failed to fetch metal types:', metalError);
                    setMetalTypes([]);
                }
            }

            // Fetch comprehensive product data
            const productDataRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/product-data`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });

            if (productDataRes.data.success && productDataRes.data.data) {
                const data = productDataRes.data.data;

                // Comprehensive form data mapping with all backend fields
                const comprehensiveFormData = {
                    // Basic product information
                    id: data.id || '',
                    slug: data.slug || '',
                    tag_number: data.tag_number || '',
                    item_name: data.item_name || '',
                    description: data.description || '',
                    status: data.status || 'active',
                    remark: data.remark || '',
                    batch: data.batch || '',

                    // Weight and measurements
                    unit: data.unit || 'Gm',
                    pieces: data.pieces,
                    gross_weight: data.gross_weight || '',
                    less_weight: data.less_weight || '',
                    net_weight: data.net_weight || '',
                    additional_weight: data.additional_weight || '',
                    tunch: data.tunch || '',
                    wastage_percentage: data.wastage_percentage || '',

                    // Pricing and rates
                    rate: data.rate || '',
                    total_rs: data.total_rs || '',
                    diamond_weight: data.diamond_weight || '',
                    stone_weight: data.stone_weight || '',
                    labour: data.labour || '',
                    labour_on: data.labour_on || 'Wt',
                    // Labour details - Initialize all labour fields properly based on labour_on
                    labour_flat: data.labour_on === 'Fl' ? (data.labour || '0') : '0',
                    labour_percent: data.labour_on === 'Pc' ? (data.labour || '0') : '0',
                    labour_weight: data.labour_on === 'Wt' ? (data.labour || '0') : '0',
                    other: data.other || '',
                    total_fine_weight: data.total_fine_weight || '',

                    // Product specifications
                    design_type: data.design_type || '',
                    manufacturing: data.manufacturing || '',
                    manufacturing_type: data.manufacturing_type || '',
                    customizable: data.customizable === 1 ? true : false,
                    engraving: data.engraving === 1 ? true : false,
                    engraving_option: data.engraving === 1 ? true : false,
                    hallmark: data.hallmark === 1 ? true : false,
                    certificate_number: data.certificate_number || '',

                    // Metal and category information
                    stamp: data.stamp || '',
                    metal_id: data.metal_id || '',
                    metal_purity_id: data.metal_purity_id || '',
                    category_id: data.category_id || '',
                    subcategory_id: data.subcategory_id || '',
                    sub_subcategory_id: data.sub_subcategory_id || '',

                    // Additional fields
                    discount: data.discount || '',
                    product_type: data.product_type || '',
                    gender: data.gender || '',
                    ideal_for: data.ideal_for || '',
                    occasion: data.occasion || '',
                    base_price: data.base_price || '',
                    selling_price: data.selling_price || '',
                    cost_price: data.cost_price || '',
                    offer_discount: data.offer_discount || '',
                    gst_tax_rate: data.gst_tax_rate || '',
                    price_per_gram: data.price_per_gram || ''
                };

                // Update form data
                setFormData(prev => ({ ...prev, ...comprehensiveFormData }));

                // Set related data arrays first
                setLessWeightItems(data.product_less_weight || []);
                setProductOptions(data.product_options || []);

                // Set weight details for calculations (less_weight will be auto-calculated)
                setWeightDetails({
                    gross_weight: data.gross_weight || '',
                    less_weight: '' // Will be auto-calculated from less weight items
                });

                setDataLoaded(true);
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
        } finally {
            setLoading(false);
        }
    };


    // Enhanced auto-calculations (simplified without complex labour calculations)
    const calculations = useMemo(() => {
        const rate = parseFloat(formData.rate) || 0;
        const gross = parseFloat(weightDetails.gross_weight) || 0;
        const less = parseFloat(weightDetails.less_weight) || 0;
        const additional = parseFloat(formData.additional_weight) || 0;
        const tunch = parseFloat(formData.tunch) || 100;
        const wastage = parseFloat(formData.wastage_percentage) || 0;
        const other = parseFloat(formData.other) || 0;

        // Basic calculations (no pieces multiplication)
        const total = rate.toFixed(2);
        const netWeight = gross > 0 && less >= 0 ? (gross - less).toFixed(3) : '';

        // Fine weight calculation with tunch and wastage (same as AddProductPopup)
        let fineWeight = '';
        if (gross > 0) {
            // Step 1: Calculate net weight
            const netWeight = gross - less;

            // Step 2: Add additional weight to net weight
            let workingWeight = netWeight + additional;

            // Step 3: Apply tunch percentage
            if (tunch > 0) {
                workingWeight = workingWeight * (tunch / 100);
            }

            // Step 4: Add wastage percentage to the tunch-adjusted weight
            if (wastage > 0) {
                const wastageAmount = workingWeight * (wastage / 100);
                workingWeight = workingWeight + wastageAmount;
            }

            fineWeight = workingWeight > 0 ? workingWeight.toFixed(5) : '0.00000';
        }

        // Calculate labour cost based on labour type (same logic as AddProductPopup)
        let labourCost = 0;
        const labourType = formData.labour_on || 'Wt';
        const netWeightForLabour = (gross - less) + additional; // Net Weight + Additional Weight

        // Get the correct labour value based on labour type
        let labourValue = 0;
        if (labourType === 'Fl') {
            labourValue = parseFloat(formData.labour_flat) || 0;
            labourCost = labourValue; // Flat rate - no weight calculation
        } else if (labourType === 'Pc') {
            labourValue = parseFloat(formData.labour_percent) || 0;
            // Percentage Type: (net_weight × labour_percentage_value) × rate
            if (labourValue > 0 && netWeightForLabour > 0) {
                // Calculate only labour portion: net_weight × labour_percentage_value
                const labourWeight = netWeightForLabour * (labourValue / 100);
                // Labour cost = labour weight × rate
                labourCost = labourWeight * rate;
            }
        } else if (labourType === 'Wt') {
            labourValue = parseFloat(formData.labour_weight) || 0;
            // Weight Type: labour_value × net_weight (including additional weight)
            if (labourValue > 0 && netWeightForLabour > 0) {
                labourCost = labourValue * netWeightForLabour;
            }
        }

        // Total RS calculation (rate + calculated labour cost + other)
        const totalRS = (parseFloat(total) + labourCost + other).toFixed(2);

        // Price per gram calculation
        let pricePerGram = '';
        if (gross > 0 && rate > 0) {
            pricePerGram = (rate / gross).toFixed(2);
        }

        return {
            total,
            netWeight,
            fineWeight,
            totalRS,
            pricePerGram
        };
    }, [
        formData.rate,
        formData.additional_weight,
        formData.tunch,
        formData.wastage_percentage,
        formData.labour_on,
        formData.labour_flat,
        formData.labour_percent,
        formData.labour_weight,
        formData.other,
        weightDetails.gross_weight,
        weightDetails.less_weight
    ]);

    // Auto-update calculated fields
    useEffect(() => {
        if (formData.rate) {
            setFormData(prev => ({
                ...prev,
                total: calculations.total,
                total_rs: calculations.totalRS,
                price_per_gram: calculations.pricePerGram,
                net_weight: calculations.netWeight,
                total_fine_weight: calculations.fineWeight
            }));
        }
    }, [calculations, setFormData, formData.rate]);


    // Update total calculation when relevant fields change (comprehensive calculation like AddProductPopup)
    useEffect(() => {
        if (dataLoaded) {
            const comprehensiveCalculations = calculateTotalWithPurchaseRate();
            setFormData(prev => ({
                ...prev,
                total: comprehensiveCalculations.total,
                total_fine_weight: comprehensiveCalculations.fine
            }));
        }
    }, [
        formData.rate,
        formData.additional_weight,
        formData.tunch,
        formData.wastage_percentage,
        formData.labour_on,
        formData.labour_flat,
        formData.labour_percent,
        formData.labour_weight,
        formData.other,
        weightDetails.gross_weight,
        weightDetails.less_weight,
        lessWeightItems,
        dataLoaded,
        setFormData
    ]);

    // Generic function to find matching metal type from stamp value
    const findMetalTypeFromStamp = useCallback((stampValue) => {
        if (!stampValue || !effectiveMetalTypes.length) {
            return null;
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

            let matchingMetal = null;

            // Strategy 1: Exact match with stamp value (case-insensitive)
            matchingMetal = effectiveMetalTypes.find(mt => {
                if (mt.purity_name && mt.tunch_value) {
                    const apiTunchValue = Math.round(parseFloat(mt.tunch_value));
                    const apiPurityName = mt.purity_name.toUpperCase();
                    const constructedStamp = `${apiPurityName} / ${apiTunchValue}`;
                    return constructedStamp.toUpperCase() === normalizedStamp ||
                        constructedStamp.replace(/\s+/g, ' ').toUpperCase() === normalizedStamp.replace(/\s+/g, ' ');
                }
                return false;
            });

            // Strategy 2: Match by tunch value and purity_name/karat
            if (!matchingMetal && numbers.length > 0) {
                const tunchValue = numbers[numbers.length - 1]; // Use last number as tunch value

                if (karatValue) {
                    // Match by karat and tunch
                    matchingMetal = effectiveMetalTypes.find(mt => {
                        if (mt.purity_name && mt.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(mt.tunch_value));
                            const apiKaratValue = mt.purity_name.toUpperCase();
                            return apiKaratValue === karatValue && apiTunchValue === tunchValue;
                        }
                        return false;
                    });
                }

                // If still not found, try matching by tunch value and any word in purity_name
                if (!matchingMetal && words.length > 0) {
                    matchingMetal = effectiveMetalTypes.find(mt => {
                        if (mt.purity_name && mt.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(mt.tunch_value));
                            const apiPurityName = mt.purity_name.toUpperCase();
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
                if (!matchingMetal && words.length > 0) {
                    matchingMetal = effectiveMetalTypes.find(mt => {
                        if (mt.metal_name && mt.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(mt.tunch_value));
                            const apiMetalName = mt.metal_name.toUpperCase();
                            const tunchMatches = apiTunchValue === tunchValue;
                            const wordMatches = words.some(word => apiMetalName.includes(word));
                            return tunchMatches && wordMatches;
                        }
                        return false;
                    });
                }

                // If still not found, try matching by tunch value only (last resort)
                if (!matchingMetal) {
                    matchingMetal = effectiveMetalTypes.find(mt => {
                        if (mt.tunch_value) {
                            const apiTunchValue = Math.round(parseFloat(mt.tunch_value));
                            return apiTunchValue === tunchValue;
                        }
                        return false;
                    });
                }
            }

            // Strategy 3: Match by karat only (if no tunch value found)
            if (!matchingMetal && karatValue) {
                matchingMetal = effectiveMetalTypes.find(mt => {
                    if (mt.purity_name) {
                        const apiKaratValue = mt.purity_name.toUpperCase();
                        return apiKaratValue === karatValue;
                    }
                    return false;
                });
            }

            // Strategy 4: Fuzzy match by words in purity_name or metal_name
            if (!matchingMetal && words.length > 0) {
                matchingMetal = effectiveMetalTypes.find(mt => {
                    const apiPurityName = (mt.purity_name || '').toUpperCase();
                    const apiMetalName = (mt.metal_name || '').toUpperCase();
                    return words.some(word => apiPurityName.includes(word) || apiMetalName.includes(word));
                });
            }

            return matchingMetal;
        } catch (error) {
            console.error('Error parsing stamp:', error);
            return null;
        }
    }, [effectiveMetalTypes]);

    // Auto-populate metal type and rate when stamp changes
    useEffect(() => {
        if (formData.stamp) {
            const matchingMetal = findMetalTypeFromStamp(formData.stamp);
            if (matchingMetal) {
                setFormData(prev => ({
                    ...prev,
                    metal_id: matchingMetal.metal_type_id?.toString() || '',
                    metal_purity_id: matchingMetal.purity_id?.toString() || '',
                    rate: matchingMetal.rate_per_gram || ''
                }));
            }
        }
    }, [formData.stamp, findMetalTypeFromStamp, setFormData]);

    // Sync labour fields when data is loaded from backend
    useEffect(() => {
        if (dataLoaded && formData.labour_on) {
            setFormData(prev => {
                // Get the current labour value from the appropriate field based on labour type
                let labourValue = '0';
                if (prev.labour_on === 'Fl') {
                    labourValue = prev.labour_flat || '0';
                } else if (prev.labour_on === 'Pc') {
                    labourValue = prev.labour_percent || '0';
                } else if (prev.labour_on === 'Wt') {
                    labourValue = prev.labour_weight || '0';
                }

                // Update the main labour field with the type-specific value (only if it's different)
                if (prev.labour !== labourValue) {
                    return { ...prev, labour: labourValue };
                }
                return prev;
            });
        }
    }, [dataLoaded, formData.labour_on, formData.labour_flat, formData.labour_percent, formData.labour_weight, setFormData]);

    // Input handlers - complex labour logic like AddProductPopup
    const handleInputChange = useCallback((field, value) => {
        // Handle labour value input - set value in the appropriate field based on labour type
        if (field === 'labour') {
            setFormData(prev => {
                const newData = { ...prev };
                // Clear all labour fields first
                newData.labour_flat = '0';
                newData.labour_percent = '0';
                newData.labour_weight = '0';

                // Set the value in the appropriate field based on current labour type
                const labourValue = value || '0'; // Default to '0' if empty
                if (prev.labour_on === 'Fl') {
                    newData.labour_flat = labourValue;
                } else if (prev.labour_on === 'Pc') {
                    newData.labour_percent = labourValue;
                } else if (prev.labour_on === 'Wt') {
                    newData.labour_weight = labourValue;
                }

                // Also update the main labour field
                newData.labour = labourValue;

                return newData;
            });
        }
        // Handle labour type change - preserve the labour value and recalculate
        else if (field === 'labour_on') {
            setFormData(prev => {
                // Get the current labour value from the input field based on current type
                let currentValue = '0';
                if (prev.labour_on === 'Fl') {
                    currentValue = prev.labour_flat || '0';
                } else if (prev.labour_on === 'Pc') {
                    currentValue = prev.labour_percent || '0';
                } else if (prev.labour_on === 'Wt') {
                    currentValue = prev.labour_weight || '0';
                }

                // Create new data object with all labour fields cleared
                const newData = {
                    ...prev,
                    labour_flat: '0',
                    labour_percent: '0',
                    labour_weight: '0',
                    labour_on: value,
                    labour: currentValue // Preserve current value in main labour field
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
        // Handle other fields normally
        else {
            // Convert string boolean values to actual booleans for TINYINT fields
            let finalValue = value;
            if (['customizable', 'engraving_option', 'hallmark'].includes(field)) {
                if (value === 'true') {
                    finalValue = true;
                } else if (value === 'false') {
                    finalValue = false;
                }
            }
            setFormData(prev => ({ ...prev, [field]: finalValue }));
        }
    }, [setFormData]);

    const handleWeightChange = useCallback((field, value) => {
        setWeightDetails(prev => ({ ...prev, [field]: value }));
    }, []);

    // Enhanced stamp handling - uses generic matching function
    const handleStampChange = useCallback((value) => {
        setFormData(prev => ({ ...prev, stamp: value }));

        if (value) {
            const matchingMetal = findMetalTypeFromStamp(value);
            if (matchingMetal) {
                setFormData(prev => ({
                    ...prev,
                    metal_id: matchingMetal.metal_type_id?.toString() || '',
                    metal_purity_id: matchingMetal.purity_id?.toString() || '',
                    rate: matchingMetal.rate_per_gram || ''
                }));
            }
        }
    }, [findMetalTypeFromStamp, setFormData]);


    // Refresh data function
    const refreshData = () => {
        setDataLoaded(false);
        fetchAllData();
    };

    // Handle description save
    const handleDescriptionSave = async (newDescription) => {
        setFormData(prev => ({
            ...prev,
            description: newDescription
        }));
    };

    // Stone and Diamond detection functions (same as AddProductPopup)
    const isDiamondItem = (item) => {
        const itemName = item.item?.toLowerCase() || '';

        // First check database catalog if available
        if (parentGemstones && parentGemstones.length > 0) {
            const catalogItem = parentGemstones.find(gem =>
                gem.name.toLowerCase() === itemName && gem.type === 'diamond'
            );
            if (catalogItem) {
                return true;
            }
        }

        // Fallback to hardcoded keywords
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

    const isStoneItem = (item) => {
        const itemName = item.item?.toLowerCase() || '';

        // First check database catalog if available
        if (parentGemstones && parentGemstones.length > 0) {
            const catalogItem = parentGemstones.find(gem =>
                gem.name.toLowerCase() === itemName && gem.type === 'stone'
            );
            if (catalogItem) {
                return true;
            }
        }

        // Fallback to hardcoded keywords
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
            // And many more stone varieties...
            'charoite', 'larimar', 'sugilite', 'seraphinite', 'chrysocolla', 'azurite', 'malachite', 'rhodochrosite', 'rhodonite', 'smithsonite', 'sodalite', 'sphene', 'spodumene', 'staurolite', 'sunstone', 'thomsonite', 'variscite', 'vesuvianite', 'zoisite'
        ];

        return stoneKeywords.some(keyword => itemName.includes(keyword));
    };

    // Fine weight calculation function (same as AddProductPopup)
    const calculateFineValue = () => {
        const additionalWeight = parseFloat(formData.additional_weight) || 0;
        const tunch = parseFloat(formData.tunch) || 0;
        const wastage = parseFloat(formData.wastage_percentage) || 0;
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

    // Comprehensive TOTAL RS calculation function (same as AddProductPopup)
    const calculateTotalWithPurchaseRate = () => {
        const rate = parseFloat(formData.rate) || 0;
        const other = parseFloat(formData.other) || 0;

        // Calculate fine value with current weight details
        const additionalWeight = parseFloat(formData.additional_weight) || 0;
        const tunch = parseFloat(formData.tunch) || 0;
        const wastage = parseFloat(formData.wastage_percentage) || 0;
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

        // Calculate labour cost based on labour type (same logic as AddProductPopup)
        const labourType = formData.labour_on || 'Wt';
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


    // Calculate total less weight from items (comprehensive logic same as AddProductPopup)
    const calculateTotalLessWeight = () => {
        return lessWeightItems.reduce((total, item) => {
            const weight = parseFloat(item.weight || item.weight_carat) || 0;
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


    // Calculate total diamond weight in carats from less weight items (comprehensive logic same as AddProductPopup)
    const calculateTotalDiamondWeight = () => {
        return lessWeightItems.reduce((total, item) => {
            if (!isDiamondItem(item)) return total;

            const weight = parseFloat(item.weight || item.weight_carat) || 0;
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

    // Calculate total stone weight in carats from less weight items (comprehensive logic same as AddProductPopup)
    const calculateTotalStoneWeight = () => {
        return lessWeightItems.reduce((total, item) => {
            if (!isStoneItem(item)) return total;

            const weight = parseFloat(item.weight || item.weight_carat) || 0;
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

    // Update less weight total when items change (comprehensive logic same as AddProductPopup)
    useEffect(() => {
        if (dataLoaded) {
            const totalLessWeight = calculateTotalLessWeight();


            // Always update less weight (even if 0)
            setWeightDetails(prev => ({
                ...prev,
                less_weight: totalLessWeight
            }));

            // Always update form data with calculated less weight
            setFormData(prev => ({
                ...prev,
                less_weight: totalLessWeight
            }));

            const totalDiamondWeight = calculateTotalDiamondWeight();
            const totalStoneWeight = calculateTotalStoneWeight();

            // Update diamond weight in form data if diamond items are present
            if (totalDiamondWeight > 0) {
                setFormData(prev => ({
                    ...prev,
                    diamond_weight: totalDiamondWeight
                }));
            }

            // Update stone weight in form data if stone items are present
            if (totalStoneWeight > 0) {
                setFormData(prev => ({
                    ...prev,
                    stone_weight: totalStoneWeight
                }));
            }
        }
    }, [lessWeightItems, dataLoaded]);



    // Array management functions
    const arrayHandlers = {
        lessWeight: {
            add: () => setLessWeightItems(prev => [...prev, {
                item: '', stamp: '', clarity: '', color: '', cuts: '', shapes: '',
                pieces: 1, weight: '', units: 'carat', tunch: '',
                purchase_value: '', sale_rate: '', profit: ''
            }]),
            remove: (index) => setLessWeightItems(prev => prev.filter((_, i) => i !== index)),
            update: (index, field, value) => setLessWeightItems(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [field]: value };

                // Auto-calculate fields based on weight, purchase_value, sale_rate, pieces, units, and tunch
                if (field === 'weight' || field === 'purchase_value' || field === 'sale_rate' || field === 'pieces' || field === 'units' || field === 'tunch') {
                    const weight = parseFloat(updated[index].weight || updated[index].weight_carat) || 0;
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

                    // Calculate pieces rate (per_value * pieces) - this is the total purchase value for all pieces
                    const piecesRate = (parseFloat(perValue) * pieces).toFixed(2);
                    updated[index].pieces_rate = piecesRate;

                    // Calculate total sale rate (sale_value * pieces) - this is the total sale value for all pieces
                    const totalSaleRate = (parseFloat(saleValue) * pieces).toFixed(2);
                    updated[index].total_sale_rate = totalSaleRate;

                    // Calculate total profit (total_sale_rate - pieces_rate)
                    const totalProfit = (parseFloat(totalSaleRate) - parseFloat(piecesRate)).toFixed(2);
                    updated[index].total_profit = totalProfit;

                    // Store the weight in grams for reference
                    updated[index].weight_in_grams = adjustedWeight.toFixed(5);
                }

                return updated;
            })
        },
        options: {
            add: () => {
                // Auto-populate weight (final weight or net weight) and sell price from form data
                const finalWeight = calculations.fineWeight || calculations.netWeight || '';
                const newOption = {
                    size: '',
                    weight: finalWeight,
                    dimensions: '',
                    metal_color: '',
                    gender: '',
                    occasion: '',
                    value: '0',
                    sell_price: formData.total || formData.total_rs || '0'
                };
                setProductOptions(prev => [...prev, newOption]);
            },
            remove: (index) => setProductOptions(prev => prev.filter((_, i) => i !== index)),
            update: (index, field, value) => {
                setProductOptions(prev => {
                    const updated = prev.map((option, i) => {
                        if (i === index) {
                            const newOption = { ...option, [field]: value };

                            // Auto-calculate sell_price when value changes
                            if (field === 'value') {
                                const basePrice = parseFloat(formData.total || formData.total_rs || 0);
                                const extraValue = parseFloat(value || 0);
                                newOption.sell_price = (basePrice + extraValue).toFixed(2);
                            }

                            return newOption;
                        }
                        return option;
                    });
                    return updated;
                });
            }
        }
    };

    // Auto-update product options when form data changes (only weight and sell_price for FIRST row)
    useEffect(() => {
        if (productOptions.length > 0) {
            setProductOptions(prev => prev.map((option, index) => {
                const updatedOption = { ...option };

                // Only update the FIRST row (index 0) with calculated values
                if (index === 0) {
                    // Always update weight with TOTAL FINE WEIGHT value
                    const finalWeight = calculations.fineWeight || calculations.netWeight || '';
                    updatedOption.weight = finalWeight;

                    // Always update sell_price with TOTAL RS value (base price + value)
                    const basePrice = parseFloat(formData.total || formData.total_rs || 0);
                    const extraValue = parseFloat(option.value || 0);
                    updatedOption.sell_price = (basePrice + extraValue).toFixed(2);
                }

                return updatedOption;
            }));
        }
    }, [
        calculations.fineWeight,
        calculations.netWeight,
        formData.total,
        formData.total_rs,
        formData.rate,
        formData.additional_weight,
        formData.tunch,
        formData.wastage_percentage,
        weightDetails.gross_weight,
        weightDetails.less_weight
    ]);

    // Multiple selection handlers
    const handleGenderSelection = (optionIndex, selectedValues) => {
        const updatedOptions = [...productOptions];
        updatedOptions[optionIndex].gender = selectedValues.join(', ');
        setProductOptions(updatedOptions);
    };

    const handleOccasionSelection = (optionIndex, selectedValues) => {
        const updatedOptions = [...productOptions];
        updatedOptions[optionIndex].occasion = selectedValues.join(', ');
        setProductOptions(updatedOptions);
    };

    const openGenderPopup = (optionIndex) => {
        setCurrentSelectionContext(optionIndex);
        setShowGenderPopup(true);
    };

    const openOccasionPopup = (optionIndex) => {
        setCurrentSelectionContext(optionIndex);
        setShowOccasionPopup(true);
    };

    // Save function
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                total_rs: formData.total,
                gross_weight: weightDetails.gross_weight,
                less_weight: weightDetails.less_weight,
                product_less_weight: lessWeightItems,
                product_options: productOptions
            };
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/product-data`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                onDataUpdate?.();
            }
        } catch (error) {
            console.error('Error updating product data:', error);
        } finally {
            setSaving(false);
        }
    };

    // Render form field
    const renderField = (label, field, type = 'text', options = null, props = {}) => (
        <div className="product-edit-data-section-form-group">
            <label>{label}</label>
            {options ? (
                <select
                    value={formData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    {...props}
                >
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={formData[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    {...props}
                />
            )}
        </div>
    );

    // Render table
    const renderTable = (title, items, headers, renderRow, handlers) => (
        <div className="product-edit-data-section-form-section">
            <div className="section-header-with-button">
                <h4 className="section-subtitle">{title}</h4>
                <button type="button" onClick={handlers.add} className="add-item-btn">
                    <Plus size={16} />
                    Add {title.split(' ').pop()}
                </button>
            </div>

            {items.length > 0 && (
                <div className={`${title.toLowerCase().replace(/\s+/g, '-')}-table-container`}>
                    <table className={`${title.toLowerCase().replace(/\s+/g, '-')}-table`}>
                        <thead>
                            <tr>
                                {headers.map(header => <th key={header}>{header}</th>)}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    {renderRow(item, index, handlers.update)}
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => handlers.remove(index)}
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
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 className="animate-spin" size={24} />
                <span>Loading product data...</span>
            </div>
        );
    }


    return (
        <div className="product-edit-data-section-container">
            <div className="product-edit-data-section-header">
                <h3 className="product-edit-data-section-title">Product Data Entry</h3>
                <button
                    type="button"
                    onClick={refreshData}
                    className="product-edit-data-section-refresh-btn"
                    title="Refresh Product Data"
                >
                    <Loader2 size={16} />
                    Refresh
                </button>
            </div>

            {/* Main Form */}
            <div className="product-edit-data-section-form-section">
                <div className="product-edit-data-section-form-horizontal-scroll">
                    {/* Basic Fields */}
                    {renderField('TAG NUMBER', 'tag_number', 'text', null, { placeholder: 'TAG25659751' })}
                    {renderField('BATCH', 'batch', 'text', null, { placeholder: 'Enter batch', list: 'batch-options' })}
                    {renderField('ITEM NAME', 'item_name', 'text', null, { placeholder: 'Item Name', required: true })}

                    {/* Stamp Field */}
                    <div className="product-edit-data-section-form-group">
                        <label>STAMP</label>
                        <select
                            value={formData.stamp || ''}
                            onChange={(e) => handleStampChange(e.target.value)}
                        >
                            <option value="">Select Stamp</option>
                            {effectiveMetalTypes
                                .filter(mt => mt.purity_name && mt.tunch_value)
                                .map((mt, index) => {
                                    const tunchValue = Math.round(parseFloat(mt.tunch_value));
                                    // Format purity_name to proper case (e.g., "22k" -> "22K" or "999 SILVER" -> "999 SILVER")
                                    const formattedPurityName = mt.purity_name.toUpperCase().replace('K', 'K');
                                    const stampValue = `${formattedPurityName} / ${tunchValue}`;
                                    return (
                                        <option key={index} value={stampValue}>
                                            {stampValue}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>

                    {/* Continue with other fields... */}
                    {renderField('REMARK', 'remark', 'text', null, { placeholder: 'Remark' })}
                    {renderField('UNIT', 'unit', 'select', unitOptions)}
                    {renderField('PIECES', 'pieces', 'number', null, { placeholder: '1', min: '0', required: true })}

                    {/* Weight Fields */}
                    <div className="product-edit-data-section-form-group">
                        <label>GROSS WEIGHT</label>
                        <input
                            type="number"
                            value={weightDetails.gross_weight}
                            onChange={(e) => handleWeightChange('gross_weight', e.target.value)}
                            placeholder="0.000"
                            step="0.001"
                        />
                    </div>

                    <div className="product-edit-data-section-form-group">
                        <label>LESS WEIGHT</label>
                        <input
                            type="number"
                            value={weightDetails.less_weight || ''}
                            placeholder="0.000"
                            step="0.001"
                            min="0"
                            readOnly
                            className="product-edit-data-section-form-group-readonly"
                            onClick={() => setShowLessWeightPopup(true)}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>

                    <div className="product-edit-data-section-form-group">
                        <label>NET WEIGHT</label>
                        <input
                            type="text"
                            value={calculations.netWeight}
                            readOnly
                            className="product-edit-data-section-form-group-readonly"
                            placeholder="Auto"
                        />
                    </div>

                    {/* Continue with remaining fields... */}
                    {renderField('ADDITIONAL WEIGHT', 'additional_weight', 'number', null, { placeholder: '0', step: '0.001' })}
                    {renderField('PURITY', 'tunch', 'number', null, { placeholder: '100', step: '0.01', min: '0', max: '100' })}
                    {renderField('WASTAGE (%)', 'wastage_percentage', 'number', null, { placeholder: '0.00', step: '0.01', min: '0' })}
                    {renderField('RATE', 'rate', 'number', null, { placeholder: '0.00', step: '0.01', required: true })}

                    {/* Labour Field - complex logic like AddProductPopup */}
                    <div className="product-edit-data-section-form-group">
                        <label>LABOUR</label>
                        <input
                            type="number"
                            value={(() => {
                                if (formData.labour_on === 'Fl') return formData.labour_flat || '';
                                if (formData.labour_on === 'Pc') return formData.labour_percent || '';
                                if (formData.labour_on === 'Wt') return formData.labour_weight || '';
                                return '';
                            })()}
                            onChange={(e) => handleInputChange('labour', e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>

                    <div className="product-edit-data-section-form-group">
                        <label>LABOUR TYPE</label>
                        <select
                            value={formData.labour_on || 'Wt'}
                            onChange={(e) => handleInputChange('labour_on', e.target.value)}
                            className="product-edit-data-section-form-group-input"
                        >
                            {labourTypeOptions.map((labour) => (
                                <option key={labour.value} value={labour.value}>
                                    {labour.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {renderField('OTHER', 'other', 'number', null, { placeholder: '0', step: '0.01' })}

                    <div className="product-edit-data-section-form-group">
                        <label>TOTAL FINE WEIGHT</label>
                        <div className="product-edit-data-section-breakdown-tooltip">
                            <input
                                type="text"
                                value={calculateTotalWithPurchaseRate().fine}
                                readOnly
                                className="product-edit-data-section-form-group-readonly"
                                placeholder="Auto"
                            />
                            <span className="product-edit-data-section-tooltip-text">
                                {(() => {
                                    const additionalWeight = parseFloat(formData.additional_weight || 0);
                                    const tunch = parseFloat(formData.tunch || 0);
                                    const wastage = parseFloat(formData.wastage_percentage || 0);

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
                    </div>

                    <div className="product-edit-data-section-form-group">
                        <label>TOTAL RS</label>
                        <div className="product-edit-data-section-breakdown-tooltip">
                            <input
                                type="number"
                                value={formData.total || calculateTotalWithPurchaseRate().total}
                                onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
                                className="product-edit-data-section-form-group-input"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                            <span className="product-edit-data-section-tooltip-text">
                                Breakdown:<br />
                                • Metal Value: ₹{(() => {
                                    const fine = parseFloat(calculateTotalWithPurchaseRate().fine);
                                    const rate = parseFloat(formData.rate) || 0;
                                    return (fine * rate).toFixed(2);
                                })()}<br />
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
                                    const labourType = formData.labour_on || 'Wt';
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
                                • Total Fine Weight: {parseFloat(calculateTotalWithPurchaseRate().fine).toFixed(3)}<br />
                                <strong>Total Rs: ₹{calculateTotalWithPurchaseRate().total || '0.00'}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Remaining fields... */}
                    {renderField('STATUS', 'status', 'select', [
                        { value: '', label: 'Select Status' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                    ])}

                    {/* Diamond and Stone weights with units */}
                    <div className="product-edit-data-section-form-group">
                        <label>DIAMOND WEIGHT</label>
                        <div className="input-with-unit">
                            <input
                                type="number"
                                value={formData.diamond_weight}
                                readOnly
                                className="product-edit-data-section-form-group-readonly"
                                placeholder="0.000"
                                step="0.001"
                            />
                            <span className="unit-label">carats</span>
                        </div>
                    </div>

                    <div className="product-edit-data-section-form-group">
                        <label>STONE WEIGHT</label>
                        <div className="input-with-unit">
                            <input
                                type="number"
                                value={formData.stone_weight}
                                readOnly
                                className="product-edit-data-section-form-group-readonly"
                                placeholder="0.000"
                                step="0.001"
                            />
                            <span className="unit-label">carats</span>
                        </div>
                    </div>

                    <div className="product-edit-data-section-form-group">
                        <label>DESCRIPTION</label>
                        <input
                            type="text"
                            value={formData.description || ''}
                            readOnly
                            className="product-edit-data-section-form-group-readonly"
                            placeholder="Click to edit description"
                            onClick={() => setShowDescriptionPopup(true)}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                    {renderField('DESIGN TYPE', 'design_type', 'select', designTypeOptions)}
                    {renderField('MANUFACTURING', 'manufacturing_type', 'select', manufacturingTypeOptions)}
                    {renderField('CUSTOMIZABLE', 'customizable', 'select', yesNoOptions)}
                    {renderField('ENGRAVING', 'engraving_option', 'select', yesNoOptions)}
                    {renderField('HALLMARK', 'hallmark', 'select', yesNoOptions)}
                    {renderField('CERTIFICATE NUMBER', 'certificate_number', 'text', null, { placeholder: 'Cert #' })}

                    {/* Auto-filled fields */}
                    <div className="product-edit-data-section-form-group">
                        <label>METAL TYPE</label>
                        <input
                            type="text"
                            value={formData.metal_id || 'Auto-filled from stamp'}
                            readOnly
                            className="product-edit-data-section-form-group-readonly"
                        />
                    </div>

                    <div className="product-edit-data-section-form-group">
                        <label>METAL PURITY</label>
                        <input
                            type="text"
                            value={formData.metal_purity_id || 'Auto-filled from stamp'}
                            readOnly
                            className="product-edit-data-section-form-group-readonly"
                        />
                    </div>
                </div>

                {/* Hidden datalist for batch options */}
                <datalist id="batch-options">
                    {batchOptions.map((option, index) => (
                        <option key={`batch-${index}-${option}`} value={option}>
                            {option}
                        </option>
                    ))}
                </datalist>
            </div>


            {/* Product Options Table */}
            {renderTable(
                'Product Options',
                productOptions,
                ['Size', 'Weight', 'Dimensions', 'Metal Color', 'Gender', 'Occasion', 'Value', 'Sell Price'],
                (option, index, updateFn) => (
                    <>
                        <td><input type="text" value={option.size} onChange={(e) => updateFn(index, 'size', e.target.value)} className="table-input" /></td>
                        <td><input type="text" value={option.weight} onChange={(e) => updateFn(index, 'weight', e.target.value)} className="table-input" /></td>
                        <td><input type="text" value={option.dimensions} onChange={(e) => updateFn(index, 'dimensions', e.target.value)} className="table-input" /></td>
                        <td><input type="text" value={option.metal_color} onChange={(e) => updateFn(index, 'metal_color', e.target.value)} className="table-input" /></td>
                        <td>
                            <button
                                type="button"
                                className="table-select-btn"
                                onClick={() => openGenderPopup(index)}
                            >
                                {option.gender ? option.gender.split(',').map(g => {
                                    const genderMap = { 'male': 'Male', 'female': 'Female', 'woman': 'Woman', 'unisex': 'Unisex', 'kids': 'Kids' };
                                    return genderMap[g.trim()] || g.trim();
                                }).join(', ') : 'Select Gender'}
                            </button>
                        </td>
                        <td>
                            <button
                                type="button"
                                className="table-select-btn"
                                onClick={() => openOccasionPopup(index)}
                            >
                                {option.occasion ? option.occasion.split(',').map(o => {
                                    const occasionMap = {
                                        'wedding': 'Wedding', 'engagement': 'Engagement', 'anniversary': 'Anniversary',
                                        'birthday': 'Birthday', 'festival': 'Festival', 'party': 'Party',
                                        'formal': 'Formal', 'casual': 'Casual', 'daily-wear': 'Daily Wear',
                                        'office': 'Office', 'travel': 'Travel', 'sports': 'Sports'
                                    };
                                    return occasionMap[o.trim()] || o.trim();
                                }).join(', ') : 'Select Occasion'}
                            </button>
                        </td>
                        <td><input type="number" value={option.value} onChange={(e) => updateFn(index, 'value', e.target.value)} step="0.01" className="table-input" /></td>
                        <td><input type="number" value={option.sell_price} onChange={(e) => updateFn(index, 'sell_price', e.target.value)} step="0.01" className="table-input" /></td>
                    </>
                ),
                arrayHandlers.options
            )}


            {/* Save Button */}
            <div className="product-edit-data-section-form-actions">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="product-edit-data-section-save-btn"
                >
                    {saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Save Product Data
                        </>
                    )}
                </button>
            </div>

            {/* Less Weight Popup */}
            <LessWeightPopup
                isOpen={showLessWeightPopup}
                onClose={() => setShowLessWeightPopup(false)}
                lessWeightItems={lessWeightItems}
                setLessWeightItems={setLessWeightItems}
                productId={productId}
                hasLessWeightValue={weightDetails.less_weight && parseFloat(weightDetails.less_weight) > 0}
                onWeightUpdate={(weights) => {
                    // Update the weight details with calculated values
                    setWeightDetails(prev => ({
                        ...prev,
                        less_weight: weights.totalLessWeight,
                        diamond_weight: weights.totalDiamondWeight,
                        stone_weight: weights.totalStoneWeight
                    }));

                    // Update form data as well
                    setFormData(prev => ({
                        ...prev,
                        less_weight: weights.totalLessWeight,
                        diamond_weight: weights.totalDiamondWeight,
                        stone_weight: weights.totalStoneWeight
                    }));
                }}
            />

            {/* Description Popup */}
            <DescriptionPopup
                isOpen={showDescriptionPopup}
                onClose={() => setShowDescriptionPopup(false)}
                description={formData.description}
                onSave={handleDescriptionSave}
                productId={productId}
            />

            {/* Gender Selection Popup */}
            <MultipleSelectionPopup
                isOpen={showGenderPopup}
                onClose={() => setShowGenderPopup(false)}
                onSave={(selectedValues) => handleGenderSelection(currentSelectionContext, selectedValues)}
                title="Select Gender (Multiple)"
                options={genderOptions}
                selectedValues={currentSelectionContext !== null && productOptions[currentSelectionContext] ?
                    (productOptions[currentSelectionContext].gender ?
                        productOptions[currentSelectionContext].gender.split(',').map(g => g.trim()) : []) : []}
                type="gender"
            />

            {/* Occasion Selection Popup */}
            <MultipleSelectionPopup
                isOpen={showOccasionPopup}
                onClose={() => setShowOccasionPopup(false)}
                onSave={(selectedValues) => handleOccasionSelection(currentSelectionContext, selectedValues)}
                title="Select Occasion (Multiple)"
                options={occasionOptions}
                selectedValues={currentSelectionContext !== null && productOptions[currentSelectionContext] ?
                    (productOptions[currentSelectionContext].occasion ?
                        productOptions[currentSelectionContext].occasion.split(',').map(o => o.trim()) : []) : []}
                type="occasion"
            />
        </div>
    );
};

export default ProductDataSection;