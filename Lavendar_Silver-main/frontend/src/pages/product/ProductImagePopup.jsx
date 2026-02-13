import React, { useState, useRef } from "react";
import { FaChevronLeft, FaAngleRight } from "react-icons/fa";
import "./ProductImagePopup.css";

const ProductImagePopup = ({ images = [], initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [drag, setDrag] = useState({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });
    const imageRef = useRef(null);

    if (!images.length) return null;

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        setZoom(1);
        setDrag({ ...drag, x: 0, y: 0, lastX: 0, lastY: 0 });
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setZoom(1);
        setDrag({ ...drag, x: 0, y: 0, lastX: 0, lastY: 0 });
    };

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setZoom((z) => Math.min(z + 0.2, 3));
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setZoom((z) => Math.max(z - 0.2, 1));
        if (zoom <= 1.2) setDrag({ ...drag, x: 0, y: 0, lastX: 0, lastY: 0 });
    };

    const handleOverlayClick = () => {
        onClose && onClose();
    };

    // Drag to move image
    const handleMouseDown = (e) => {
        if (zoom === 1) return;
        e.preventDefault();
        setDrag({
            ...drag,
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
        });
    };
    const handleMouseMove = (e) => {
        if (!drag.isDragging) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        setDrag((d) => ({ ...d, x: d.lastX + dx, y: d.lastY + dy }));
    };
    const handleMouseUp = () => {
        if (!drag.isDragging) return;
        setDrag((d) => ({ ...d, isDragging: false, lastX: d.x, lastY: d.y }));
    };

    // Touch events for mobile
    const handleTouchStart = (e) => {
        if (zoom === 1) return;
        const touch = e.touches[0];
        setDrag({
            ...drag,
            isDragging: true,
            startX: touch.clientX,
            startY: touch.clientY,
        });
    };
    const handleTouchMove = (e) => {
        if (!drag.isDragging) return;
        const touch = e.touches[0];
        const dx = touch.clientX - drag.startX;
        const dy = touch.clientY - drag.startY;
        setDrag((d) => ({ ...d, x: d.lastX + dx, y: d.lastY + dy }));
    };
    const handleTouchEnd = () => {
        if (!drag.isDragging) return;
        setDrag((d) => ({ ...d, isDragging: false, lastX: d.x, lastY: d.y }));
    };

    // Reset drag on image change or zoom reset
    React.useEffect(() => {
        if (zoom === 1) setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });
    }, [currentIndex, zoom]);

    return (
        <div className="product-image-popup-overlay" onClick={handleOverlayClick}>
            <div className="product-image-popup-modal" onClick={(e) => e.stopPropagation()}>
                <button className="popup-close-btn" onClick={onClose} aria-label="Close">&times;</button>
                <div className="popup-image-stack">
                    <button className="popup-nav-btn left" onClick={handlePrev} aria-label="Previous">
                        <FaChevronLeft size={24} />
                    </button>
                    <div className="popup-image-container">
                        {images[currentIndex]?.type === 'video' ? (
                            <video
                                src={images[currentIndex].url}
                                controls
                                className="popup-video"
                            />
                        ) : (
                            <img
                                ref={imageRef}
                                src={images[currentIndex]?.url || images[currentIndex]}
                                alt="Product Preview"
                                className="popup-image"
                                style={{
                                    transform: `scale(${zoom}) translate(${drag.x / zoom}px, ${drag.y / zoom}px)`,
                                    cursor: zoom > 1 ? (drag.isDragging ? "grabbing" : "grab") : "auto"
                                }}
                                draggable={false}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            />
                        )}
                        {/* UI controls overlayed on image (only for images, not videos) */}
                        {images[currentIndex]?.type !== 'video' && (
                            <div className="popup-zoom-controls popup-zoom-controls-overlay">
                                <button onClick={handleZoomOut} disabled={zoom <= 1} aria-label="Zoom Out">-</button>
                                <span>{Math.round(zoom * 100)}%</span>
                                <button onClick={handleZoomIn} disabled={zoom >= 3} aria-label="Zoom In">+</button>
                            </div>
                        )}
                    </div>
                    <button className="popup-nav-btn right" onClick={handleNext} aria-label="Next">
                        <FaAngleRight size={28} />
                    </button>
                </div>
                {/* Thumbnails */}
                <div className="popup-thumbnails">
                    {images.map((item, idx) => (
                        <div
                            key={idx}
                            className={`popup-thumb-container ${idx === currentIndex ? "active" : ""}`}
                            onClick={() => { setCurrentIndex(idx); setZoom(1); }}
                        >
                            {item.type === 'video' ? (
                                <div className="popup-video-thumb">
                                    <div className="popup-video-placeholder">
                                        <div className="popup-video-play-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 5v14l11-7z" fill="white" />
                                            </svg>
                                        </div>
                                        <span className="popup-video-label">Video</span>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={item.url || item}
                                    alt={`thumb-${idx}`}
                                    className="popup-thumb"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductImagePopup;
