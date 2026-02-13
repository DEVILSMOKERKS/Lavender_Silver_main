
import React from 'react';
import ResponsiveImage from './ResponsiveImage';

// Example 1: Product Listing (Thumbnails - 300px)
export function ProductListingExample({ products }) {
    return (
        <div className="product-grid">
            {products.map(product => (
                <div key={product.id} className="product-item">
                    <ResponsiveImage
                        src={product.image}
                        type="thumbnail"
                        alt={product.name}
                        className="product-thumbnail"
                        loading="lazy"
                    />
                    <h3>{product.name}</h3>
                </div>
            ))}
        </div>
    );
}

// Example 2: Product Cards (600px)
export function ProductCardExample({ products }) {
    return (
        <div className="product-cards">
            {products.map(product => (
                <div key={product.id} className="product-card">
                    <ResponsiveImage
                        src={product.image}
                        type="card"
                        alt={product.name}
                        className="card-image"
                        loading="lazy"
                    />
                    <div className="card-content">
                        <h3>{product.name}</h3>
                        <p>{product.price}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Example 3: Full Product Page (1900px)
export function ProductDetailExample({ product }) {
    return (
        <div className="product-detail">
            <ResponsiveImage
                src={product.mainImage}
                type="full"
                alt={product.name}
                className="product-hero-image"
                loading="eager"  // Hero image should load immediately
            />
            <div className="product-info">
                <h1>{product.name}</h1>
                <p>{product.description}</p>
            </div>
        </div>
    );
}

// Example 4: Automatic Responsive (All Sizes)
export function ResponsiveGalleryExample({ images }) {
    return (
        <div className="image-gallery">
            {images.map((image, index) => (
                <ResponsiveImage
                    key={index}
                    src={image.url}
                    type="responsive"  // Automatically uses all sizes
                    alt={image.alt}
                    className="gallery-image"
                    loading={index === 0 ? "eager" : "lazy"}  // First image eager, rest lazy
                />
            ))}
        </div>
    );
}

// Example 5: With Backend API Images
export function BackendImageExample({ product }) {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    return (
        <div className="product">
            {/* Backend images automatically get optimized */}
            <ResponsiveImage
                src={`${API_BASE_URL}${product.image_url}`}
                type="card"
                alt={product.name}
                className="product-image"
            />
        </div>
    );
}

