import React, { useState } from 'react';
import './BulkAddProducts.css';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const BulkAddProducts = ({ isOpen, onClose, onBulkAdd, mode = 'add' }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [validationResults, setValidationResults] = useState(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [existingTagNumbers, setExistingTagNumbers] = useState(new Set());
    const [tagCheckLoading, setTagCheckLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Function to check existing tag numbers
    const checkExistingTagNumbers = async (data) => {
        if (!data || data.length === 0) return new Set();

        setTagCheckLoading(true);
        try {
            // Extract unique tag numbers from the data
            const tagNumbers = [...new Set(
                data
                    .map(row => row['Tgno'])
                    .filter(tagNumber => tagNumber && tagNumber.toString().trim() !== '')
            )];

            if (tagNumbers.length === 0) return new Set();

            // Check which tag numbers exist in the database
            const response = await axios.post(`${API_BASE_URL}/api/products/check-tag-numbers`, {
                tagNumbers: tagNumbers
            });

            return new Set(response.data.existingTagNumbers || []);
        } catch (error) {
            console.error('Error checking tag numbers:', error);
            return new Set();
        } finally {
            setTagCheckLoading(false);
        }
    };

    // Function to determine operation type and counts
    const getOperationInfo = () => {
        if (!previewData || existingTagNumbers.size === 0) {
            return {
                totalRows: previewData ? previewData.length : 0,
                newProducts: previewData ? previewData.length : 0,
                updateProducts: 0,
                operationType: 'create',
                buttonText: 'Upload Products'
            };
        }

        let newProducts = 0;
        let updateProducts = 0;

        previewData.forEach(row => {
            const tagNumber = row['Tgno']?.toString().trim();
            if (tagNumber) {
                if (existingTagNumbers.has(tagNumber)) {
                    updateProducts++;
                } else {
                    newProducts++;
                }
            }
        });

        const totalRows = newProducts + updateProducts;

        if (newProducts === 0 && updateProducts > 0) {
            return {
                totalRows,
                newProducts: 0,
                updateProducts,
                operationType: 'update',
                buttonText: 'Update Products'
            };
        } else if (newProducts > 0 && updateProducts === 0) {
            return {
                totalRows,
                newProducts,
                updateProducts: 0,
                operationType: 'create',
                buttonText: 'Upload Products'
            };
        } else {
            return {
                totalRows,
                newProducts,
                updateProducts,
                operationType: 'mixed',
                buttonText: 'Upload & Update Products'
            };
        }
    };

    // Expected Excel column headers (must match exactly) - Custom format as requested
    const expectedHeaders = [
        // Custom format as requested by user - FIRST COLUMNS
        'Tgno', 'Date', 'Stamp', 'Remarks', 'Pc', 'Gwt', 'Lwt', 'Wt', 'Stnwt', 'Dwt', 'Certif', 'Item Name', 'Purity', 'Wstg',
        // Rest of the fields - matching current export format
        'ID', 'SKU', 'Slug', 'Description', 'Status', 'Batch', 'Unit', 'Add.Wt', 'Rate (₹)',
        'Labour (₹)', 'Labour On', 'Other (₹)', 'Total Fine Weight (g)', 'Total Rs (₹)', 'Design Type',
        'Manufacturing', 'Customizable', 'Engraving', 'Hallmark', 'Product Features', 'Category Name', 'Subcategory Name', 'Sub-Subcategory Name',
        'Metal Type Name', 'Metal Purity Name', 'First Image', 'First Video', 'First Certificate',
        // Product Options fields (from export)
        'Option Size', 'Option Weight', 'Option Dimensions', 'Option Metal Color', 'Option Gender', 'Option Occasion', 'Option Value (₹)', 'Option Sell Price (₹)',
        // Less Weight fields (Only specified fields)  
        'Less Weight Item', 'Less Weight Stamp', 'Less Weight Clarity', 'Less Weight Color', 'Less Weight Cuts', 'Less Weight Shapes', 'Less Weight Remarks', 'Less Weight Pieces', 'Less Weight Weight', 'Less Weight Units', 'Less Weight Purity', 'Less Weight Purchase Rate (₹/unit)', 'Less Weight Sale Rate (₹/unit)', 'Less Weight Total Profit', 'Less Weight Purchase Value', 'Less Weight Sale Value'
    ];


    const validateData = (data) => {
        const errors = [];
        const warnings = [];
        const validRows = [];

        // Check headers (case-insensitive)
        const fileHeaders = Object.keys(data[0] || {}).map(h => h.toLowerCase());

        // Auto-detect if this is an update operation based on data content
        // If data contains tag numbers, treat as update operation
        const hasTagNumbers = data.some(row => row['Tgno'] && row['Tgno'].toString().trim() !== '');
        const isUpdateOperation = mode === 'update' || hasTagNumbers;

        // Define which columns are required vs optional
        // Tag Number (Tgno) is NOT required - will be auto-generated if empty
        const requiredHeaders = [];

        // For new products (add mode), more columns are required
        const additionalRequiredForNew = [
            'Item Name', 'SKU', 'Category Name', 'Stamp'
        ];

        // For update operations, make most fields required (except images, certificates, and auto-calculated fields)
        // Net Weight (Wt), Stone Weight (Stnwt), Diamond Weight (Dwt), Additional Weight (Add.Wt), Total Fine Weight, Total Rs are auto-calculated
        const requiredForUpdates = [
            'Date', 'Stamp', 'Remarks', 'Item Name', 'SKU', 'Description', 'Status', 'Batch', 'Unit', 'Pc',
            'Gwt', 'Lwt', 'Certif', 'Purity', 'Wstg',
            'Rate (₹)', 'Labour (₹)', 'Labour On', 'Other (₹)',
            'Design Type', 'Manufacturing', 'Customizable', 'Engraving',
            'Hallmark', 'Category Name', 'Subcategory Name', 'Sub-Subcategory Name'
        ];

        // Product Features is optional for both new and existing products

        // Combine required headers based on operation type
        const allRequiredHeaders = isUpdateOperation
            ? requiredForUpdates
            : [...requiredHeaders, ...additionalRequiredForNew];

        const missingRequiredHeaders = allRequiredHeaders.filter(header => !fileHeaders.includes(header.toLowerCase()));

        if (missingRequiredHeaders.length > 0) {
            errors.push(`Missing required columns: ${missingRequiredHeaders.join(', ')}`);
            return { errors, warnings, validRows, totalRows: data.length };
        }

        data.forEach((row, index) => {
            const rowErrors = [];
            const rowWarnings = [];

            // Tag Number (Tgno) is NOT required - will be auto-generated if empty
            // No validation needed here

            // For new products (mode = 'add'), name and SKU are required
            // For updates (mode = 'update' or mixed), more fields are required
            if (!isUpdateOperation) {
                // Check for Item Name (new field name)
                if (!row['Item Name'] || row['Item Name'].toString().trim() === '') {
                    rowErrors.push('Item Name is required for new products');
                }

                if (!row['SKU'] || row['SKU'].toString().trim() === '') {
                    rowErrors.push('SKU is required for new products');
                }

                // Check for Category Name (new field name)
                if (!row['Category Name'] || row['Category Name'].toString().trim() === '') {
                    rowErrors.push('Category Name is required for new products');
                }

                // Check for Stamp (required for new products)
                if (!row['Stamp'] || row['Stamp'].toString().trim() === '') {
                    rowErrors.push('Stamp is required for new products');
                }
            } else {
                // For update operations, validate required fields (excluding images, certificates, and auto-calculated fields)
                // Net Weight (Wt), Stone Weight (Stnwt), Diamond Weight (Dwt), Additional Weight (Add.Wt) are auto-calculated
                const requiredUpdateFields = [
                    { field: 'Date', name: 'Date' },
                    { field: 'Stamp', name: 'Stamp' },
                    { field: 'Remarks', name: 'Remarks' },
                    { field: 'Item Name', name: 'Item Name' },
                    { field: 'SKU', name: 'SKU' },
                    { field: 'Description', name: 'Description' },
                    { field: 'Status', name: 'Status' },
                    { field: 'Batch', name: 'Batch' },
                    { field: 'Unit', name: 'Unit' },
                    { field: 'Pc', name: 'Pieces' },
                    { field: 'Gwt', name: 'Gross Weight' },
                    { field: 'Lwt', name: 'Less Weight' },
                    // Wt (Net Weight) - Auto-calculated, not required
                    // Stnwt (Stone Weight) - Auto-calculated from less weight, not required
                    // Dwt (Diamond Weight) - Auto-calculated from less weight, not required
                    { field: 'Certif', name: 'Certificate Number' },
                    { field: 'Tunch', name: 'Purity' },
                    { field: 'Wstg', name: 'Wastage' },
                    // Add.Wt (Additional Weight) - Auto-calculated, not required
                    { field: 'Rate (₹)', name: 'Rate' },
                    { field: 'Labour (₹)', name: 'Labour' },
                    { field: 'Labour On', name: 'Labour On' },
                    { field: 'Other (₹)', name: 'Other' },
                    // Total Fine Weight (g) - Auto-calculated, not required
                    // Total Rs (₹) - Auto-calculated, not required
                    { field: 'Design Type', name: 'Design Type' },
                    { field: 'Manufacturing', name: 'Manufacturing' },
                    { field: 'Customizable', name: 'Customizable' },
                    { field: 'Engraving', name: 'Engraving' },
                    { field: 'Hallmark', name: 'Hallmark' },
                    { field: 'Category Name', name: 'Category Name' }
                ];

                requiredUpdateFields.forEach(({ field, name }) => {
                    if (!row[field] || row[field].toString().trim() === '') {
                        rowErrors.push(`${name} is required for updates`);
                    }
                });
            }

            // Numeric validation
            const numericFields = [
                'Pc', 'Gwt', 'Lwt', 'Wt', 'Stnwt', 'Dwt', 'Purity', 'Wstg', 'Rate (₹)',
                'Add.Wt', 'Labour (₹)', 'Other (₹)', 'Total Fine Weight (g)', 'Total Rs (₹)'
            ];

            numericFields.forEach(field => {
                const value = row[field];
                if (value !== undefined && value !== null && value !== '' && isNaN(Number(value))) {
                    rowErrors.push(`${field} must be a valid number`);
                }
            });

            // Status validation
            if (row['Status'] && !['active', 'inactive'].includes(row['Status'].toString().toLowerCase())) {
                rowErrors.push('Status must be "active" or "inactive"');
            }

            // Boolean field validation
            const booleanFields = ['Customizable', 'Engraving Option', 'Hallmark'];
            booleanFields.forEach(field => {
                const value = row[field];
                if (value && !['yes', 'no', 'true', 'false', '1', '0'].includes(value.toString().toLowerCase())) {
                    rowWarnings.push(`${field} should be "Yes" or "No"`);
                }
            });

            // Validate less weight items - if less weight data exists, purchase_rate and sale_rate are required
            if (row['Less Weight Item'] || row['Less Weight Weight']) {
                if (!row['Less Weight Purchase Rate (₹/unit)'] || row['Less Weight Purchase Rate (₹/unit)'].toString().trim() === '') {
                    rowErrors.push('Less Weight Purchase Rate (₹/unit) is required when less weight items are provided');
                }
                if (!row['Less Weight Sale Rate (₹/unit)'] || row['Less Weight Sale Rate (₹/unit)'].toString().trim() === '') {
                    rowErrors.push('Less Weight Sale Rate (₹/unit) is required when less weight items are provided');
                }
            }

            // Business logic validation
            const grossWeight = parseFloat(row['Gross Weight (g)']) || 0;
            const lessWeight = parseFloat(row['Less Weight (g)']) || 0;
            const netWeight = parseFloat(row['Net Weight (g)']) || 0;

            if (grossWeight > 0 && lessWeight > 0 && netWeight !== (grossWeight - lessWeight)) {
                rowWarnings.push('Net Weight should equal Gross Weight minus Less Weight');
            }

            if (rowErrors.length === 0) {
                validRows.push({
                    ...row,
                    rowIndex: index + 1,
                    warnings: rowWarnings
                });
            } else {
                errors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
            }

            if (rowWarnings.length > 0) {
                warnings.push(`Row ${index + 2}: ${rowWarnings.join(', ')}`);
            }
        });

        return {
            errors,
            warnings,
            validRows,
            totalRows: data.length,
            validCount: validRows.length
        };
    };

    const processFile = async (file) => {
        try {
            setError(null);
            setValidationResults(null);

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                    if (jsonData.length === 0) {
                        setError('Excel file is empty. Please add product data.');
                        return;
                    }

                    setPreviewData(jsonData);

                    // Validate data
                    const validation = validateData(jsonData);
                    setValidationResults(validation);

                    // Check existing tag numbers if validation passed
                    if (validation.errors.length === 0 && validation.validRows.length > 0) {
                        const existingTags = await checkExistingTagNumbers(jsonData);
                        setExistingTagNumbers(existingTags);
                    }

                } catch (parseError) {
                    console.error('Parse error:', parseError);
                    setError('Error reading Excel file. Please check the file format.');
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Process file error:', error);
            setError('Error processing file. Please check the file format.');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (!file.name.match(/\.(xlsx|xls)$/)) {
                setError('Please upload only Excel files (.xlsx or .xls)');
                return;
            }
            setSelectedFile(file);
            await processFile(file);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/)) {
            setError('Please upload only Excel files (.xlsx or .xls)');
            return;
        }
        setSelectedFile(file);
        await processFile(file);
    };

    const handleSubmit = async () => {
        if (!validationResults || validationResults.validRows.length === 0) {
            setError('No valid rows to upload');
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);

            // Prepare products data for bulk upload (handles both create and update)
            const productsData = validationResults.validRows.map(row => ({
                // Tag Number is required for both create and update (determines operation)
                tag_number: row['Tgno']?.toString().trim(),

                // Basic Information (optional for updates, required for new products)
                name: row['Item Name']?.toString().trim(),
                sku: row['SKU']?.toString().trim(),
                status: row['Status']?.toString().toLowerCase() || 'active',
                description: row['Description']?.toString().trim() || '',

                // Category Information (will be resolved to IDs on backend)
                category_name: row['Category Name']?.toString().trim(),
                subcategory_name: row['Subcategory Name']?.toString().trim(),
                sub_subcategory_name: row['Sub-Subcategory Name']?.toString().trim(),

                // Product Entry Data (using custom column names)
                batch: row['Batch']?.toString().trim() || '',
                item_name: row['Item Name']?.toString().trim(),
                stamp: row['Stamp']?.toString().trim() || '',
                remark: row['Remarks']?.toString().trim() || '',
                unit: row['Unit']?.toString().trim() || 'Piece',
                pieces: parseInt(row['Pc']) || 1,

                // Weight Information (using custom column names)
                gross_weight: parseFloat(row['Gwt']) || 0,
                less_weight: parseFloat(row['Lwt']) || 0,
                net_weight: parseFloat(row['Wt']) || 0,
                additional_weight: parseFloat(row['Add.Wt']) || 0,

                // Pricing and Calculations (using custom column names)
                tunch: parseFloat(row['Purity']) || 100,
                wastage_percentage: parseFloat(row['Wstg']) || 0,
                rate: parseFloat(row['Rate (₹)']) || 0,
                diamond_weight: parseFloat(row['Dwt']) || 0,
                stone_weight: parseFloat(row['Stnwt']) || 0,

                // Labour Information
                labour: parseFloat(row['Labour (₹)']) || 0,
                labour_on: (() => {
                    const labourOn = row['Labour On']?.toString().trim() || '';
                    // Validate labour_on: must be Wt, Pc, Fl, or empty
                    if (labourOn && !['Wt', 'Pc', 'Fl'].includes(labourOn)) {
                        console.warn(`Invalid Labour On value "${labourOn}" in row ${rowIndex + 1}. Using default "Wt".`);
                        return 'Wt'; // Default to Weight if invalid
                    }
                    return labourOn || 'Wt'; // Default to Wt if empty
                })(),

                // Other charges
                other: parseFloat(row['Other (₹)']) || 0,

                // Calculated fields
                total_fine_weight: parseFloat(row['Total Fine Weight (g)']) || 0,
                total_rs: parseFloat(row['Total Rs (₹)']) || 0,

                // Product Features
                design_type: row['Design Type']?.toString().trim() || '',
                manufacturing: row['Manufacturing']?.toString().trim() || '',
                customizable: ['yes', 'true', '1'].includes(row['Customizable']?.toString().toLowerCase()),
                engraving: ['yes', 'true', '1'].includes(row['Engraving']?.toString().toLowerCase()),
                hallmark: ['yes', 'true', '1'].includes(row['Hallmark']?.toString().toLowerCase()),

                // Product Feature Points (comma-separated)
                product_features: row['Product Features']?.toString().trim() || '',

                // Product Images - from Excel "First Image" column
                product_images: (() => {
                    const images = [];
                    const firstImage = row['First Image']?.toString().trim();
                    if (firstImage && firstImage !== '') {
                        images.push(firstImage);
                    }
                    return images;
                })(),

                // Meta Information
                created_at: row['Date']?.toString().trim() || null, // Date in DD/MM/YYYY format

                // Less Weight Items (if data exists)
                product_less_weight: (() => {
                    const lessWeightItems = [];

                    // Check if any less weight fields have data
                    if (row['Less Weight Item'] || row['Less Weight Stamp'] || row['Less Weight Clarity']) {
                        lessWeightItems.push({
                            item: row['Less Weight Item']?.toString().trim() || '',
                            stamp: row['Less Weight Stamp']?.toString().trim() || '',
                            clarity: row['Less Weight Clarity']?.toString().trim() || '',
                            color: row['Less Weight Color']?.toString().trim() || '',
                            cuts: row['Less Weight Cuts']?.toString().trim() || '',
                            shapes: row['Less Weight Shapes']?.toString().trim() || '',
                            remarks: row['Less Weight Remarks']?.toString().trim() || '',
                            pieces: parseInt(row['Less Weight Pieces']) || 1,
                            weight: parseFloat(row['Less Weight Weight']) || 0,
                            units: row['Less Weight Units']?.toString().trim() || 'carat',
                            tunch: parseFloat(row['Less Weight Purity']) || 0,
                            purchase_rate: parseFloat(row['Less Weight Purchase Rate (₹/unit)']) || 0,
                            sale_rate: parseFloat(row['Less Weight Sale Rate (₹/unit)']) || 0,
                            total_profit: parseFloat(row['Less Weight Total Profit']) || 0,
                            purchase_value: parseFloat(row['Less Weight Purchase Value']) || 0,
                            sale_value: parseFloat(row['Less Weight Sale Value']) || 0
                        });
                    }

                    return lessWeightItems;
                })(),

                // Product Options (if data exists)
                product_options: (() => {
                    const productOptions = [];

                    // Check if any product option fields have data (using correct column names from export)
                    const hasOptionData = row['Option Size'] || row['Option Weight'] || row['Option Gender'] ||
                        row['Option Dimensions'] || row['Option Metal Color'] || row['Option Occasion'] ||
                        row['Option Value (₹)'] || row['Option Sell Price (₹)'];

                    if (hasOptionData) {
                        productOptions.push({
                            size: row['Option Size']?.toString().trim() || 'Standard',
                            weight: row['Option Weight']?.toString().trim() || 'Standard',
                            dimensions: row['Option Dimensions']?.toString().trim() || 'Standard',
                            metal_color: row['Option Metal Color']?.toString().trim() || 'Standard',
                            gender: row['Option Gender']?.toString().trim() || null,
                            occasion: row['Option Occasion']?.toString().trim() || null,
                            value: parseFloat(row['Option Value (₹)']) || 0,
                            sell_price: parseFloat(row['Option Sell Price (₹)']) || 0
                        });
                    }

                    return productOptions;
                })()
            }));

            setUploadProgress(30);

            // Call the enhanced bulk upload API
            const response = await axios.post(`${API_BASE_URL}/api/admin/products/bulk-upload`, {
                products: productsData
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(30 + (progress * 0.7)); // 30% base + 70% upload progress
                }
            });

            setUploadProgress(100);

            if (response.data.success) {
                // Show detailed success message
                const data = response.data.data;
                let successMessage = response.data.message;

                if (data.created > 0 && data.updated > 0) {
                    successMessage = `Successfully created ${data.created} new products and updated ${data.updated} existing products`;
                } else if (data.created > 0) {
                    successMessage = `Successfully created ${data.created} new products`;
                } else if (data.updated > 0) {
                    successMessage = `Successfully updated ${data.updated} existing products`;
                }

                // Call onBulkAdd to notify parent of success (for refreshing the list)
                if (onBulkAdd) {
                    await onBulkAdd();
                }
                onClose();
            } else {
                setError(response.data.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Upload error:', error);

            // Handle different types of errors
            let errorMessage = 'Error uploading products. Please try again.';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = `Error: ${error.response.data.error}`;
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            // Add details if available
            if (error.response?.data?.details) {
                errorMessage += `\nDetails: ${error.response.data.details}`;
            }

            // Add errors array if available
            if (error.response?.data?.data?.errors) {
                const errors = error.response.data.data.errors;
                errorMessage += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`;
                if (errors.length > 5) {
                    errorMessage += `\n... and ${errors.length - 5} more errors`;
                }
            }

            setError(errorMessage);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreviewData(null);
        setValidationResults(null);
        setError(null);
        setUploading(false);
        setUploadProgress(0);
    };

    if (!isOpen) return null;

    return (
        <div className="bulk-add-modal-overlay">
            <div className="bulk-add-modal">
                <div className="bulk-add-modal-header">
                    <h3>{(mode === 'update' || (validationResults && validationResults.validRows.some(row => row['Tgno'] && row['Tgno'].toString().trim() !== ''))) ? 'Bulk Update Products' : 'Bulk Add Products'}</h3>
                    <button onClick={onClose} className="bulk-add-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="bulk-add-modal-content">
                    {!selectedFile ? (
                        <div
                            className={`bulk-add-dropzone ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <FileSpreadsheet size={48} />
                            <h4>Upload Excel File</h4>
                            <p>Drag and drop your Excel file here or click to browse</p>
                            <p className="bulk-add-mode-info">
                                {mode === 'update'
                                    ? 'System will automatically update existing products and create new ones based on Tag Number'
                                    : 'System will automatically create new products or update existing ones based on Tag Number'
                                }
                            </p>
                            <label className="bulk-add-file-input-label">
                                Choose File
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="bulk-add-file-input"
                                />
                            </label>
                            <p className="bulk-add-file-format">Supported formats: .xlsx, .xls</p>

                            <div className="bulk-add-instructions">
                                <p>Upload Excel file with product data. Tag Number determines create/update operation.</p>
                                <p>New Tag Number = Create product, Existing Tag Number = Update product.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bulk-add-preview">
                            <div className="bulk-add-file-info">
                                <FileSpreadsheet size={24} />
                                <div className="bulk-add-file-details">
                                    <span className="bulk-add-file-name">{selectedFile.name}</span>
                                    <span className="bulk-add-file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    onClick={resetForm}
                                    className="bulk-add-remove-file"
                                    title="Remove file and start over"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Validation Results */}
                            {validationResults && (
                                <div className="bulk-add-validation-results">
                                    <div className="bulk-add-validation-summary">
                                        <div className="bulk-add-validation-item">
                                            <CheckCircle size={16} className="text-success" />
                                            <span>Valid Rows: {validationResults.validCount}</span>
                                        </div>
                                        <div className="bulk-add-validation-item">
                                            <AlertTriangle size={16} className="text-warning" />
                                            <span>Total Rows: {validationResults.totalRows}</span>
                                        </div>
                                        {validationResults.errors.length > 0 && (
                                            <div className="bulk-add-validation-item">
                                                <AlertTriangle size={16} className="text-error" />
                                                <span>Errors: {validationResults.errors.length}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Error Details */}
                                    {validationResults.errors.length > 0 && (
                                        <div className="bulk-add-errors">
                                            <h5>Validation Errors:</h5>
                                            <div className="bulk-add-error-list">
                                                {validationResults.errors.slice(0, 10).map((error, index) => (
                                                    <div key={index} className="bulk-add-error-item">
                                                        <AlertTriangle size={14} />
                                                        <span>{error}</span>
                                                    </div>
                                                ))}
                                                {validationResults.errors.length > 10 && (
                                                    <div className="bulk-add-error-more">
                                                        + {validationResults.errors.length - 10} more errors
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Warning Details */}
                                    {validationResults.warnings.length > 0 && (
                                        <div className="bulk-add-warnings">
                                            <h5>Warnings:</h5>
                                            <div className="bulk-add-warning-list">
                                                {validationResults.warnings.slice(0, 5).map((warning, index) => (
                                                    <div key={index} className="bulk-add-warning-item">
                                                        <AlertTriangle size={14} />
                                                        <span>{warning}</span>
                                                    </div>
                                                ))}
                                                {validationResults.warnings.length > 5 && (
                                                    <div className="bulk-add-warning-more">
                                                        + {validationResults.warnings.length - 5} more warnings
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Data Preview */}
                            {previewData && previewData.length > 0 && (
                                <div className="bulk-add-data-preview">
                                    <h4>
                                        Data Preview ({previewData.length} rows)
                                        {!tagCheckLoading && existingTagNumbers.size > 0 && (
                                            <span className="operation-info">
                                                - {getOperationInfo().newProducts} New, {getOperationInfo().updateProducts} Update
                                            </span>
                                        )}
                                    </h4>
                                    <div className="bulk-add-preview-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Tgno</th>
                                                    <th>Date</th>
                                                    <th>Stamp</th>
                                                    <th>Remarks</th>
                                                    <th>Pc</th>
                                                    <th>Gwt</th>
                                                    <th>Lwt</th>
                                                    <th>Wt</th>
                                                    <th>Stnwt</th>
                                                    <th>Dwt</th>
                                                    <th>Certif</th>
                                                    <th>Item Name</th>
                                                    <th>Purity</th>
                                                    <th>Wstg</th>
                                                    <th>Add.Wt</th>
                                                    <th>Rate (₹)</th>
                                                    <th>Labour (₹)</th>
                                                    <th>Labour On</th>
                                                    <th>Other (₹)</th>
                                                    <th>Total Rs (₹)</th>
                                                    <th>Product Features</th>
                                                    <th>Category Name</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.slice(0, 5).map((row, index) => (
                                                    <tr key={index}>
                                                        <td>{row['Tgno'] || 'N/A'}</td>
                                                        <td>{row['Date'] || 'N/A'}</td>
                                                        <td>{row['Stamp'] || 'N/A'}</td>
                                                        <td>{row['Remarks'] || 'N/A'}</td>
                                                        <td>{row['Pc'] || '1'}</td>
                                                        <td>{row['Gwt'] || '0'}</td>
                                                        <td>{row['Lwt'] || '0'}</td>
                                                        <td>{row['Wt'] || '0'}</td>
                                                        <td>{row['Stnwt'] || '0'}</td>
                                                        <td>{row['Dwt'] || '0'}</td>
                                                        <td>{row['Certif'] || 'N/A'}</td>
                                                        <td>{row['Item Name'] || 'N/A'}</td>
                                                        <td>{row['Purity'] || '100'}</td>
                                                        <td>{row['Wstg'] || '0'}</td>
                                                        <td>{row['Add.Wt'] || '0'}</td>
                                                        <td>{row['Rate (₹)'] || '0'}</td>
                                                        <td>{row['Labour (₹)'] || '0'}</td>
                                                        <td>{row['Labour On'] || 'Wt'}</td>
                                                        <td>{row['Other (₹)'] || '0'}</td>
                                                        <td>{row['Total Rs (₹)'] || '0'}</td>
                                                        <td>{row['Product Features'] || 'N/A'}</td>
                                                        <td>{row['Category Name'] || 'N/A'}</td>
                                                        <td>
                                                            <span className={`status-badge ${(row['Status'] || 'active').toLowerCase()}`}>
                                                                {row['Status'] || 'active'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {previewData.length > 5 && (
                                            <p className="bulk-add-preview-more">
                                                + {previewData.length - 5} more rows
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Less Weight Data Preview */}
                            {previewData && previewData.some(row =>
                                parseFloat(row['Lwt']) > 0 ||
                                parseFloat(row['Stnwt']) > 0 ||
                                parseFloat(row['Dwt']) > 0 ||
                                row['Less Weight Item'] ||
                                row['Less Weight Stamp'] ||
                                row['Less Weight Clarity'] ||
                                row['Less Weight Color'] ||
                                row['Less Weight Cuts'] ||
                                row['Less Weight Shapes'] ||
                                row['Less Weight Remarks'] ||
                                row['Less Weight Pieces'] ||
                                row['Less Weight Weight'] ||
                                row['Less Weight Units'] ||
                                row['Less Weight Purity'] ||
                                row['Less Weight Purchase Rate (₹/unit)'] ||
                                row['Less Weight Purchase Value'] ||
                                row['Less Weight Sale Rate (₹/unit)'] ||
                                row['Less Weight Total Profit'] ||
                                row['Less Weight Sale Value']
                            ) && (
                                    <div className="bulk-add-less-weight-preview">
                                        <h4>Less Weight Data Preview</h4>
                                        <div className="bulk-add-less-weight-table">
                                            <table>
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
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewData
                                                        .filter(row =>
                                                            parseFloat(row['Lwt']) > 0 ||
                                                            parseFloat(row['Stnwt']) > 0 ||
                                                            parseFloat(row['Dwt']) > 0 ||
                                                            row['Less Weight Item'] ||
                                                            row['Less Weight Stamp'] ||
                                                            row['Less Weight Clarity'] ||
                                                            row['Less Weight Color'] ||
                                                            row['Less Weight Cuts'] ||
                                                            row['Less Weight Shapes'] ||
                                                            row['Less Weight Remarks'] ||
                                                            row['Less Weight Pieces'] ||
                                                            row['Less Weight Weight'] ||
                                                            row['Less Weight Units'] ||
                                                            row['Less Weight Purity'] ||
                                                            row['Less Weight Purchase Rate (₹/unit)'] ||
                                                            row['Less Weight Sale Rate (₹/unit)'] ||
                                                            row['Less Weight Total Profit'] ||
                                                            row['Less Weight Purchase Value'] ||
                                                            row['Less Weight Sale Value']
                                                        )
                                                        .slice(0, 5)
                                                        .map((row, index) => (
                                                            <tr key={index}>
                                                                <td>{row['Less Weight Item'] || row['Item Name'] || 'N/A'}</td>
                                                                <td>{row['Less Weight Stamp'] || row['Stamp'] || 'N/A'}</td>
                                                                <td>{row['Less Weight Clarity'] || 'N/A'}</td>
                                                                <td>{row['Less Weight Color'] || 'N/A'}</td>
                                                                <td>{row['Less Weight Cuts'] || 'N/A'}</td>
                                                                <td>{row['Less Weight Shapes'] || 'N/A'}</td>
                                                                <td>{row['Less Weight Remarks'] || row['Remarks'] || 'N/A'}</td>
                                                                <td>{row['Less Weight Pieces'] || row['Pc'] || '1'}</td>
                                                                <td>{row['Less Weight Weight'] || row['Lwt'] || '0'}</td>
                                                                <td>{row['Less Weight Units'] || 'g'}</td>
                                                                <td>{row['Less Weight Purity'] || row['Purity'] || '100'}</td>
                                                                <td>{row['Less Weight Purchase Rate (₹/unit)'] || '0'}</td>
                                                                <td>{row['Less Weight Sale Rate (₹/unit)'] || '0'}</td>
                                                                <td>{row['Less Weight Total Profit'] || '0'}</td>
                                                                <td>{row['Less Weight Purchase Value'] || '0'}</td>
                                                                <td>{row['Less Weight Sale Value'] || '0'}</td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                            {previewData.filter(row =>
                                                parseFloat(row['Lwt']) > 0 ||
                                                parseFloat(row['Stnwt']) > 0 ||
                                                parseFloat(row['Dwt']) > 0 ||
                                                row['Less Weight Item'] ||
                                                row['Less Weight Stamp'] ||
                                                row['Less Weight Clarity'] ||
                                                row['Less Weight Color'] ||
                                                row['Less Weight Cuts'] ||
                                                row['Less Weight Shapes'] ||
                                                row['Less Weight Remarks'] ||
                                                row['Less Weight Pieces'] ||
                                                row['Less Weight Weight'] ||
                                                row['Less Weight Units'] ||
                                                row['Less Weight Purity'] ||
                                                row['Less Weight Purchase Rate (₹/unit)'] ||
                                                row['Less Weight Purchase Value'] ||
                                                row['Less Weight Sale Rate (₹/unit)'] ||
                                                row['Less Weight Total Profit'] ||
                                                row['Less Weight Sale Value']
                                            ).length > 5 && (
                                                    <p className="bulk-add-preview-more">
                                                        + {previewData.filter(row =>
                                                            parseFloat(row['Lwt']) > 0 ||
                                                            parseFloat(row['Stnwt']) > 0 ||
                                                            parseFloat(row['Dwt']) > 0 ||
                                                            row['Less Weight Item'] ||
                                                            row['Less Weight Stamp'] ||
                                                            row['Less Weight Clarity'] ||
                                                            row['Less Weight Color'] ||
                                                            row['Less Weight Cuts'] ||
                                                            row['Less Weight Shapes'] ||
                                                            row['Less Weight Remarks'] ||
                                                            row['Less Weight Pieces'] ||
                                                            row['Less Weight Weight'] ||
                                                            row['Less Weight Units'] ||
                                                            row['Less Weight Purity'] ||
                                                            row['Less Weight Purchase Rate (₹/unit)'] ||
                                                            row['Less Weight Purchase Value'] ||
                                                            row['Less Weight Sale Rate (₹/unit)'] ||
                                                            row['Less Weight Total Profit'] ||
                                                            row['Less Weight Sale Value']
                                                        ).length - 5} more less weight items
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                )}

                            {/* Product Options Data Preview */}
                            {previewData && previewData.some(row => row['Option Size'] || row['Option Weight'] || row['Option Dimensions'] || row['Option Metal Color'] || row['Option Gender'] || row['Option Occasion']) && (
                                <div className="bulk-add-product-options-preview">
                                    <h4>Product Options Data Preview</h4>
                                    <div className="bulk-add-product-options-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Option Size</th>
                                                    <th>Option Weight</th>
                                                    <th>Option Dimensions</th>
                                                    <th>Option Metal Color</th>
                                                    <th>Option Gender</th>
                                                    <th>Option Occasion</th>
                                                    <th>Option Value (₹)</th>
                                                    <th>Option Sell Price (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData
                                                    .filter(row => row['Option Size'] || row['Option Weight'] || row['Option Dimensions'] || row['Option Metal Color'] || row['Option Gender'] || row['Option Occasion'])
                                                    .slice(0, 5)
                                                    .map((row, index) => (
                                                        <tr key={index}>
                                                            <td>{row['Option Size'] || 'N/A'}</td>
                                                            <td>{row['Option Weight'] || 'N/A'}</td>
                                                            <td>{row['Option Dimensions'] || 'N/A'}</td>
                                                            <td>{row['Option Metal Color'] || 'N/A'}</td>
                                                            <td>{row['Option Gender'] || 'N/A'}</td>
                                                            <td>{row['Option Occasion'] || 'N/A'}</td>
                                                            <td>{row['Option Value (₹)'] || '0'}</td>
                                                            <td>{row['Option Sell Price (₹)'] || '0'}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                        {previewData.filter(row => row['Option Size'] || row['Option Weight'] || row['Option Dimensions'] || row['Option Metal Color'] || row['Option Gender'] || row['Option Occasion']).length > 5 && (
                                            <p className="bulk-add-preview-more">
                                                + {previewData.filter(row => row['Option Size'] || row['Option Weight'] || row['Option Dimensions'] || row['Option Metal Color'] || row['Option Gender'] || row['Option Occasion']).length - 5} more product options
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="bulk-add-error">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="bulk-add-progress">
                            <div className="bulk-add-progress-header">
                                <Loader2 size={16} className="spinning" />
                                <span>Uploading products... {uploadProgress}%</span>
                            </div>
                            <div className="bulk-add-progress-bar">
                                <div
                                    className="bulk-add-progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="bulk-add-modal-footer">
                        <button onClick={onClose} className="bulk-add-cancel-btn" disabled={uploading}>
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="bulk-add-submit-btn"
                            disabled={!validationResults || validationResults.validCount === 0 || uploading}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={16} className="spinning" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    {tagCheckLoading ? (
                                        <>Checking Tag Numbers...</>
                                    ) : (
                                        <>
                                            {getOperationInfo().buttonText} ({validationResults?.validCount || 0} Products)
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkAddProducts;
