import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Play, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../../../../context/NotificationContext';
import './VideoSection.css';

const VideoSection = ({
    productId,
    videos,
    setVideos,
    videoFiles,
    setVideoFiles,
    onVideoUpdate
}) => {
    const { showNotification } = useNotification();
    const [uploading, setUploading] = useState(false);
    const [deletingVideo, setDeletingVideo] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [loading, setLoading] = useState(false);

    // Fetch videos when component mounts or productId changes
    useEffect(() => {
        if (productId) {
            fetchVideos();
        }
    }, [productId]);

    // Function to fetch videos from backend
    const fetchVideos = async () => {
        if (!productId) return;

        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/products/${productId}/videos`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                setVideos(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
            // If the endpoint doesn't exist, try to get videos from product data
            if (error.response?.status === 404) {
            }
        } finally {
            setLoading(false);
        }
    };

    // Function to refresh videos data
    const refreshVideos = async () => {
        await fetchVideos();
        showNotification('Videos refreshed successfully', 'success');
    };

    const handleVideoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('video/')) {
                showNotification('Only video files are allowed', 'error');
                return false;
            }
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                showNotification('Video size should be less than 100MB', 'error');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        setUploadProgress({});

        try {
            const formData = new FormData();
            validFiles.forEach(file => {
                formData.append('videos', file);
            });
            formData.append('product_id', productId);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/videos`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(prev => ({ ...prev, [files[0].name]: percentCompleted }));
                    }
                }
            );

            if (response.data.success) {
                const newVideos = response.data.data;
                setVideos(prev => [...prev, ...newVideos]);
                setVideoFiles(prev => [...prev, ...validFiles]);
                showNotification('Videos uploaded successfully', 'success');

                // Refresh videos data to ensure consistency
                setTimeout(() => {
                    fetchVideos();
                }, 1000);

                if (onVideoUpdate) {
                    onVideoUpdate();
                }
            }
        } catch (error) {
            console.error('Error uploading videos:', error);
            showNotification(
                error.response?.data?.message || 'Error uploading videos',
                'error'
            );
        } finally {
            setUploading(false);
            setUploadProgress({});
        }
    };

    const handleVideoDelete = async (videoId, index) => {
        if (!confirm('Are you sure you want to delete this video?')) return;

        setDeletingVideo(videoId);
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/admin/products/${productId}/videos/${videoId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                }
            );

            if (response.data.success) {
                // Add fade-out animation before removing
                const videoElement = document.querySelector(`[data-video-id="${videoId}"]`);
                if (videoElement) {
                    videoElement.classList.add('video-delete-animation');
                    setTimeout(() => {
                        setVideos(prev => prev.filter((_, i) => i !== index));
                        setVideoFiles(prev => prev.filter((_, i) => i !== index));
                        showNotification('Video deleted successfully', 'success');

                        // Refresh videos data to ensure consistency
                        setTimeout(() => {
                            fetchVideos();
                        }, 500);

                        if (onVideoUpdate) {
                            onVideoUpdate();
                        }
                    }, 300);
                } else {
                    setVideos(prev => prev.filter((_, i) => i !== index));
                    setVideoFiles(prev => prev.filter((_, i) => i !== index));
                    showNotification('Video deleted successfully', 'success');

                    // Refresh videos data to ensure consistency
                    setTimeout(() => {
                        fetchVideos();
                    }, 500);

                    if (onVideoUpdate) {
                        onVideoUpdate();
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting video:', error);
            showNotification(
                error.response?.data?.message || 'Error deleting video',
                'error'
            );
        } finally {
            setDeletingVideo(null);
        }
    };

    return (
        <div className="video-section-container">
            <div className="video-section-header">
                <h3 className="video-section-title">Product Videos</h3>
                <button
                    onClick={refreshVideos}
                    disabled={loading}
                    className="video-refresh-btn"
                    title="Refresh videos"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <RefreshCw size={16} />
                    )}
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="video-loading">
                    <Loader2 size={24} className="animate-spin" />
                    <span>Loading videos...</span>
                </div>
            )}

            {/* Video Upload */}
            <div className="video-upload-section">
                <label className={`video-upload-label ${uploading ? 'uploading' : ''}`}>
                    {uploading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Upload size={20} />
                    )}
                    <span>{uploading ? 'Uploading...' : 'Upload Videos'}</span>
                    <input
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>

                {/* Upload Progress */}
                {uploading && Object.keys(uploadProgress).length > 0 && (
                    <div className="upload-progress">
                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="progress-item">
                                <span className="progress-filename">{fileName}</span>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <span className="progress-percentage">{progress}%</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Grid */}
            {!loading && (
                <div className="video-grid">
                    {videos.length === 0 ? (
                        <div className="video-empty-state">
                        </div>
                    ) : (
                        videos.map((video, index) => (
                            <div
                                key={video.id}
                                className="video-item"
                                data-video-id={video.id}
                            >
                                <video
                                    src={`${import.meta.env.VITE_API_URL}${video.video_url}`}
                                    className="product-video"
                                    controls
                                    preload="metadata"
                                />
                                <div className="video-overlay">
                                    <button
                                        className={`video-delete-btn ${deletingVideo === video.id ? 'deleting' : ''}`}
                                        onClick={() => handleVideoDelete(video.id, index)}
                                        disabled={deletingVideo === video.id}
                                    >
                                        {deletingVideo === video.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                    <span className="video-order">{index + 1}</span>
                                </div>

                                {/* Delete Animation Overlay */}
                                {deletingVideo === video.id && (
                                    <div className="video-delete-overlay">
                                        <XCircle size={24} className="delete-icon" />
                                        <span>Deleting...</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}


        </div>
    );
};

export default VideoSection;
