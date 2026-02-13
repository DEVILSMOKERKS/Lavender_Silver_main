import React from "react";
import ProductCard from "./ProductCard";
import { getResponsiveImage } from "../../../utils/responsiveImage";

const ProductGrid = ({
    products,
    imageIndexes,
    cart,
    wishlist,
    API_BASE_URL,
    activeFilter,
    onPrevImage,
    onNextImage,
    onAddToCart,
    onAddToWishlist,
    onRemoveFromWishlist,
    onComparisonClick,
    onClearFilters,
}) => {
    // Image processing logic ko thoda saaf kiya taaki performance bani rahe
    const processProductImages = (product) => {
        let images = [];
        const productImgs = product.images || [];
        
        if (productImgs.length > 0) {
            images = productImgs.map((img) => {
                const imgUrl = typeof img === "object" ? img.image_url : img;
                if (!imgUrl) return "";

                const fullUrl = imgUrl.startsWith("https") ? imgUrl : `${API_BASE_URL}${imgUrl}`;

                if (fullUrl.includes("backend.pvjewellers.in") || fullUrl.includes("/products")) {
                    return getResponsiveImage(fullUrl, {
                        thumbnail: 300,
                        card: 300,
                        full: 300,
                        quality: 55,
                    }).src;
                }
                return fullUrl;
            });
        } else {
            const fallbackImg = product.image || product.img || "";
            images = [fallbackImg.startsWith("/") && !fallbackImg.startsWith("https") ? `${API_BASE_URL}${fallbackImg}` : fallbackImg];
        }
        return images;
    };

    const getProductPrice = (product) => {
        if (product.product_options?.[0]?.sell_price) return parseFloat(product.product_options[0].sell_price);
        return Number(product.final_price || product.value || product.total_rs || (typeof product.price === "string" ? product.price.replace(/[^\d.]/g, "") : product.price) || 0);
    };

    const getOriginalPrice = (product, productPrice) => {
        return Number(product.oldPrice || product.actual_price || product.product_options?.[0]?.actual_price || productPrice);
    };

    const isProductNew = (product) => {
        if (product.created_at) {
            return new Date(product.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        return product.isNew;
    };

    if (products.length === 0) {
        return (
            <div className="shop-no-products">
                <p className="shop-no-products-text">
                    {activeFilter === "new" ? "No new products found." : "No products found matching your filters."}
                </p>
                <button className="shop-clear-filters-btn" onClick={onClearFilters}>Clear Filters</button>
            </div>
        );
    }

    return (
        <div className="shop-product-grid">
            <div className="shop-product-grid-inner">
                {/* Ab yahan saare products ek hi container mein render honge */}
                {products.map((product) => {
                    const currentImageIdx = imageIndexes[product.id] || 0;
                    const images = processProductImages(product);
                    const inCart = cart.some((item) => item.id === product.id);
                    const inWishlist = wishlist.some((item) => item.id === product.id);
                    const productPrice = getProductPrice(product);
                    const originalPrice = getOriginalPrice(product, productPrice);
                    const isNew = isProductNew(product);

                    return (
                        <ProductCard
                            key={product.id}
                            product={product}
                            currentImageIdx={currentImageIdx}
                            images={images}
                            inCart={inCart}
                            inWishlist={inWishlist}
                            productPrice={productPrice}
                            originalPrice={originalPrice}
                            isNew={isNew}
                            API_BASE_URL={API_BASE_URL}
                            onPrevImage={onPrevImage}
                            onNextImage={onNextImage}
                            onAddToCart={onAddToCart}
                            onAddToWishlist={onAddToWishlist}
                            onRemoveFromWishlist={onRemoveFromWishlist}
                            onComparisonClick={onComparisonClick}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default ProductGrid;