import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import { AdminContext } from '../../../context/AdminContext';
import './EditProductPopup.css';

// Import section components directly
import ImageSection from './EditProductPopup/ImageSection';
import VideoSection from './EditProductPopup/VideoSection';
import ProductDataSection from './EditProductPopup/ProductDataSection';
import ProductFeaturesSection from './EditProductPopup/ProductFeaturesSection';
import CategorySection from './EditProductPopup/CategorySection';
import CertificationSection from './EditProductPopup/CertificationSection';

const EditProductPopup = ({ isOpen, onClose, onProductUpdated, productId }) => {
    const { showNotification } = useNotification();
    const { admin, token: adminToken } = useContext(AdminContext);
    const [loading, setLoading] = useState(false);
    const [productData, setProductData] = useState(null);
    const [formData, setFormData] = useState({});
    const [productFeatures, setProductFeatures] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

    // Fetch product details when popup opens
    useEffect(() => {
        if (isOpen && productId) {
            fetchProductDetails(productId);
        }
    }, [isOpen, productId]);

    // Update formData when productData changes
    useEffect(() => {
        if (productData) {
            setFormData({
                item_name: productData?.item_name || '',
                sku: productData?.sku || '',
                tag_number: productData?.tag_number || '',
                description: productData?.description || '',
                status: productData?.status || 'active',
                remark: productData?.remark || '',
                batch: productData?.batch || '',
                unit: productData?.unit || '',
                pieces: productData?.pieces || 1,
                metal_purity: productData?.stamp || productData?.metal_purity || '',
                additional_weight: productData?.additional_weight || '',
                tunch: productData?.tunch || '',
                wastage_percentage: productData?.wastage_percentage || '',
                rate: productData?.rate || '',
                diamond_weight: productData?.diamond_weight || '',
                stone_weight: productData?.stone_weight || '',
                other: productData?.other || '',
                total: productData?.total_rs || '',
                design_type: productData?.design_type || '',
                manufacturing_type: productData?.manufacturing_type || '',
                customizable: productData?.customizable || false,
                engraving_option: productData?.engraving_option || false,
                hallmark: productData?.hallmark || false,
                certificate_number: productData?.certificate_number || '',
                labour_type: productData?.labour_type || '',
                labour_flat: productData?.labour_flat || '',
                labour_percent: productData?.labour_percent || '',
                labour_weight: productData?.labour_weight || '',
                metal_id: productData?.metal_id || '',
                metal_purity_id: productData?.metal_purity_id || '',
                metal_type_name: productData?.metal_type_name || '',
                metal_purity_name: productData?.metal_purity_name || '',
                category_id: productData?.category_id || '',
                subcategory_id: productData?.subcategory_id || '',
                sub_subcategory_id: productData?.sub_subcategory_id || ''
            });
        }
    }, [productData]);

    // Update productFeatures when productData changes
    useEffect(() => {
        if (productData) {
            setProductFeatures(productData?.product_features || []);
        }
    }, [productData]);

    const fetchProductDetails = async (productId) => {
        setLoading(true);
        try {
            const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

            // Try admin endpoint first
            if (adminToken) {
                try {
                    const adminResponse = await axios.get(`${API_BASE_URL}/admin/products/${productId}/full`, { headers });
                    if (adminResponse.data.success) {
                        setProductData(adminResponse.data.data);
                        setLoading(false);
                        return;
                    }
                } catch (adminError) {
                    console.warn("Admin endpoint failed, trying fallback:", adminError.message);
                }
            }

            // Fallback to regular endpoint
            const response = await axios.get(`${API_BASE_URL}/products/${productId}`, { headers });
            const data = response.data.success ? response.data.data : response.data;
            setProductData(data);
        } catch (error) {
            console.error('Error fetching product details:', error);
            const errorMessage = error.response?.data?.message || error.message || "Error fetching product details";
            showNotification(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setProductData(null);
        onClose();
    };

    if (!isOpen) return null;

    // Extract data for sections with default values to prevent undefined errors
    const images = productData?.images || [];
    const videos = productData?.videos || [];
    const certificates = productData?.certificates || [];
    const metalTypes = productData?.metal_types || [];
    const gemstones = productData?.gemstones || [];
    const currentProductFeatures = productData?.product_features || [];


    return (
        <div className="edit-product-popup-overlay" onClick={handleClose}>
            <div className="edit-product-popup" onClick={(e) => e.stopPropagation()}>
                <div className="edit-product-popup-header">
                    <h2>Edit Product</h2>
                    <button
                        type="button"
                        className="edit-product-popup-close-btn"
                        onClick={handleClose}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="edit-product-popup-content">
                    {loading ? (
                        <div className="loading-spinner">Loading...</div>
                    ) : (
                        <div className="edit-product-sections">
                            {/* Image Section */}
                            <ImageSection
                                productId={productId}
                                images={images}
                                setImages={(newImages) => {
                                    setProductData(prev => ({ ...prev, images: newImages }));
                                }}
                                imageFiles={[]}
                                setImageFiles={() => { }}
                                onImageUpdate={() => {
                                    if (onProductUpdated) onProductUpdated();
                                    fetchProductDetails(productId);
                                }}
                            />

                            {/* Video Section */}
                            <VideoSection
                                productId={productId}
                                videos={videos}
                                setVideos={(newVideos) => {
                                    setProductData(prev => ({ ...prev, videos: newVideos }));
                                }}
                                videoFiles={[]}
                                setVideoFiles={() => { }}
                                onVideoUpdate={() => {
                                    if (onProductUpdated) onProductUpdated();
                                    fetchProductDetails(productId);
                                }}
                            />

                            {/* Product Data Section */}
                            <ProductDataSection
                                productId={productId}
                                formData={formData}
                                setFormData={setFormData}
                                onDataUpdate={() => {
                                    if (onProductUpdated) onProductUpdated();
                                    fetchProductDetails(productId);
                                }}
                                metalTypes={metalTypes}
                                gemstones={gemstones}
                            />

                            {/* Product Features Section */}
                            <ProductFeaturesSection
                                productId={productId}
                                productFeatures={productFeatures}
                                onFeaturesUpdate={(updatedFeatures) => {
                                    setProductFeatures(updatedFeatures);
                                    setProductData(prev => ({ ...prev, product_features: updatedFeatures }));
                                    if (onProductUpdated) onProductUpdated();
                                }}
                            />

                            {/* Category Section */}
                            <CategorySection
                                productId={productId}
                                formData={formData}
                                setFormData={setFormData}
                                onDataUpdate={() => {
                                    if (onProductUpdated) onProductUpdated();
                                    fetchProductDetails(productId);
                                }}
                            />

                            {/* Certification Section */}
                            <CertificationSection
                                productId={productId}
                                certificates={certificates}
                                setCertificates={(newCertificates) => {
                                    setProductData(prev => ({ ...prev, certificates: newCertificates }));
                                }}
                                certificateFiles={[]}
                                setCertificateFiles={() => { }}
                                onDataUpdate={() => {
                                    if (onProductUpdated) onProductUpdated();
                                    fetchProductDetails(productId);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditProductPopup;
