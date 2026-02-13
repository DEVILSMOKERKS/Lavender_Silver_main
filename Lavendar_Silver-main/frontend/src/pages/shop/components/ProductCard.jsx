import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { getResponsiveImage } from "../../../utils/responsiveImage";
import compareIcon from "../../../assets/img/icons/compareIcon.png";

const ProductCard = ({
    product,
    currentImageIdx,
    images,
    inCart,
    inWishlist,
    productPrice,
    originalPrice,
    isNew,
    API_BASE_URL,
    onPrevImage,
    onNextImage,
    onAddToCart,
    onAddToWishlist,
    onRemoveFromWishlist,
    onComparisonClick,
}) => {
    const cleanProductName = (name) => {
        if (!name) return "";
        let cleanName = name.replace(/\.{3,}$/, "").trim();
        const words = cleanName.split(/\s+/).filter(Boolean);
        return words.length > 15 ? words.slice(0, 15).join(" ") + "..." : cleanName;
    };

    const getImageSrcSet = (imageUrl) => {
        if (
            imageUrl?.includes("backend.pvjewellers.in") ||
            imageUrl?.includes("/products")
        ) {
            return getResponsiveImage(imageUrl.split("?")[0] || "", {
                thumbnail: 300,
                card: 500,
                full: 650,
                quality: 55,
            }).srcSet;
        }
        return undefined;
    };

    const discountPercentage = originalPrice > productPrice 
        ? Math.round(((originalPrice - productPrice) / originalPrice) * 100)
        : 0;
    const isBestseller = product.bestseller || product.rating > 4.5 || (product.review_count || 0) > 100;

    return (
        <div className="shop-product-card">
            <div className="shop-product-image-wrapper">
                {isBestseller && (
                    <div className="shop-product-bestseller-tag">Bestseller</div>
                )}
                <Link to={`/product/${product.slug || product.id}`}>
                    <img
                        src={images[currentImageIdx] || images[0] || ""}
                        srcSet={getImageSrcSet(images[currentImageIdx] || images[0])}
                        sizes="(max-width: 768px) 300px, 500px"
                        alt={product.item_name}
                        className="shop-product-image"
                        width="300"
                        height="300"
                        loading="lazy"
                        decoding="async"
                    />
                </Link>
                {isNew && <span className="shop-product-badge">Latest</span>}
                <button
                    className={`shop-wishlist-btn${inWishlist ? " active" : ""}`}
                    onClick={() =>
                        inWishlist ? onRemoveFromWishlist(product.id) : onAddToWishlist(product)
                    }
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart
                        className={`shop-wishlist-icon${inWishlist ? " shop-wishlist-icon-active" : ""
                            }`}
                    />
                </button>
                <div className="shop-nav-arrow shop-nav-arrow-left">
                    <button
                        className="shop-nav-arrow-btn"
                        onClick={() => onPrevImage(product.id, images.length)}
                    >
                        <ChevronLeft className="shop-nav-arrow-icon" />
                    </button>
                </div>
                <div className="shop-nav-arrow shop-nav-arrow-right">
                    <button
                        className="shop-nav-arrow-btn"
                        onClick={() => onNextImage(product.id, images.length)}
                    >
                        <ChevronRight className="shop-nav-arrow-icon" />
                    </button>
                </div>
                <div
                    className="shop-compare-icon-wrapper"
                    onClick={(e) => onComparisonClick(e, product)}
                    style={{ cursor: "pointer" }}
                >
                    <img src={compareIcon} alt="Compare" className="shop-compare-icon" />
                </div>
            </div>
            <div className="shop-product-info">
                <div className="shop-product-name-row">
                    <h3 className="shop-product-title">{cleanProductName(product.item_name)}</h3>
                    <div className="shop-product-rating">
                        <span className="shop-product-rating-number">
                            {product.rating ? product.rating.toFixed(1) : '4.5'}
                        </span>
                        <Star className="shop-star-icon shop-star-icon-filled" size={14} />
                        <span className="shop-product-rating-value">
                            ({product.review_count || product.ratingCount || 0})
                        </span>
                    </div>
                </div>
                <p className="shop-product-description">
                    {product.description || "Exquisite jewellery crafted with premium materials"}
                </p>
                <div className="shop-product-price-row">
                    <div>
                        <span className="shop-product-price">₹{productPrice.toLocaleString()}</span>
                        {originalPrice > productPrice && (
                            <>
                                <span className="shop-product-old-price">
                                    ₹{originalPrice.toLocaleString()}
                                </span>
                                {discountPercentage > 0 && (
                                    <div className="shop-product-coupon-text">
                                        EXTRA {discountPercentage}% OFF with coupon
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className="shop-product-actions">
                    {!product?.pieces || product.pieces === 0 ? (
                        <button
                            className="shop-add-to-cart-btn"
                            disabled
                            style={{ opacity: 0.6, cursor: "not-allowed" }}
                        >
                            <ShoppingCart className="shop-add-to-cart-icon" />
                            <span> Out of Stock</span>
                        </button>
                    ) : inCart ? (
                        <Link to="/carts" className="shop-add-to-cart-btn">
                            <ShoppingCart className="shop-add-to-cart-icon" />
                            <span> Go to Cart</span>
                        </Link>
                    ) : (
                        <button
                            className="shop-add-to-cart-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAddToCart(product);
                            }}
                            type="button"
                        >
                            <ShoppingCart className="shop-add-to-cart-icon" />
                            <span> Add to Cart</span>
                        </button>
                    )}
                    <button
                        className={`shop-wishlist-btn${inWishlist ? " active" : ""}`}
                        onClick={() =>
                            inWishlist
                                ? onRemoveFromWishlist(product.id)
                                : onAddToWishlist(product)
                        }
                        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <Heart
                            className={`shop-wishlist-icon${inWishlist ? " shop-wishlist-icon-active" : ""
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;

