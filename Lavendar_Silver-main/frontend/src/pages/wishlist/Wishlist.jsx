import React from "react";
import "./wishlist.css";
import productImg from '../../assets/img/banner/rring.png';
import { Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { useWishlistCart } from '../../context/wishlistCartContext';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import axios from 'axios';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, addToCart, cart, removeFromCart } = useWishlistCart();
  const { user, token } = useUser();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const { showNotification } = useNotification();

  // Handle remove from wishlist
  const handleRemove = (id) => {
    try {
      removeFromWishlist(id);
    } catch (error) {
      console.error('Failed to remove product from wishlist:', error);
    }
  };

  // Handle add to cart
  const handleAddToCart = (item) => {
    try {
      const imageUrl = item.images && item.images.length > 0
        ? `${API_BASE_URL}${item.images[0]}`
        : productImg;
      addToCart({ ...item, image: imageUrl });
    } catch (error) {
      console.error('Failed to add product to cart:', error);
    }
  };

  // Handle remove from cart
  const handleRemoveFromCart = (cartItem) => {
    try {
      if (cartItem) {
        removeFromCart(cartItem.id);
      }
    } catch (error) {
      console.error('Failed to remove product from cart:', error);
    }
  };

  // Fetch products from API
  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const wishlistIds = Array.isArray(wishlist) ? wishlist.map(item => item.id) : [];

      if (!wishlistIds.length) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/products`, {
          params: { ids: wishlistIds.join(',') },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        const data = response.data?.data || response.data || [];
        // Ensure products have properly formatted images
        const productsWithFormattedImages = Array.isArray(data) ? data.map(product => {
          // Format images array if it exists
          if (product.images && Array.isArray(product.images)) {
            product.images = product.images.map(img => {
              if (typeof img === 'string') {
                return img.startsWith('http') || img.startsWith('data:')
                  ? img
                  : (img.startsWith('/') ? `${API_BASE_URL}${img}` : `${API_BASE_URL}/${img}`);
              } else if (img && img.image_url) {
                const url = img.image_url;
                return url.startsWith('http') || url.startsWith('data:')
                  ? url
                  : (url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`);
              }
              return img;
            });
          }
          // Format product_images array if it exists
          if (product.product_images && Array.isArray(product.product_images)) {
            product.product_images = product.product_images.map(img => {
              const url = img.image_url || img.url || img;
              if (typeof url === 'string') {
                return url.startsWith('http') || url.startsWith('data:')
                  ? url
                  : (url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`);
              }
              return img;
            });
          }
          return product;
        }) : [];
        setProducts(productsWithFormattedImages);
      } catch (err) {
        console.error('Error fetching wishlist products:', err);
        setError('Failed to load wishlist products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [wishlist, token, API_BASE_URL]);

  // Filter and map products with dynamic option details
  const wishlistIds = Array.isArray(wishlist) ? wishlist.map(item => item.id) : [];
  const filteredProducts = wishlistIds
    .map(id => {
      const product = products.find(p => p.id === id);
      const wishlistItem = wishlist.find(w => w.id === id);

      if (!product || !wishlistItem) return null;

      // Merge product data with wishlist item data including dynamic option details
      return {
        ...product,
        ...wishlistItem,
        // Dynamic option details from backend - proper checking without OR operations
        option_details: wishlistItem.option_details ? wishlistItem.option_details : {
          size: wishlistItem.size ? wishlistItem.size : '',
          weight: wishlistItem.weight ? wishlistItem.weight : '',
          dimensions: wishlistItem.dimensions ? wishlistItem.dimensions : '',
          metal_color: wishlistItem.metal_color ? wishlistItem.metal_color : '',
          gender: wishlistItem.gender ? wishlistItem.gender : '',
          occasion: wishlistItem.occasion ? wishlistItem.occasion : ''
        },
        product_option_id: wishlistItem.product_option_id
      };
    })
    .filter(Boolean);

  // Loading state
  if (loading) {
    return (
      <div className="wishlist-container">
        <h2 className="wishlist-title">MY WISHLIST</h2>
        <div className="wishlist-loading">
          <Loader2 size={32} className="animate-spin" />
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="wishlist-container">
        <h2 className="wishlist-title">MY WISHLIST</h2>
        <div className="wishlist-error">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="wishlist-retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!filteredProducts.length) {
    return (
      <div className="mainwishlist-empty-container">
        <img src={productImg} alt="product" className="mainwishlist-empty-img" loading="lazy" decoding="async" />
        <h2 className="mainwishlist-empty-title">Your Wishlist is Empty</h2>
        <p className="mainwishlist-empty-desc">
          Looks like you haven&apos;t added anything to your wishlist yet.
          Start exploring our beautiful jewellery collection and add your favorites!
        </p>
        <Link to="/" className="mainwishlist-empty-btn">
          Explore Collection
        </Link>
      </div>
    );
  }

  // Render wishlist items
  return (
    <div className="wishlist-container">
      <h2 className="wishlist-title">
        MY WISHLIST
        <span className="wishlist-count">
          ({filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'})
        </span>
      </h2>

      <div className={filteredProducts.length === 2 ? "wishlist-grid two-cards" : "wishlist-grid"}>
        {filteredProducts.map((item) => {
          // Dynamic pricing from backend - prioritize sell_price from product options

          // Get the selected product option
          const selectedOption = item.product_options && item.product_options.length > 0 ? item.product_options[0] : null;

          let sellPrice = 0;
          if (selectedOption && selectedOption.sell_price) {
            sellPrice = Number(selectedOption.sell_price);
          } else if (selectedOption && selectedOption.value) {
            sellPrice = Number(selectedOption.value);
          } else if (item.sell_price) {
            sellPrice = Number(item.sell_price);
          } else if (item.final_price) {
            sellPrice = Number(item.final_price);
          } else if (item.value) {
            sellPrice = Number(item.value);
          } else if (item.total_rs) {
            sellPrice = Number(item.total_rs);
          } else if (item.price) {
            sellPrice = typeof item.price === 'string' ? Number(item.price.replace(/[^\d.]/g, '')) : Number(item.price);
          }

          // Get dynamic option details - use product_options if option_details is not available
          const optionDetails = item.option_details ? item.option_details : {};

          // Check if option details has actual values (not just empty strings)
          const hasValidOptionDetails = optionDetails && Object.values(optionDetails).some(value => value && value.trim() !== '');

          // If no valid option details but we have product options, use product options data
          const finalOptionDetails = hasValidOptionDetails ? optionDetails : (selectedOption ? {
            size: selectedOption.size || '',
            weight: selectedOption.weight || '',
            dimensions: selectedOption.dimensions || '',
            metal_color: selectedOption.metal_color || '',
            gender: selectedOption.gender || '',
            occasion: selectedOption.occasion || ''
          } : {});

          // Check if item is in cart
          const inCart = Array.isArray(cart) && cart.some(cartItem => cartItem.id === item.id);
          const cartItem = Array.isArray(cart) ? cart.find(cartItem => cartItem.id === item.id) : null;

          let productImage = productImg;
          // Get product image - handle multiple possible image sources
          // 1. Check if item.image exists and is a valid URL
          if (item.image) {
            // If image is already a full URL, use it; otherwise prepend API_BASE_URL
            productImage = item.image.startsWith('http') || item.image.startsWith('data:')
              ? item.image
              : (item.image.startsWith('/') ? `${API_BASE_URL}${item.image}` : `${API_BASE_URL}/${item.image}`);
          }
          // 2. Check product_images array (from product API response)
          else if (item.product_images && Array.isArray(item.product_images) && item.product_images.length > 0) {
            const firstImage = item.product_images[0];
            const imageUrl = firstImage.image_url || firstImage.url || firstImage;
            productImage = imageUrl.startsWith('http') || imageUrl.startsWith('data:')
              ? imageUrl
              : (imageUrl.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`);
          }
          // 3. Check images array (string array)
          else if (item.images && Array.isArray(item.images) && item.images.length > 0) {
            const imageUrl = item.images[0];
            productImage = imageUrl.startsWith('http') || imageUrl.startsWith('data:')
              ? imageUrl
              : (imageUrl.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`);
          }
          // 4. Check image_url (from wishlist API)
          else if (item.image_url) {
            const imageUrl = item.image_url;
            productImage = imageUrl.startsWith('http') || imageUrl.startsWith('data:')
              ? imageUrl
              : (imageUrl.startsWith('/') ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`);
          }
          // 5. Fallback to placeholder
          else {
            productImage = productImg;
          }

          return (
            <div className="wishlist-card" key={item.id}>
              {/* Div 1: Image Section */}
              <div className="wishlist-image-div">
                {item.slug ? (
                  <Link to={`/product/${item.slug}`} className="wishlist-card-img-link">
                    <img
                      src={productImage}
                      alt={item.item_name || item.name || 'Product'}
                      className="wishlist-img wishlist-card-img-hover"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        if (e.target.src !== productImg) {
                          e.target.src = productImg;
                        }
                      }}
                    />
                  </Link>
                ) : (
                  <img
                    src={productImage}
                    alt={item.item_name}
                    className="wishlist-img wishlist-card-img-hover"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Div 2: Content Section */}
              <div className="wishlist-content-div">
                <div className="wishlist-product-info">
                  <h3 className="wishlist-product-name" title={item.name}>
                    {item.item_name}
                  </h3>
                  <p className="wishlist-collection" title={item.collection || item.category || ''}>
                    {item.collection || item.category || ''}
                  </p>
                  {item.stamp && (
                    <p className="wishlist-stamp" title={item.stamp}>
                      Stamp: {item.stamp}
                    </p>
                  )}
                </div>

                <div className="wishlist-pricing-section">
                  {sellPrice && (
                    <span className="wishlist-price">
                      ₹{sellPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="wishlist-mrp-text">
                  <span className="wishlist-mrp">MRP incl. of all taxes</span>
                </div>

                {/* Dynamic Option Details */}
                {(finalOptionDetails.size || finalOptionDetails.weight) && (
                  <div className="wishlist-option-details">
                    {finalOptionDetails.size && <span className="wishlist-option-tag">Size: {finalOptionDetails.size}</span>}
                    {finalOptionDetails.weight && <span className="wishlist-option-tag">Weight: {finalOptionDetails.weight}</span>}
                  </div>
                )}
              </div>

              {/* Div 3: Icons Section */}
              <div className="wishlist-icons-div">
                {/* Remove from Wishlist Icon */}
                <button
                  className="wishlist-remove-btn"
                  title="Remove from Wishlist"
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove from Wishlist"
                >
                  <span className="wishlist-trash-icon-bg">
                    <Trash2 size={18} color="#fff" strokeWidth={2.2} />
                  </span>
                </button>

                {/* Add/Remove from Cart Icon */}
                {(!item?.pieces || item.pieces === 0) ? (
                  <button
                    className="wishlist-card-cart-btn"
                    aria-label="Out of Stock"
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    title="Out of Stock"
                  >
                    <ShoppingCart
                      className="wishlist-card-cart-icon"
                      size={18}
                      color="#fff"
                      strokeWidth={2.2}
                      style={{ opacity: 0.5 }}
                    />
                  </button>
                ) : !inCart ? (
                  <button
                    className="wishlist-card-cart-btn"
                    aria-label="Add to Cart"
                    onClick={() => handleAddToCart(item)}
                    title="Add to Cart"
                  >
                    <ShoppingCart
                      className="wishlist-card-cart-icon"
                      size={18}
                      color="#fff"
                      strokeWidth={2.2}
                    />
                  </button>
                ) : (
                  <button
                    className="wishlist-card-remove-btn"
                    aria-label="Remove from Cart"
                    onClick={() => handleRemoveFromCart(cartItem)}
                    title="Remove from Cart"
                  >
                    <ShoppingCart
                      size={18}
                      color="#fff"
                      strokeWidth={2.2}
                      fill="currentColor"
                    />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;