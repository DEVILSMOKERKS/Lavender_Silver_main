import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './Invoice.css';
import { useDynamicLinks } from '../../../../hooks/useDynamicLinks';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const resolveImage = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = API_BASE_URL.replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
};

const Invoice = ({ order, onClose }) => {
    const invoiceRef = useRef(null);
    const invoiceContentRef = useRef(null);
    const [labourSectionOpen, setLabourSectionOpen] = useState(false);
    const { links } = useDynamicLinks();
    const items = useMemo(() => (Array.isArray(order?.items) ? order.items : []), [order]);
    const companyPhone = links?.whatsapp || '+919829034926';
    const companyEmail = links?.email || 'p.v.jewellersnsons.sks@gmail.com';
    const companyWebsite = links?.website || 'https://pvjjewellers.com';

    if (!order) return null;

    // Get shipping state for GST calculation
    const shippingState = order?.shipping_state || '';
    const isRajasthan = shippingState.toLowerCase().includes('rajasthan') || shippingState.toLowerCase().includes('raj');

    // Calculate GST and Labour for each item
    const itemsWithCalculations = items.map(item => {
        const rate = Number(item?.rate ?? item?.product_rate ?? 0);
        const quantity = Number(item?.quantity ?? 1);

        // Parse weight from order_items weight column (varchar format like "10 g" or "5.5")
        let netWeight = 0;
        if (item?.weight) {
            // Extract numeric value from weight string (e.g., "10 g" -> 10, "5.5 g" -> 5.5)
            const weightStr = String(item.weight).trim();
            const weightMatch = weightStr.match(/(\d+\.?\d*)/);
            if (weightMatch) {
                netWeight = Number(weightMatch[1]) || 0;
            }
        }

        // If weight column is empty, fallback to calculated weight
        if (netWeight === 0) {
            const grossWeight = Number(item?.gross_weight ?? 0);
            const lessWeight = Number(item?.less_weight ?? 0);
            const additionalWeight = Number(item?.additional_weight ?? 0);
            netWeight = Math.max(0, (grossWeight - lessWeight) + additionalWeight);
        }

        // Calculate Amount = Rate × Weight
        const amount = rate * netWeight;

        // Calculate GST on Amount based on state
        let gstAmount = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        if (isRajasthan) {
            // Rajasthan: 1.5% CGST + 1.5% SGST on Amount
            cgst = amount * 0.015;
            sgst = amount * 0.015;
            gstAmount = cgst + sgst;
        } else {
            // Other states: 3% IGST on Amount
            igst = amount * 0.03;
            gstAmount = igst;
        }

        // Calculate Labour based on state
        const labourValue = Number(item?.labour ?? 0);
        const labourOnWeight = labourValue * netWeight;
        let labourAmount = 0;
        let labourCGST = 0;
        let labourSGST = 0;
        let labourIGST = 0;

        if (isRajasthan) {
            // Rajasthan: 2.5% + 2.5% on (labour value * weight)
            labourCGST = labourOnWeight * 0.025;
            labourSGST = labourOnWeight * 0.025;
            labourAmount = labourCGST + labourSGST;
        } else {
            // Other states: 5% on (labour value * weight)
            labourIGST = labourOnWeight * 0.05;
            labourAmount = labourIGST;
        }

        return {
            ...item,
            rate,
            quantity,
            netWeight,
            amount,
            gstAmount,
            cgst,
            sgst,
            igst,
            labourAmount,
            labourCGST,
            labourSGST,
            labourIGST,
            labourOnWeight
        };
    });

    // Calculate totals
    // Grand Total = Sum of order_items total (the amount user actually paid)
    const grandTotal = items.reduce((sum, item) => {
        const price = Number(item?.custom_price ?? item?.price ?? item?.product_rate ?? 0);
        const quantity = Number(item?.quantity ?? 1);
        return sum + price * quantity;
    }, 0);

    const totalGST = itemsWithCalculations.reduce((sum, item) => sum + (item.gstAmount * item.quantity), 0);
    const totalLabour = itemsWithCalculations.reduce((sum, item) => sum + (item.labourAmount * item.quantity), 0);

    // Subtotal = Grand Total - GST - Labour
    const subtotal = grandTotal - totalGST - totalLabour;

    const tax = Number(order?.tax_amount || 0);
    const codCharge = Number(order?.cod_charge || 0);
    const discountAmount = Number(order?.discount_amount || 0);

    const handlePrint = () => {
        if (!invoiceContentRef.current) return;
        // Create a new window for printing without the header buttons
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${order?.order_number || ''}</title>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body { 
                margin: 0; 
                padding: 10mm;
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #000;
                background: #fff;
              }
              
              @page {
                size: A4;
                margin: 10mm;
              }
              
              .invoice-header-section {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #000;
                page-break-inside: avoid;
              }
              
              .header {
                text-align: center;
                margin-bottom: 15px;
              }
              
              .logo {
                font-size: 22px;
                font-weight: bold;
                color: #000;
                margin-bottom: 5px;
              }
              
              .invoice-title {
                font-size: 24px;
                font-weight: bold;
                color: #000;
                margin-bottom: 3px;
              }
              
              .invoice-subtitle {
                font-size: 12px;
                color: #666;
              }
              
              .invoice-details {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 15px;
                page-break-inside: avoid;
              }
              
              .customer-info,
              .invoice-info {
                flex: 1;
                min-width: 0;
              }
              
              .info-section {
                margin-bottom: 12px;
              }
              
              .info-title {
                font-size: 13px;
                font-weight: bold;
                color: #000;
                margin-bottom: 6px;
                border-bottom: 1px solid #333;
                padding-bottom: 3px;
              }
              
              .info-content {
                font-size: 11px;
                line-height: 1.4;
                color: #000;
              }
              
              .info-content div {
                margin-bottom: 3px;
              }
              
              .company-address-section {
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f5f5f5;
                border-left: 3px solid #000;
                page-break-inside: avoid;
              }
              
              .items-section {
                margin-bottom: 15px;
                page-break-inside: avoid;
              }
              
              .items-section h3 {
                font-size: 14px;
                font-weight: bold;
                color: #000;
                margin-bottom: 10px;
                border-bottom: 1px solid #333;
                padding-bottom: 3px;
              }
              
              .invoice-items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
                font-size: 10px;
              }
              
              .invoice-items-table th {
                background-color: #333 !important;
                color: #fff !important;
                padding: 8px 6px;
                font-size: 10px;
                font-weight: bold;
                text-align: left;
                border: 1px solid #000;
              }
              
              .invoice-items-table td {
                padding: 6px;
                font-size: 10px;
                border: 1px solid #ddd;
                vertical-align: top;
              }
              
              .invoice-items-table tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              
              .invoice-item-image {
                width: 40px;
                height: 40px;
                object-fit: cover;
                border: 1px solid #ddd;
              }
              
              .invoice-product-name {
                font-weight: 600;
                color: #000;
                font-size: 10px;
              }
              
              .invoice-product-meta {
                font-size: 9px;
                color: #666;
                margin-top: 2px;
              }
              
              .gst-section,
              .labour-section {
                margin-top: 12px;
                margin-bottom: 12px;
                page-break-inside: avoid;
              }
              
              .gst-section h3,
              .labour-section h3 {
                font-size: 13px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
              }
              
              .gst-section table,
              .labour-section table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }
              
              .gst-section th,
              .labour-section th {
                padding: 6px;
                text-align: left;
                border: 1px solid #000;
                background-color: #f5f5f5;
                font-weight: bold;
                font-size: 10px;
              }
              
              .gst-section td,
              .labour-section td {
                padding: 6px;
                border: 1px solid #ddd;
                font-size: 10px;
              }
              
              .total-section {
                margin-bottom: 15px;
                padding: 12px;
                background-color: #f5f5f5;
                border-left: 3px solid #000;
                text-align: right;
                page-break-inside: avoid;
              }
              
              .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
                padding: 4px 0;
              }
              
              .total-label {
                font-weight: 600;
                color: #000;
                font-size: 12px;
              }
              
              .total-value {
                font-weight: bold;
                color: #000;
                font-size: 12px;
              }
              
              .grand-total {
                border-top: 2px solid #000;
                padding-top: 8px;
                margin-top: 8px;
              }
              
              .grand-total .total-label,
              .grand-total .total-value {
                font-size: 14px;
                font-weight: bold;
              }
              
              .terms {
                margin-top: 15px;
                padding: 10px;
                background-color: #f5f5f5;
                border-left: 3px solid #000;
                page-break-inside: avoid;
              }
              
              .terms h4 {
                font-size: 12px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
              }
              
              .terms ul {
                margin: 0;
                padding-left: 18px;
                line-height: 1.4;
              }
              
              .terms li {
                font-size: 10px;
                margin-bottom: 4px;
                color: #000;
              }
              
              .footer {
                margin-top: 15px;
                padding: 10px;
                background-color: #f5f5f5;
                text-align: center;
                page-break-inside: avoid;
              }
              
              .footer p {
                font-size: 10px;
                color: #000;
                margin: 3px 0;
              }
              
              .footer p:first-child {
                font-weight: bold;
                font-size: 12px;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  padding: 0;
                }
                
                @page {
                  margin: 10mm;
                }
                
                .invoice-items-table thead {
                  display: table-header-group;
                }
                
                .invoice-items-table tbody {
                  display: table-row-group;
                }
                
                .invoice-items-table tr {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            ${invoiceContentRef.current.innerHTML}
          </body>
        </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleDownload = async () => {
        if (!invoiceContentRef.current) return;
        try {
            // Wait a bit for images to load
            await new Promise(resolve => setTimeout(resolve, 800));

            // Create a temporary container with all styles
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '210mm'; // A4 width
            tempContainer.style.padding = '5px 8px'; // Reduced padding: top/bottom 5px, left/right 8px
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.style.fontFamily = "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

            // Clone the content
            const clonedContent = invoiceContentRef.current.cloneNode(true);

            // Hide labour section if total labour is 0
            const clonedLabourSection = clonedContent.querySelector('.labour-section');
            if (clonedLabourSection && totalLabour === 0) {
                clonedLabourSection.style.display = 'none';
            } else {
                // Expand labour section in cloned content for download if labour > 0
                const clonedLabourContent = clonedContent.querySelector('.labour-section-content');
                if (clonedLabourContent) {
                    clonedLabourContent.classList.add('open');
                    clonedLabourContent.style.display = 'block';
                }
                // Hide the toggle button in download
                const clonedLabourToggle = clonedContent.querySelector('.labour-section-toggle');
                if (clonedLabourToggle) {
                    clonedLabourToggle.style.cursor = 'default';
                    clonedLabourToggle.style.pointerEvents = 'none';
                }
            }

            // Fix images in cloned content - ensure they load properly
            const clonedImages = clonedContent.querySelectorAll('img');
            const imagePromises = [];
            clonedImages.forEach((img) => {
                if (img.src && !img.src.startsWith('data:')) {
                    img.crossOrigin = 'anonymous';
                    img.loading = 'eager';

                    // Create promise to wait for image load
                    const imgPromise = new Promise((resolve) => {
                        const newImg = new Image();
                        newImg.crossOrigin = 'anonymous';
                        newImg.onload = () => {
                            img.src = newImg.src;
                            resolve();
                        };
                        newImg.onerror = () => {
                            // Replace with placeholder if image fails
                            const placeholder = document.createElement('div');
                            placeholder.className = 'invoice-item-placeholder';
                            placeholder.textContent = 'No Image';
                            placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 35px; height: 35px; background: #f0f0f0; color: #999; border-radius: 6px; font-size: 9px;';
                            if (img.parentNode) {
                                img.parentNode.replaceChild(placeholder, img);
                            }
                            resolve();
                        };
                        newImg.src = img.src;
                    });
                    imagePromises.push(imgPromise);
                }
            });

            // Wait for all images to load
            await Promise.all(imagePromises);

            tempContainer.appendChild(clonedContent);

            // Get computed styles and inject them
            const styleElement = document.createElement('style');
            let allStyles = '';

            // Add Invoice.css styles manually
            allStyles += `
                .invoice-content { padding: 5px 8px; background: white; }
                .invoice-header-section { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #f0f0f0; }
                .header { text-align: center; margin-bottom: 10px; }
                .logo { font-size: 22px; font-weight: bold; color: #7c2d4a; margin-bottom: 3px; }
                .invoice-title { font-size: 26px; color: #333; margin-bottom: 2px; font-weight: bold; }
                .invoice-subtitle { color: #666; font-size: 13px; }
                .invoice-details { display: flex; justify-content: space-between; margin-bottom: 15px; gap: 25px; }
                .customer-info, .invoice-info { flex: 1; }
                .info-section { margin-bottom: 12px; }
                .info-title { font-weight: bold; color: #7c2d4a; margin-bottom: 6px; font-size: 13px; border-bottom: 1px solid #7c2d4a; padding-bottom: 2px; }
                .info-content { color: #333; line-height: 1.4; font-size: 12px; }
                .company-address-section { margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #7c2d4a; }
                .items-section { margin-bottom: 15px; }
                .items-section h3 { color: #7c2d4a; margin-bottom: 8px; font-size: 15px; border-bottom: 1px solid #7c2d4a; padding-bottom: 2px; }
                .invoice-table-wrapper { width: 100%; overflow-x: auto; }
                .invoice-items-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: visible; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); font-size: 11px; table-layout: auto; }
                .invoice-items-table th { background: linear-gradient(135deg, #7c2d4a 0%, #9a3d5f 100%); color: white; padding: 8px 6px; text-align: left; font-weight: 600; font-size: 11px; white-space: nowrap; }
                .invoice-items-table td { padding: 6px; border-bottom: 1px solid #eee; font-size: 11px; word-wrap: break-word; }
                .invoice-items-table .invoice-product-name { white-space: normal; }
                .invoice-items-table .invoice-product-meta { white-space: normal; }
                .invoice-items-table tr:nth-child(even) { background-color: #f8f9fa; }
                .invoice-item-image { width: 35px; height: 35px; border-radius: 6px; object-fit: cover; border: 1px solid #e0e0e0; display: block; }
                .invoice-item-placeholder { width: 35px; height: 35px; border-radius: 6px; background: #f1f1f1; color: #888; display: flex; align-items: center; justify-content: center; font-size: 9px; text-align: center; padding: 3px; }
                .invoice-product-name { font-weight: 600; color: #333; font-size: 12px; }
                .invoice-product-meta { font-size: 10px; color: #777; margin-top: 2px; }
                .gst-section, .labour-section { margin-top: 15px; margin-bottom: 12px; }
                .gst-section h3, .labour-section h3 { color: #16784f; margin-bottom: 8px; font-size: 15px; }
                .gst-section table, .labour-section table { width: 100%; border-collapse: collapse; font-size: 11px; }
                .gst-section th, .labour-section th { padding: 6px; text-align: left; border: 1px solid #ddd; background-color: #f5f5f5; font-size: 10px; }
                .gst-section td, .labour-section td { padding: 6px; border: 1px solid #ddd; font-size: 10px; }
                .total-section { text-align: right; margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #7c2d4a; }
                .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 5px 0; }
                .total-label { font-weight: 600; color: #333; font-size: 13px; }
                .total-value { font-weight: bold; color: #7c2d4a; font-size: 13px; }
                .grand-total { border-top: 2px solid #7c2d4a; padding-top: 8px; margin-top: 8px; font-size: 16px; }
                .grand-total .total-label, .grand-total .total-value { font-size: 18px; }
                .terms { margin-top: 15px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #7c2d4a; border-radius: 8px; }
                .terms h4 { color: #7c2d4a; margin-bottom: 8px; font-size: 15px; }
                .terms ul { margin: 0; padding-left: 18px; line-height: 1.5; }
                .terms li { margin-bottom: 5px; color: #555; font-size: 11px; }
                .footer { margin-top: 20px; text-align: center; color: #666; font-size: 11px; padding: 12px; background-color: #f8f9fa; border-radius: 8px; }
                .footer p:first-child { font-weight: bold; color: #7c2d4a; font-size: 13px; }
                .labour-section-toggle { cursor: pointer; user-select: none; }
                .labour-section-content { display: none; }
                .labour-section-content.open { display: block !important; }
            `;

            styleElement.textContent = allStyles;
            tempContainer.appendChild(styleElement);

            document.body.appendChild(tempContainer);

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                imageTimeout: 15000,
                onclone: (clonedDoc) => {
                    // Ensure all images are loaded in cloned document
                    const images = clonedDoc.querySelectorAll('img');
                    images.forEach(img => {
                        // Set crossOrigin for CORS
                        if (img.src && !img.src.startsWith('data:')) {
                            img.crossOrigin = 'anonymous';
                        }

                        // If image failed to load or has no src, show placeholder
                        if (!img.src || img.src === '' || (img.complete && img.naturalHeight === 0)) {
                            const placeholder = clonedDoc.createElement('div');
                            placeholder.className = 'invoice-item-placeholder';
                            placeholder.textContent = 'No Image';
                            placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 35px; height: 35px; background: #f0f0f0; color: #999; border-radius: 6px; font-size: 9px;';
                            if (img.parentNode) {
                                img.parentNode.replaceChild(placeholder, img);
                            }
                        }
                    });

                    // Expand labour section in cloned doc if labour > 0
                    const labourSection = clonedDoc.querySelector('.labour-section');
                    if (labourSection && totalLabour === 0) {
                        labourSection.style.display = 'none';
                    } else {
                        const labourContent = clonedDoc.querySelector('.labour-section-content');
                        if (labourContent) {
                            labourContent.classList.add('open');
                            labourContent.style.display = 'block';
                        }
                        // Hide toggle button
                        const labourToggle = clonedDoc.querySelector('.labour-section-toggle');
                        if (labourToggle) {
                            labourToggle.style.cursor = 'default';
                            labourToggle.style.pointerEvents = 'none';
                        }
                    }
                }
            });

            // Remove temporary container
            document.body.removeChild(tempContainer);

            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            // Reduce margins - use full page width
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Handle multi-page PDF if content is too long
            if (pdfHeight > pdf.internal.pageSize.getHeight()) {
                const pageHeight = pdf.internal.pageSize.getHeight();
                let heightLeft = pdfHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`Invoice_${order.order_number || order.id || 'PVJ'}.pdf`);
        } catch (error) {
            console.error('Failed to download invoice:', error);
            alert('Failed to download invoice. Please try again or use the print option.');
        }
    };

    const customerAddress = [
        order?.shipping_address,
        order?.shipping_city,
        order?.shipping_state,
        order?.shipping_postal_code,
        order?.shipping_country
    ]
        .filter(Boolean)
        .join(', ');

    const customerPhone =
        order?.customer_phone ||
        order?.user_phone ||
        order?.phone ||
        order?.contact_number ||
        '-';

    const paymentMethod = (order?.payment_method || '').toString().toUpperCase();
    const statusLabel = (order?.order_status || '').toString();

    return (
        <div className="invoice-overlay">
            <div className="invoice-modal" ref={invoiceRef}>
                <div className="invoice-header">
                    <h2>Invoice - {order?.order_number || 'Order'}</h2>
                    <div className="invoice-actions">
                        <button className="invoice-btn print" onClick={handlePrint}>
                            Print
                        </button>
                        <button className="invoice-btn download" onClick={handleDownload}>
                            Download PDF
                        </button>
                        <button className="invoice-btn close" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>

                <div className="invoice-content" ref={invoiceContentRef}>
                    <div className="invoice-header-section">
                        <div className="header">
                            <div className="logo">PVJ JEWELRY</div>
                            <div className="invoice-title">INVOICE</div>
                            <div className="invoice-subtitle">Professional Jewelry & Accessories</div>
                        </div>
                    </div>

                    <div className="invoice-details">
                        <div className="customer-info">
                            <div className="info-section">
                                <div className="info-title">Bill To</div>
                                <div className="info-content">
                                    <strong>{order?.customer_name || 'Customer'}</strong>
                                    <div>Email: {order?.customer_email || '-'}</div>
                                    <div>Phone: {customerPhone}</div>
                                    <div>Address: {customerAddress || '-'}</div>
                                </div>
                            </div>
                        </div>
                        <div className="invoice-info">
                            <div className="info-section">
                                <div className="info-title">Order Details</div>
                                <div className="info-content">
                                    <div>Order ID: {order?.id}</div>
                                    <div>Date: {formatDate(order?.created_at)}</div>
                                    <div>Time: {formatTime(order?.created_at)}</div>
                                    <div>Status: {statusLabel || '-'}</div>
                                    <div>Payment: {paymentMethod || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="company-address-section">
                        <div className="info-section">
                            <div className="info-title">Company</div>
                            <div className="info-content">
                                <strong>PVJ Jewelry</strong>
                                <div>123 Jewelry Street, Diamond Plaza</div>
                                <div>Jaipur, Rajasthan - 302001, India</div>
                                <div>Phone: {companyPhone}</div>
                                <div>Email: {companyEmail}</div>
                                <div>Website: {companyWebsite}</div>
                            </div>
                        </div>
                    </div>

                    <div className="items-section">
                        <h3>Order Items</h3>
                        <div className="invoice-table-wrapper">
                            <table className="invoice-items-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Category</th>
                                        <th>Subcategory</th>
                                        <th>Sub-subcategory</th>
                                        <th>Size</th>
                                        <th>Weight</th>
                                        <th>Qty</th>
                                        <th>Rate</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length ? (
                                        itemsWithCalculations.map((item, index) => {
                                            // Get price from multiple possible fields for total calculation
                                            const price = Number(
                                                item?.custom_price ??
                                                item?.price ??
                                                item?.product_rate ??
                                                item?.sell_price ??
                                                0
                                            );
                                            const lineTotal = price * item.quantity;

                                            // Get less_weight data
                                            const lessWeightItemName = item?.less_weight_item_name || null;
                                            const lessWeightWeight = Number(item?.less_weight_weight ?? 0);
                                            const lessWeightSaleValue = Number(item?.less_weight_sale_value ?? 0);

                                            // Get product details
                                            const discountValue = Number(item?.discount ?? 0);
                                            const labourValue = Number(item?.labour ?? 0);
                                            const labourOn = item?.labour_on || 'Wt';
                                            const tunch = Number(item?.tunch ?? 100.00);
                                            const additionalWeight = Number(item?.additional_weight ?? 0);
                                            const wastagePercentage = Number(item?.wastage_percentage ?? 0);
                                            const diamondWeight = Number(item?.diamond_weight ?? 0);
                                            const stoneWeight = Number(item?.stone_weight ?? 0);
                                            const other = Number(item?.other ?? 0);

                                            // Resolve image URL properly
                                            let image = null;
                                            if (item?.product_image) {
                                                image = resolveImage(item.product_image);
                                            } else if (item?.image) {
                                                image = resolveImage(item.image);
                                            } else if (item?.image_url) {
                                                image = resolveImage(item.image_url);
                                            }

                                            // Get product name from multiple possible fields
                                            const productName = item?.product_name ||
                                                item?.item_name ||
                                                item?.name ||
                                                'Product';

                                            // Get SKU
                                            const productSku = item?.product_sku ||
                                                item?.sku ||
                                                '-';

                                            return (
                                                <tr key={item?.id || `${order.id}-${index}`}>
                                                    <td>
                                                        {image ? (
                                                            <>
                                                                <img
                                                                    src={image}
                                                                    alt={productName}
                                                                    className="invoice-item-image"
                                                                    crossOrigin="anonymous"
                                                                    loading="eager"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        const placeholder = e.target.nextElementSibling;
                                                                        if (placeholder) {
                                                                            placeholder.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="invoice-item-placeholder" style={{ display: 'none' }}>No Image</div>
                                                            </>
                                                        ) : (
                                                            <div className="invoice-item-placeholder" style={{ display: 'flex' }}>No Image</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="invoice-product-name">
                                                            {productName}
                                                        </div>
                                                        {item?.metal_type && <div className="invoice-product-meta">Metal: {item.metal_type}</div>}
                                                        {lessWeightItemName && (
                                                            <div className="invoice-product-meta">
                                                                Less Weight: {lessWeightItemName} ({lessWeightWeight} {item?.less_weight_units || 'carat'})
                                                            </div>
                                                        )}
                                                        {lessWeightSaleValue > 0 && (
                                                            <div className="invoice-product-meta">Less Weight Value: {formatCurrency(lessWeightSaleValue)}</div>
                                                        )}
                                                        {discountValue > 0 && (
                                                            <div className="invoice-product-meta">Discount: {discountValue}%</div>
                                                        )}
                                                        {labourValue > 0 && (
                                                            <div className="invoice-product-meta">Labour: {formatCurrency(labourValue)} ({labourOn})</div>
                                                        )}
                                                        {tunch !== 100.00 && (
                                                            <div className="invoice-product-meta">Purity: {tunch}%</div>
                                                        )}
                                                        {additionalWeight > 0 && (
                                                            <div className="invoice-product-meta">Additional Weight: {additionalWeight} g</div>
                                                        )}
                                                        {wastagePercentage > 0 && (
                                                            <div className="invoice-product-meta">Wastage: {wastagePercentage}%</div>
                                                        )}
                                                        {diamondWeight > 0 && (
                                                            <div className="invoice-product-meta">Diamond Weight: {diamondWeight} carat</div>
                                                        )}
                                                        {stoneWeight > 0 && (
                                                            <div className="invoice-product-meta">Stone Weight: {stoneWeight} carat</div>
                                                        )}
                                                        {other > 0 && (
                                                            <div className="invoice-product-meta">Other: {formatCurrency(other)}</div>
                                                        )}
                                                    </td>
                                                    <td>{productSku}</td>
                                                    <td>{item?.category_name || item?.category || '-'}</td>
                                                    <td>{item?.subcategory_name || item?.subcategory || '-'}</td>
                                                    <td>{item?.sub_subcategory_name || item?.sub_subcategory || '-'}</td>
                                                    <td>{item?.size || '-'}</td>
                                                    <td>{item?.weight ? `${item.weight}${item.weight_unit || ' g'}` : '-'}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.rate)}</td>
                                                    <td>{formatCurrency(lineTotal)}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>
                                                No items found for this order.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* GST Calculation Section */}
                    <div className="gst-section" style={{ marginTop: '30px', marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '15px', color: '#16784f' }}>GST Calculation</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Product</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Rate</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Weight</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Amount</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Metal Type</th>
                                    {isRajasthan ? (
                                        <>
                                            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>CGST (1.5%)</th>
                                            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>SGST (1.5%)</th>
                                            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Total GST</th>
                                        </>
                                    ) : (
                                        <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>IGST (3%)</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {itemsWithCalculations.map((item, index) => {
                                    const productName = item?.product_name || item?.item_name || item?.name || 'Product';
                                    // Get full weight string from order_items.weight column
                                    const fullWeight = item?.weight ? `${item.weight}${item.weight_unit || ''}` : (item.netWeight > 0 ? `${item.netWeight.toFixed(3)} g` : '-');
                                    return (
                                        <tr key={`gst-${item?.id || index}`}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{productName}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.rate)}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{fullWeight}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.amount * item.quantity)}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{item?.metal_type || '-'}</td>
                                            {isRajasthan ? (
                                                <>
                                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.cgst * item.quantity)}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.sgst * item.quantity)}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.gstAmount * item.quantity)}</td>
                                                </>
                                            ) : (
                                                <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.igst * item.quantity)}</td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Labour Calculation Section */}
                    {totalLabour > 0 && (
                        <div className="labour-section" style={{ marginTop: '30px', marginBottom: '20px' }}>
                            <h3
                                className="labour-section-toggle"
                                style={{ marginBottom: '15px', color: '#16784f', cursor: 'pointer' }}
                                onClick={() => setLabourSectionOpen(!labourSectionOpen)}
                            >
                                Labour Calculation {labourSectionOpen ? '▼' : '▶'}
                            </h3>
                            <div className={`labour-section-content ${labourSectionOpen ? 'open' : ''}`} style={{ display: labourSectionOpen ? 'block' : 'none' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                                            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Product</th>
                                            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Labour Rate</th>
                                            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Weight</th>
                                            <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Labour × Weight</th>
                                            {isRajasthan ? (
                                                <>
                                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Labour CGST (2.5%)</th>
                                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Labour SGST (2.5%)</th>
                                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Total Labour</th>
                                                </>
                                            ) : (
                                                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Labour (5%)</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsWithCalculations.map((item, index) => {
                                            const productName = item?.product_name || item?.item_name || item?.name || 'Product';
                                            const labourValue = Number(item?.labour ?? 0);
                                            // Get full weight string from order_items.weight column
                                            const fullWeight = item?.weight ? `${item.weight}${item.weight_unit || ''}` : (item.netWeight > 0 ? `${item.netWeight.toFixed(3)} g` : '-');
                                            return (
                                                <tr key={`labour-${item?.id || index}`}>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{productName}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(labourValue)}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{fullWeight}</td>
                                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.labourOnWeight * item.quantity)}</td>
                                                    {isRajasthan ? (
                                                        <>
                                                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.labourCGST * item.quantity)}</td>
                                                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.labourSGST * item.quantity)}</td>
                                                            <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.labourAmount * item.quantity)}</td>
                                                        </>
                                                    ) : (
                                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>{formatCurrency(item.labourIGST * item.quantity)}</td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="total-section">
                        <div className="total-row">
                            <span className="total-label">Subtotal</span>
                            <span className="total-value">{formatCurrency(subtotal)}</span>
                        </div>
                        {order?.discount_amount && order.discount_amount > 0 && (
                            <div className="total-row" style={{ color: '#10b981' }}>
                                <span className="total-label">Discount{order.discount_code ? ` (${order.discount_code})` : ''}</span>
                                <span className="total-value">- {formatCurrency(order.discount_amount)}</span>
                            </div>
                        )}
                        <div className="total-row">
                            <span className="total-label">Total GST</span>
                            <span className="total-value">{formatCurrency(totalGST)}</span>
                        </div>
                        <div className="total-row">
                            <span className="total-label">Total Labour</span>
                            <span className="total-value">{formatCurrency(totalLabour)}</span>
                        </div>
                        {tax > 0 && (
                            <div className="total-row">
                                <span className="total-label">Tax</span>
                                <span className="total-value">{formatCurrency(tax)}</span>
                            </div>
                        )}
                        {codCharge ? (
                            <div className="total-row">
                                <span className="total-label">COD Charge</span>
                                <span className="total-value">{formatCurrency(codCharge)}</span>
                            </div>
                        ) : null}
                        <div className="total-row grand-total">
                            <span className="total-label">Grand Total</span>
                            <span className="total-value">{formatCurrency(grandTotal - discountAmount)}</span>
                        </div>
                    </div>

                    <div className="terms">
                        <h4>Terms & Conditions</h4>
                        <ul>
                            <li>All jewelry items are certified and hallmarked as per BIS standards.</li>
                            <li>Returns accepted within 7 days in original condition with tags.</li>
                            <li>Exchange available for size adjustments within 30 days.</li>
                            <li>Lifetime warranty on manufacturing defects.</li>
                            <li>Free cleaning and polishing service for 1 year.</li>
                            <li>For support, contact us at {companyEmail}</li>
                        </ul>
                    </div>

                    <div className="footer">
                        <p>Thank you for shopping with PVJ Jewelry!</p>
                        <p>For any queries, contact us at: {companyPhone} | {companyEmail}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invoice; 