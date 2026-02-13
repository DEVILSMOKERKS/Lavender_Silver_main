import React, { useEffect, useState, useContext } from 'react';
import { X, Download } from 'lucide-react';
import axios from 'axios';
import { AdminContext } from '../../../context/AdminContext';
import './ViewProductPopup.css';
import * as XLSX from 'xlsx';

const ViewProductPopup = ({ isOpen, onClose, productId }) => {
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState(null);
    const { token: adminToken } = useContext(AdminContext);
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Helper function to check if a value is empty
    const isEmpty = (value) => {
        return value === null || value === undefined || value === '' || value === 0 || value === '0' || value === 'N/A';
    };

    // Helper function to filter out empty fields
    const filterEmptyFields = (fields) => {
        return fields.filter(field => !isEmpty(field.value));
    };

    // Helper function to format values
    const formatValue = (value, type = 'text') => {
        if (isEmpty(value)) return null;

        switch (type) {
            case 'currency':
                return `₹${value}`;
            case 'weight':
                return `${value}g`;
            case 'carat':
                return `${value}ct`;
            case 'percentage':
                return `${value}%`;
            case 'boolean':
                return value ? 'Yes' : 'No';
            default:
                return value;
        }
    };

    useEffect(() => {
        if (isOpen && productId) {
            fetchProduct();
        }
    }, [isOpen, productId]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            // Only use the full data API for admin
            const response = await axios.get(`${API_BASE_URL}/api/admin/products/${productId}/full`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });


            if (response.data.success) {
                setProduct(response.data.data);

            } else {
                throw new Error(response.data.message || 'Failed to fetch product data');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            alert('Error fetching product data: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = async () => {
        if (!product) return;

        const workbook = XLSX.utils.book_new();

        // Helper function to get first product image URL
        const getFirstImage = () => {
            if (product.product_images && product.product_images.length > 0) {
                return product.product_images[0].image_url;
            }
            if (product.images && product.images.length > 0) {
                // Handle both object and string formats
                const img = product.images[0];
                return typeof img === 'string' ? img : img.image_url || img;
            }
            return null;
        };

        // Helper function to safely get nested values
        const getValue = (obj, path, defaultValue = '') => {
            if (!obj) return defaultValue;
            const keys = path.split('.');
            let current = obj;
            for (const key of keys) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    return defaultValue;
                }
            }
            return current !== null && current !== undefined ? current : defaultValue;
        };

        // Helper function to check if value is meaningful
        const hasValue = (value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string' && value.trim() === '') return false;
            if (typeof value === 'number' && value === 0) return false;
            if (typeof value === 'boolean') return true; // Boolean values are always meaningful
            return true;
        };

        // Define ALL possible fields from database schema - with custom column names and order
        const allFields = [
            // Custom format as requested by user - FIRST COLUMNS
            { key: 'tag_number', label: 'Tgno', path: 'tag_number' },
            { key: 'created_at', label: 'Date', path: 'created_at' },
            { key: 'stamp', label: 'Stamp', path: 'stamp' },
            { key: 'remark', label: 'Remarks', path: 'remark' },
            { key: 'pieces', label: 'Pc', path: 'pieces' },
            { key: 'gross_weight', label: 'Gwt', path: 'gross_weight' },
            { key: 'less_weight', label: 'Lwt', path: 'less_weight' },
            { key: 'net_weight', label: 'Wt', path: 'net_weight' },
            { key: 'stone_weight', label: 'Stnwt', path: 'stone_weight' },
            { key: 'diamond_weight', label: 'Dwt', path: 'diamond_weight' },
            { key: 'certificate_number', label: 'Certif', path: 'certificate_number' },
            { key: 'item_name', label: 'Item Name', path: 'item_name' },
            { key: 'tunch', label: 'Purity', path: 'tunch' },
            { key: 'wastage_percentage', label: 'Wstg', path: 'wastage_percentage' },

            // Rest of the fields - keeping existing order
            { key: 'id', label: 'ID', path: 'id' },
            { key: 'sku', label: 'SKU', path: 'sku' },
            { key: 'slug', label: 'Slug', path: 'slug' },
            { key: 'description', label: 'Description', path: 'description' },
            { key: 'status', label: 'Status', path: 'status' },
            { key: 'batch', label: 'Batch', path: 'batch' },
            { key: 'unit', label: 'Unit', path: 'unit' },
            { key: 'additional_weight', label: 'Add.Wt', path: 'additional_weight' },
            { key: 'rate', label: 'Rate (₹)', path: 'rate' },
            { key: 'labour', label: 'Labour (₹)', path: 'labour' },
            { key: 'labour_on', label: 'Labour Type', path: 'labour_on' },
            { key: 'other', label: 'Other (₹)', path: 'other' },
            { key: 'total_fine_weight', label: 'Total Fine Weight (g)', path: 'total_fine_weight' },
            { key: 'total_rs', label: 'Total Rs (₹)', path: 'total_rs' },
            { key: 'design_type', label: 'Design Type', path: 'design_type' },
            { key: 'manufacturing', label: 'Manufacturing', path: 'manufacturing' },
            { key: 'customizable', label: 'Customizable', path: 'customizable' },
            { key: 'engraving', label: 'Engraving', path: 'engraving' },
            { key: 'hallmark', label: 'Hallmark', path: 'hallmark' },
            { key: 'category_name', label: 'Category Name', path: 'category_name' },
            { key: 'subcategory_name', label: 'Subcategory Name', path: 'subcategory_name' },
            { key: 'sub_subcategory_name', label: 'Sub-Subcategory Name', path: 'sub_subcategory_name' },
            { key: 'metal_type_name', label: 'Metal Type Name', path: 'metal_type_name' },
            { key: 'metal_purity_name', label: 'Metal Purity Name', path: 'metal_purity_name' },

            // Product Options table - ALL columns
            { key: 'option_size', label: 'Option Size', path: 'product_options.0.size' },
            { key: 'option_weight', label: 'Option Weight', path: 'product_options.0.weight' },
            { key: 'option_dimensions', label: 'Option Dimensions', path: 'product_options.0.dimensions' },
            { key: 'option_metal_color', label: 'Option Metal Color', path: 'product_options.0.metal_color' },
            { key: 'option_gender', label: 'Option Gender', path: 'product_options.0.gender' },
            { key: 'option_occasion', label: 'Option Occasion', path: 'product_options.0.occasion' },
            { key: 'option_value', label: 'Option Value (₹)', path: 'product_options.0.value' },
            { key: 'option_sell_price', label: 'Option Sell Price (₹)', path: 'product_options.0.sell_price' },

            // Product Less Weight table - Only specified fields
            { key: 'less_weight_item', label: 'Less Weight Item', path: 'product_less_weight.0.item' },
            { key: 'less_weight_stamp', label: 'Less Weight Stamp', path: 'product_less_weight.0.stamp' },
            { key: 'less_weight_clarity', label: 'Less Weight Clarity', path: 'product_less_weight.0.clarity' },
            { key: 'less_weight_color', label: 'Less Weight Color', path: 'product_less_weight.0.color' },
            { key: 'less_weight_cuts', label: 'Less Weight Cuts', path: 'product_less_weight.0.cuts' },
            { key: 'less_weight_shapes', label: 'Less Weight Shapes', path: 'product_less_weight.0.shapes' },
            { key: 'less_weight_remarks', label: 'Less Weight Remarks', path: 'product_less_weight.0.remarks' },
            { key: 'less_weight_pieces', label: 'Less Weight Pieces', path: 'product_less_weight.0.pieces' },
            { key: 'less_weight_weight', label: 'Less Weight Weight', path: 'product_less_weight.0.weight' },
            { key: 'less_weight_units', label: 'Less Weight Units', path: 'product_less_weight.0.units' },
            { key: 'less_weight_tunch', label: 'Less Weight Purity', path: 'product_less_weight.0.tunch' },
            { key: 'less_weight_purchase_rate', label: 'Less Weight Purchase Rate (₹/unit)', path: 'product_less_weight.0.purchase_rate' },
            { key: 'less_weight_sale_rate', label: 'Less Weight Sale Rate (₹/unit)', path: 'product_less_weight.0.sale_rate' },
            { key: 'less_weight_total_profit', label: 'Less Weight Total Profit', path: 'product_less_weight.0.total_profit' },
            { key: 'less_weight_purchase_value', label: 'Less Weight Purchase Value', path: 'product_less_weight.0.purchase_value' },
            { key: 'less_weight_sale_value', label: 'Less Weight Sale Value', path: 'product_less_weight.0.sale_value' },

            // Media files - show image path for actual image display
            { key: 'first_image_url', label: 'First Image', path: 'first_image_url' },
            { key: 'first_video_url', label: 'First Video', path: 'first_video_url' },
            { key: 'first_certificate_url', label: 'First Certificate', path: 'first_certificate_url' }
        ];

        // Include ALL fields - even empty ones as requested
        const allFieldsToExport = allFields;

        // Create headers and data arrays with ALL fields
        const headers = allFieldsToExport.map(field => field.label);
        const dataRow = allFieldsToExport.map(field => {
            // Media fields are handled separately with special cell formatting
            if (field.key === 'first_image' || field.key === 'first_image_url') {
                return ''; // Will be filled by addMediaToCell function
            }
            if (field.key === 'first_video_url') {
                return ''; // Will be filled by addMediaToCell function
            }
            if (field.key === 'first_certificate_url') {
                return ''; // Will be filled by addMediaToCell function
            }
            // Format date fields as DD/MM/YYYY
            if (field.key === 'created_at') {
                const dateValue = getValue(product, field.path);
                if (dateValue) {
                    const date = new Date(dateValue);
                    if (!isNaN(date.getTime())) {
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    }
                }
                return '';
            }
            // Remove dummy calculations - only use actual backend data

            const value = getValue(product, field.path);

            // Format boolean values
            if (field.key === 'customizable' || field.key === 'engraving' || field.key === 'hallmark' ||
                field.key === 'image_is_thumbnail' || field.key === 'section_is_active') {
                return value ? 'Yes' : 'No';
            }

            // Return empty string for null/undefined values instead of null
            return value !== null && value !== undefined ? value : '';
        });

        // Create main sheet with ALL data (including empty columns)
        const productData = [headers, dataRow];
        const productWorksheet = XLSX.utils.aoa_to_sheet(productData);

        // Add embedded media files to Excel cells
        const firstImage = product.product_images && product.product_images.length > 0 ? product.product_images[0] : null;
        const firstVideo = product.product_videos && product.product_videos.length > 0 ? product.product_videos[0] : null;
        const firstCert = product.product_certificates && product.product_certificates.length > 0 ? product.product_certificates[0] : null;


        // Function to add media files to Excel cells with hyperlinks
        const addMediaToCell = (mediaUrl, cellAddress, mediaType) => {
            try {
                if (!productWorksheet[cellAddress]) productWorksheet[cellAddress] = { t: 's' };

                // Create a clickable hyperlink with descriptive text
                const fullUrl = `${API_BASE_URL}${mediaUrl}`;
                const fileName = mediaUrl.split('/').pop() || `${mediaType}_file`;

                // Set cell value with descriptive text
                productWorksheet[cellAddress].v = `🔗 ${mediaType}: ${fileName}`;

                // Add hyperlink to the cell
                productWorksheet[cellAddress].l = { Target: fullUrl };

                // Add comment with full URL for reference
                productWorksheet[cellAddress].c = [{
                    a: "System",
                    t: `Full URL: ${fullUrl}`
                }];

            } catch (error) {
                console.error(`Error adding ${mediaType} to cell:`, error);
                // Fallback to simple URL
                if (!productWorksheet[cellAddress]) productWorksheet[cellAddress] = { t: 's' };
                productWorksheet[cellAddress].v = `${API_BASE_URL}${mediaUrl}`;
            }
        };

        // Add first image to Excel cell
        if (firstImage) {
            const imageColumnIndex = headers.findIndex(header => header === 'First Image');
            if (imageColumnIndex !== -1) {
                const cellAddress = XLSX.utils.encode_cell({ r: 1, c: imageColumnIndex });
                addMediaToCell(firstImage.image_url, cellAddress, 'Image');
            }
        }

        // Add first video to Excel cell
        if (firstVideo) {
            const videoColumnIndex = headers.findIndex(header => header === 'First Video');
            if (videoColumnIndex !== -1) {
                const cellAddress = XLSX.utils.encode_cell({ r: 1, c: videoColumnIndex });
                addMediaToCell(firstVideo.video_url, cellAddress, 'Video');
            }
        }

        // Add first certificate to Excel cell
        if (firstCert) {
            const certColumnIndex = headers.findIndex(header => header === 'First Certificate');
            if (certColumnIndex !== -1) {
                const cellAddress = XLSX.utils.encode_cell({ r: 1, c: certColumnIndex });
                addMediaToCell(firstCert.certificate_url, cellAddress, 'Certificate');
            }
        }

        // Set column widths for better readability
        const columnWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
        productWorksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, productWorksheet, 'Complete Product Data');

        // Add other sheets for related data (only if data exists)
        // Product Options sheet
        if (product.product_options && product.product_options.length > 0) {
            const optionsData = [
                ['Size', 'Weight', 'Dimensions', 'Metal Color', 'Gender', 'Occasion', 'Value (₹)', 'Sell Price (₹)'],
                ...product.product_options.map(opt => [
                    getValue(opt, 'size') || '',
                    getValue(opt, 'weight') || '',
                    getValue(opt, 'dimensions') || '',
                    getValue(opt, 'metal_color') || '',
                    getValue(opt, 'gender') || '',
                    getValue(opt, 'occasion') || '',
                    getValue(opt, 'value') || '',
                    getValue(opt, 'sell_price') || ''
                ])
            ];
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(optionsData), 'Product Options');
        }

        // Less Weight Items sheet - show if Lwt has value OR if less weight items exist
        const hasLessWeightValue = parseFloat(getValue(product, 'less_weight', 0)) > 0;
        if ((product.product_less_weight && product.product_less_weight.length > 0) || hasLessWeightValue) {
            let lessWeightData = [
                ['Item', 'Stamp', 'Clarity', 'Color', 'Cuts', 'Shapes', 'Remarks', 'Pieces', 'Weight', 'Units', 'Purity', 'Purchase Rate (₹/unit)', 'Purchase Value (₹)', 'Sale Rate (₹)', 'Total Profit (₹)', 'Sale Value (₹)']
            ];

            // If less weight items exist, use them
            if (product.product_less_weight && product.product_less_weight.length > 0) {
                lessWeightData = [
                    ...lessWeightData,
                    ...product.product_less_weight.map(item => [
                        getValue(item, 'item') || '',
                        getValue(item, 'stamp') || '',
                        getValue(item, 'clarity') || '',
                        getValue(item, 'color') || '',
                        getValue(item, 'cuts') || '',
                        getValue(item, 'shapes') || '',
                        getValue(item, 'remarks') || '',
                        getValue(item, 'pieces') || '',
                        getValue(item, 'weight') || '',
                        getValue(item, 'units') || '',
                        getValue(item, 'tunch') || '',
                        getValue(item, 'purchase_rate') || '',
                        getValue(item, 'purchase_value') || '',
                        getValue(item, 'sale_rate') || '',
                        getValue(item, 'total_profit') || '',
                        getValue(item, 'sale_value') || ''
                    ])
                ];
            } else if (hasLessWeightValue) {
                // If no less weight items but Lwt has value, show a summary row
                lessWeightData.push([
                    'Less Weight Summary', // Item
                    '', // Stamp
                    '', // Clarity
                    '', // Color
                    '', // Cuts
                    '', // Shapes
                    'Total Less Weight', // Remarks
                    '', // Pieces
                    getValue(product, 'less_weight', 0), // Weight
                    'g', // Units
                    '', // Tunch
                    '', // Purchase Rate
                    '', // Purchase Value
                    '', // Sale Rate
                    '', // Total Profit
                    '' // Sale Value
                ]);
            }

            XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(lessWeightData), 'Less Weight Items');
        }

        const fileName = `Product_${getValue(product, 'item_name', 'Export')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="view-product-popup-overlay">
                <div className="view-product-popup">
                    <div className="view-loading">Loading...</div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="view-product-popup-overlay">
                <div className="view-product-popup">
                    <div className="view-error">Product not found</div>
                </div>
            </div>
        );
    }

    const renderField = (label, value) => {
        if (isEmpty(value)) return null;
        return (
            <div className="view-field-row">
                <div className="view-field-label">{label}</div>
                <div className="view-field-value">{value}</div>
            </div>
        );
    };

    const renderSection = (title, fields) => {
        const filteredFields = fields.filter(field => !isEmpty(field.value));
        if (filteredFields.length === 0) return null;

        return (
            <div className="view-section">
                <h3 className="view-section-title">{title}</h3>
                <div className="view-section-content">
                    {filteredFields.map((field, index) => (
                        <div key={index} className="view-field-row">
                            <div className="view-field-label">{field.label}</div>
                            <div className="view-field-value">{field.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTable = (title, data, columns) => {
        if (!data || data.length === 0) return null;

        return (
            <div className="view-section">
                <h3 className="view-section-title">{title}</h3>
                <div className="view-table-container">
                    <table className="view-table">
                        <thead>
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex}>
                                            {col.format ? col.format(row[col.key]) : (row[col.key] || 'N/A')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="view-product-popup-overlay">
            <div className="view-product-popup">
                {/* Header */}
                <div className="view-product-header">
                    <h2 className="view-product-title">View Product</h2>
                    <div className="view-product-actions">
                        <button className="export-btn" onClick={exportToExcel}>
                            <Download size={16} />
                            Export to Excel
                        </button>
                        <button className="view-product-close-btn" onClick={handleClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content with vertical scroll */}
                <div className="view-product-content">
                    {/* Media Section - At the top */}
                    {(product.images && product.images.length > 0) || (product.product_videos && product.product_videos.length > 0) ? (
                        <div className="view-section">
                            <h3 className="view-section-title">Media</h3>
                            <div className="view-section-content">
                                {/* Images */}
                                {product.images && product.images.length > 0 && (
                                    <div className="view-media-section">
                                        <h4>Images ({product.images.length})</h4>
                                        <div className="view-media-grid">
                                            {product.images.map((img, index) => (
                                                <div key={index} className="view-media-item">
                                                    <img
                                                        src={`${API_BASE_URL}${img.image_url}`}
                                                        alt={product.item_name}
                                                        className="view-media-image"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Videos */}
                                {product.product_videos && product.product_videos.length > 0 && (
                                    <div className="view-media-section">
                                        <h4>Videos ({product.product_videos.length})</h4>
                                        <div className="view-media-grid">
                                            {product.product_videos.map((video, index) => (
                                                <div key={index} className="view-media-item">
                                                    <video
                                                        src={`${API_BASE_URL}${video.video_url}`}
                                                        className="view-media-video"
                                                        controls
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* Product Information in Row Format - Matching AddProduct Preview Structure */}
                    <div className="view-info-grid">
                        {/* Basic Information */}
                        <div className="view-info-column">
                            <h4 className="view-section-title">Basic Information</h4>
                            <div className="view-info-table">
                                {[
                                    { label: 'Tag Number', value: product.tag_number },
                                    { label: 'Batch', value: product.batch },
                                    { label: 'Item Name', value: product.item_name },
                                    { label: 'Stamp', value: product.stamp },
                                    { label: 'Remark', value: product.remark },
                                    { label: 'Category', value: product.categories?.name || product.category_name },
                                    { label: 'Subcategory', value: product.subcategories?.name || product.subcategory_name },
                                    { label: 'Sub-Subcategory', value: product.sub_subcategories?.name || product.sub_subcategory_name },
                                    { label: 'Metal Type', value: product.metal_type_name },
                                    { label: 'Metal Purity', value: product.metal_purity_name },
                                    { label: 'SKU', value: product.sku },
                                    { label: 'Status', value: product.status },
                                    { label: 'Description', value: product.description }
                                ].map((field, index) => !isEmpty(field.value) && (
                                    <div key={index} className="view-info-row">
                                        <div className="view-info-label">{field.label}:</div>
                                        <div className="view-info-value">{field.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weight Information */}
                        <div className="view-info-column">
                            <h4 className="view-section-title">Weight Information</h4>
                            <div className="view-info-table">
                                {[
                                    { label: 'Unit', value: product.unit },
                                    { label: 'Pieces', value: product.pieces },
                                    { label: 'Gross Weight', value: formatValue(product.gross_weight, 'weight') },
                                    { label: 'Less Weight', value: formatValue(product.less_weight, 'weight') },
                                    { label: 'Net Weight', value: formatValue(product.net_weight, 'weight') },
                                    { label: 'Additional Weight', value: formatValue(product.additional_weight, 'weight') },
                                    { label: 'Total Fine Weight', value: formatValue(product.total_fine_weight, 'weight') }
                                ].map((field, index) => !isEmpty(field.value) && (
                                    <div key={index} className="view-info-row">
                                        <div className="view-info-label">{field.label}:</div>
                                        <div className="view-info-value">{field.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pricing Information */}
                        <div className="view-info-column">
                            <h4 className="view-section-title">Pricing Information</h4>
                            <div className="view-info-table">
                                {[
                                    { label: 'Rate (₹/gram)', value: formatValue(product.rate, 'currency') },
                                    { label: 'Diamond Weight', value: product.diamond_weight ? `${product.diamond_weight} carats` : null },
                                    { label: 'Stone Weight', value: product.stone_weight ? `${product.stone_weight} carats` : null },
                                    { label: 'Labour', value: formatValue(product.labour, 'currency') },
                                    {
                                        label: 'Labour Type',
                                        value: product.labour_on ? (() => {
                                            const typeMap = { 'Wt': 'Weight', 'Fl': 'Flat', 'Pc': 'Percentage' };
                                            return typeMap[product.labour_on] || product.labour_on;
                                        })() : 'Not Set',
                                        showAlways: true // Always show labour type even if empty
                                    },
                                    { label: 'Other', value: formatValue(product.other, 'currency') },
                                    { label: 'Total Rs', value: formatValue(product.total_rs, 'currency'), isTotal: true }
                                ].map((field, index) => (field.showAlways || !isEmpty(field.value)) && (
                                    <div key={index} className={`view-info-row ${field.isTotal ? 'total-highlight' : ''}`}>
                                        <div className="view-info-label">{field.label}:</div>
                                        <div className="view-info-value">{field.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="view-info-column">
                            <h4 className="view-section-title">Additional Information</h4>
                            <div className="view-info-table">
                                {[
                                    { label: 'Purity', value: product.tunch },
                                    { label: 'Wastage', value: formatValue(product.wastage_percentage, 'percentage') },
                                    { label: 'Design Type', value: product.design_type },
                                    { label: 'Manufacturing', value: product.manufacturing },
                                    { label: 'Customizable', value: formatValue(product.customizable, 'boolean') },
                                    { label: 'Engraving', value: formatValue(product.engraving, 'boolean') },
                                    { label: 'Hallmark', value: formatValue(product.hallmark, 'boolean') },
                                    { label: 'Certificate #', value: product.certificate_number }
                                ].map((field, index) => !isEmpty(field.value) && (
                                    <div key={index} className="view-info-row">
                                        <div className="view-info-label">{field.label}:</div>
                                        <div className="view-info-value">{field.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>



                    {/* Product Options */}
                    {product.product_options && product.product_options.length > 0 ? (
                        renderTable('Product Options', product.product_options, [
                            { key: 'size', label: 'Size' },
                            { key: 'weight', label: 'Weight' },
                            { key: 'dimensions', label: 'Dimensions' },
                            { key: 'metal_color', label: 'Metal Color' },
                            { key: 'gender', label: 'Gender' },
                            { key: 'occasion', label: 'Occasion' },
                            { key: 'value', label: 'Value', format: (val) => val ? `₹${val}` : 'N/A' },
                            { key: 'sell_price', label: 'Sell Price', format: (val) => val ? `₹${val}` : 'N/A' }
                        ])
                    ) : (
                        <div className="view-section">
                            <h3 className="view-section-title">Product Options</h3>
                            <div className="view-empty-state">No product options available</div>
                        </div>
                    )}

                    {/* Less Weight Items */}
                    {(product.product_less_weight && product.product_less_weight.length > 0) || parseFloat(product.less_weight) > 0 ? (
                        product.product_less_weight && product.product_less_weight.length > 0 ? (
                            renderTable('Less Weight Items', product.product_less_weight, [
                                { key: 'item', label: 'Item' },
                                { key: 'stamp', label: 'Stamp' },
                                { key: 'clarity', label: 'Clarity' },
                                { key: 'color', label: 'Color' },
                                { key: 'cuts', label: 'Cuts' },
                                { key: 'shapes', label: 'Shapes' },
                                { key: 'remarks', label: 'Remarks' },
                                { key: 'pieces', label: 'Pieces' },
                                { key: 'weight', label: 'Weight' },
                                { key: 'units', label: 'Units' },
                                { key: 'tunch', label: 'Purity' },
                                { key: 'purchase_rate', label: 'Purchase Rate', format: (val) => val ? `₹${val}` : 'N/A' },
                                { key: 'sale_rate', label: 'Sale Rate', format: (val) => val ? `₹${val}` : 'N/A' },
                                { key: 'total_profit', label: 'Total Profit', format: (val) => val ? `₹${val}` : 'N/A' },
                                { key: 'purchase_value', label: 'Purchase Value', format: (val) => val ? `₹${val}` : 'N/A' },
                                { key: 'sale_value', label: 'Sale Value', format: (val) => val ? `₹${val}` : 'N/A' }
                            ])
                        ) : (
                            <div className="view-section">
                                <h3 className="view-section-title">Less Weight Items</h3>
                                <div className="view-info-table">
                                    <div className="view-info-row">
                                        <div className="view-info-label">Total Less Weight:</div>
                                        <div className="view-info-value">{formatValue(product.less_weight, 'weight')}</div>
                                    </div>
                                    <div className="view-info-row">
                                        <div className="view-info-label">Stone Weight:</div>
                                        <div className="view-info-value">{formatValue(product.stone_weight, 'weight')}</div>
                                    </div>
                                    <div className="view-info-row">
                                        <div className="view-info-label">Diamond Weight:</div>
                                        <div className="view-info-value">{formatValue(product.diamond_weight, 'weight')}</div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="view-section">
                            <h3 className="view-section-title">Less Weight Items</h3>
                            <div className="view-empty-state">No less weight items available</div>
                        </div>
                    )}

                    {/* Product Certificates */}
                    {product.product_certificates && product.product_certificates.length > 0 ? (
                        renderTable('Product Certificates', product.product_certificates, [
                            { key: 'certificate_name', label: 'Certificate Name' },
                            { key: 'original_name', label: 'Original Name' },
                            { key: 'file_size', label: 'File Size', format: (val) => val ? `${(val / 1024).toFixed(2)} KB` : 'N/A' },
                            { key: 'mime_type', label: 'MIME Type' },
                            { key: 'sort_order', label: 'Sort Order' },
                            {
                                key: 'certificate_url', label: 'Certificate', format: (val) => val ? (
                                    <a href={`${API_BASE_URL}${val}`} target="_blank" rel="noopener noreferrer" className="view-link">
                                        📄 View Certificate
                                    </a>
                                ) : 'N/A'
                            }
                        ])
                    ) : (
                        <div className="view-section">
                            <h3 className="view-section-title">Product Certificates</h3>
                            <div className="view-empty-state">No certificates available</div>
                        </div>
                    )}

                    {/* Product Videos */}
                    {product.product_videos && product.product_videos.length > 0 ? (
                        renderTable('Product Videos', product.product_videos, [
                            { key: 'video_name', label: 'Video Name' },
                            { key: 'original_name', label: 'Original Name' },
                            { key: 'file_size', label: 'File Size', format: (val) => val ? `${(val / (1024 * 1024)).toFixed(2)} MB` : 'N/A' },
                            { key: 'mime_type', label: 'MIME Type' },
                            { key: 'duration', label: 'Duration', format: (val) => val ? `${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}` : 'N/A' },
                            { key: 'sort_order', label: 'Sort Order' },
                            {
                                key: 'video_url', label: 'Video', format: (val) => val ? (
                                    <a href={`${API_BASE_URL}${val}`} target="_blank" rel="noopener noreferrer" className="view-link">
                                        🎥 View Video
                                    </a>
                                ) : 'N/A'
                            }
                        ])
                    ) : (
                        <div className="view-section">
                            <h3 className="view-section-title">Product Videos</h3>
                            <div className="view-empty-state">No videos available</div>
                        </div>
                    )}

                    {/* Product Features */}
                    {product.product_features && product.product_features.length > 0 ? (
                        <div className="view-section">
                            <h3 className="view-section-title">Product Features</h3>
                            <div className="view-features-content">
                                {product.product_features.map((feature, index) => (
                                    <div key={index} className="view-feature-item">
                                        <div className="view-feature-points">
                                            {feature.feature_points ? feature.feature_points.split(',').map((point, pointIndex) => (
                                                <div key={pointIndex} className="view-feature-point">
                                                    • {point.trim()}
                                                </div>
                                            )) : 'No feature points available'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="view-section">
                            <h3 className="view-section-title">Product Features</h3>
                            <div className="view-empty-state">No product features available</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewProductPopup; 