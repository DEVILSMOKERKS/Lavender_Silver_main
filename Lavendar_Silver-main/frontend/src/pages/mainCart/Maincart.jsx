import React, { useEffect } from "react";
import "./maincart.css";
import productImg from '../../assets/img/Two-golden-rings-on-a-soft-surface-with-flowers.jpg';
import { Truck, ShieldCheck } from 'lucide-react';
import { Plus, Minus } from "lucide-react";
import YouMayAlsoLike from "./YouMayAlsoLike";
import { Link, useNavigate } from "react-router-dom";
import { useWishlistCart } from '../../context/wishlistCartContext';
import { FaVideo } from "react-icons/fa6";
import videoIcon from "../../assets/img/icons/video.png";
import { useUser } from '../../context/UserContext';
import axios from 'axios';

const Maincart = () => {
  const {
    cart,
    removeFromCart,
    videoCart,
    addToVideoCart,
    removeFromVideoCart,
    updateCartQuantity,
    loading: cartLoading,
    cartItemCount,
  } = useWishlistCart();
  const { token } = useUser();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Create a stable cart signature to track changes without causing unnecessary re-renders
  const cartSignature = React.useMemo(() => {
    if (!Array.isArray(cart) || cart.length === 0) return '';
    // Create signature from product IDs and quantities to detect any changes
    return cart
      .map(item => `${item.product_id || item.id || item.cart_item_id}:${item.quantity || 1}`)
      .sort()
      .join('|');
  }, [cart]);

  const fetchProducts = React.useCallback(async () => {
    // Prevent fetching if cart is empty or still loading
    if (!Array.isArray(cart) || cart.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Extract product IDs - handle both product_id and id fields
    const ids = cart
      .map(item => item.product_id || item.id)
      .filter(Boolean)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/products`, {
        params: { ids: ids.join(',') },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = res.data?.data || [];
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      // Don't clear products on error - keep existing data
      // setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [cart, token, API_BASE_URL]);

  // Auto-refresh when cart signature changes (items or quantities)
  useEffect(() => {
    // Only fetch if cart has items and signature has changed
    if (cartSignature) {
      fetchProducts();
    } else if (Array.isArray(cart) && cart.length === 0) {
      // Cart is empty, clear products
      setProducts([]);
      setLoading(false);
    }
  }, [cartSignature, fetchProducts, cart]);


  // Create cart map that supports multiple ID formats (id, product_id, cart_item_id)
  const cartMap = React.useMemo(() => {
    if (!Array.isArray(cart)) return {};
    const map = {};
    cart.forEach(item => {
      // Use product_id as primary key for matching with products
      const key = item.product_id || item.id;
      if (key) {
        map[key] = item;
      }
    });
    return map;
  }, [cart]);

  // Get product IDs from cart (prioritize product_id)
  const cartProductIds = React.useMemo(() => {
    if (!Array.isArray(cart)) return [];
    return cart
      .map(item => item.product_id || item.id)
      .filter(Boolean)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
  }, [cart]);

  // Merge cart items with product data
  const filteredProducts = React.useMemo(() => {
    return cartProductIds
      .map(productId => {
        const prod = products.find(p => p.id === productId);
        const cartItem = cartMap[productId];

        // Wait for product data to load
        if (!prod || !cartItem) return null;

        const optionDetails = cartItem.option_details || {};

        return {
          ...prod,
          ...cartItem,
          id: productId, // Ensure consistent ID
          price: cartItem.price || prod.price,
          oldPrice: prod.oldPrice,
          option_details: optionDetails,
          product_option_id: cartItem.product_option_id,
          quantity: cartItem.quantity || 1
        };
      })
      .filter(Boolean);
  }, [cartProductIds, products, cartMap]);

  // Handlers - no manual fetchProducts needed, useEffect handles auto-refresh
  const handleRemove = async (id) => {
    // Use product_id if available, otherwise use id
    const itemToRemove = cart.find(item =>
      item.id === id ||
      item.product_id === id ||
      item.cart_item_id === id
    );
    const removeId = itemToRemove?.product_id || itemToRemove?.id || id;
    await removeFromCart(removeId, true);
    // Auto-refresh handled by useEffect watching cartSignature
  };

  const handleIncrease = async (item) => {
    // Use product_id if available, otherwise use id
    const updateId = item.product_id || item.id;
    const currentQuantity = Number(item.quantity) || 1;
    await updateCartQuantity(updateId, currentQuantity + 1);
    // Auto-refresh handled by useEffect watching cartSignature
  };

  const handleDecrease = async (item) => {
    const currentQuantity = Number(item.quantity) || 1;
    if (currentQuantity > 1) {
      const updateId = item.product_id || item.id;
      await updateCartQuantity(updateId, currentQuantity - 1);
    } else {
      const removeId = item.product_id || item.id;
      await removeFromCart(removeId, true);
    }
    // Auto-refresh handled by useEffect watching cartSignature
  };

  // Empty cart UI
  if (!loading && !cartLoading && filteredProducts.length === 0) {
    return (
      <>
        <div className="maincart-empty-container">
          <img src={productImg} alt="product" className="maincart-empty-img" loading="lazy" decoding="async" />
          <h2 className="maincart-empty-title">Your Cart is Empty</h2>
          <p className="maincart-empty-desc">Looks like you haven&apos;t added anything to your cart yet. Start exploring our beautiful jewellery collection and add your favorites!</p>
          <Link to="/" className="maincart-empty-btn">Go to Homepage</Link>
        </div>
        <YouMayAlsoLike />
      </>
    );
  }

  if (loading || cartLoading) {
    return <div className="maincart-container"><h2 className="maincart-title">Your Shopping Cart</h2><div>Loading...</div></div>;
  }

  // Calculate labour cost for a single product (same logic as Checkout.jsx)
  const calculateLabourCost = (product) => {
    if (!product) return 0;

    const labourType = product.labour_on || "Wt";
    const labourValue = parseFloat(product.labour) || 0;

    if (labourValue <= 0) return 0;

    // Calculate net weight for labour calculation (Net Weight + Additional Weight)
    const grossWeight = parseFloat(product.gross_weight) || 0;
    const lessWeight = parseFloat(product.less_weight) || 0;
    const additionalWeight = parseFloat(product.additional_weight) || 0;
    const netWeight = grossWeight - lessWeight + additionalWeight;

    let labourCost = 0;

    switch (labourType) {
      case "Wt":
        // Weight Type: labour_value × net_weight (including additional weight)
        if (labourValue > 0 && netWeight > 0) {
          labourCost = labourValue * netWeight;
        }
        break;

      case "Fl":
        // Flat Type: Direct labour_value amount
        labourCost = labourValue;
        break;

      case "Pc":
        // Percentage Type: (net_weight × labour_percentage_value) × rate (including additional weight)
        if (labourValue > 0 && netWeight > 0) {
          const rate = parseFloat(product.rate) || 0;
          if (rate > 0) {
            // Calculate only labour portion: net_weight × labour_percentage_value
            const labourWeight = netWeight * (labourValue / 100);
            // Labour cost = labour weight × rate
            labourCost = labourWeight * rate;
          }
        }
        break;

      default:
        labourCost = 0;
    }

    return parseFloat(labourCost.toFixed(2));
  };

  // Calculate subtotal (product prices only)
  const subtotal = filteredProducts.reduce((sum, item) => {
    let price = 0;

    const selectedOption = item.product_options && item.product_options.length > 0 ? item.product_options[0] : null;
    if (selectedOption && selectedOption.sell_price) {
      price = Number(selectedOption.sell_price);
    } else if (selectedOption && selectedOption.value) {
      price = Number(selectedOption.value);
    } else if (item.sell_price) {
      price = Number(item.sell_price);
    } else if (item.total_rs) {
      price = Number(item.total_rs);
    } else if (item.final_price) {
      price = Number(item.final_price);
    } else if (item.value) {
      price = Number(item.value);
    } else if (item.rate) {
      price = Number(item.rate);
    } else if (item.price) {
      price = typeof item.price === 'string' ?
        Number(item.price.replace(/[^\d.]/g, '')) :
        Number(item.price);
    }

    const quantity = Number(item.quantity) || 1;
    const itemTotal = price * quantity;

    return sum + itemTotal;
  }, 0);

  // Calculate total making charges
  const totalMakingCharges = filteredProducts.reduce((sum, item) => {
    const itemLabourCost = calculateLabourCost(item);
    const quantity = Number(item.quantity) || 1;
    return sum + (itemLabourCost * quantity);
  }, 0);

  const hasMakingCharges = totalMakingCharges > 0;
  const grandTotal = subtotal + totalMakingCharges;


  return (
    <>
      <div className="maincart-container">
        <h2 className="maincart-title">
          Your Shopping Cart <span className="maincart-item-count">({cartItemCount} Item{cartItemCount !== 1 ? 's' : ''})</span>
        </h2>
        <div className="maincart-content">
          <div className="maincart-cartbox">
            <div className="maincart-cart-header">
              <span>PRODUCT</span>
              <span>QUANTITY</span>
              <span>PRICE</span>
              <span>TOTAL</span>
            </div>
            {filteredProducts.map((item) => {
              const selectedOption = item.product_options && item.product_options.length > 0 ? item.product_options[0] : null;

              let sellPrice = 0;
              if (selectedOption && selectedOption.sell_price) {
                sellPrice = Number(selectedOption.sell_price);
              } else if (selectedOption && selectedOption.value) {
                sellPrice = Number(selectedOption.value);
              } else if (item.sell_price) {
                sellPrice = Number(item.sell_price);
              } else if (item.total_rs) {
                sellPrice = Number(item.total_rs);
              } else if (item.final_price) {
                sellPrice = Number(item.final_price);
              } else if (item.value) {
                sellPrice = Number(item.value);
              } else if (item.rate) {
                sellPrice = Number(item.rate);
              } else if (item.price) {
                sellPrice = typeof item.price === 'string' ? Number(item.price.replace(/[^\d.]/g, '')) : Number(item.price);
              }

              const actualPrice = Number(item.oldPrice || sellPrice || 0);
              const quantity = Number(item.quantity) || 1;
              const total = sellPrice * quantity;
              const discountPercent = actualPrice && sellPrice && actualPrice > sellPrice ? Math.round(100 - (sellPrice / actualPrice) * 100) : null;
              let imgSrc = productImg;
              if (item.images && item.images.length > 0) {
                if (typeof item.images[0] === 'string') {
                  imgSrc = `${API_BASE_URL}${item.images[0]}`;
                } else if (item.images[0].image_url) {
                  imgSrc = `${API_BASE_URL}${item.images[0].image_url}`;
                }
              } else if (item.image) {
                imgSrc = item.image;
              }
              const size = selectedOption ? (selectedOption.size || '') : '';
              const sizeDisplay = (typeof size === 'string' && size.trim()) ? size.trim() : null;
              const colour = selectedOption ? (selectedOption.metal_color || '') : '';
              const colourDisplay = (typeof colour === 'string' && colour.trim()) ? colour.trim() : null;
              // Weight: from product_options or net_weight (API: weight, net_weight)
              const weight = (selectedOption && selectedOption.weight) ? parseFloat(selectedOption.weight) : parseFloat(item.net_weight);
              const weightDisplay = (weight !== undefined && !Number.isNaN(weight) && weight > 0) ? `${Number(weight).toFixed(3)} ${item.unit || 'g'}` : null;
              // Purity: stamp (e.g. "24K / 999") or tunch % (API: stamp, tunch)
              const purityDisplay = item.stamp || (item.tunch && parseFloat(item.tunch) > 0 ? `${parseFloat(item.tunch).toFixed(2)}%` : null) || null;
              // Metal Type: from product options or product metal_type
              const metalType = selectedOption ? (selectedOption.metal_color || item.metal_type || '') : (item.metal_type || '');
              const metalTypeDisplay = (typeof metalType === 'string' && metalType.trim()) ? metalType.trim() : null;
              // Dimensions: from product options
              const dimensions = selectedOption ? (selectedOption.dimensions || '') : '';
              const dimensionsDisplay = (typeof dimensions === 'string' && dimensions.trim()) ? dimensions.trim() : null;
              // Gender: from product options
              const gender = selectedOption ? (selectedOption.gender || '') : '';
              const genderDisplay = (typeof gender === 'string' && gender.trim()) ? gender.trim() : null;
              // Metal Name: from product data
              const metalName = item.metal_type_name || item.metal_name || '';
              const metalNameDisplay = (typeof metalName === 'string' && metalName.trim()) ? metalName.trim() : null;
              // Calculate labour cost for this item
              const itemLabourCost = calculateLabourCost(item);

              const itemLabourTotal = itemLabourCost * quantity;
              const hasItemLabour = itemLabourCost > 0;

              return (
                <div className="maincart-cart-item" key={item.id}>
                  <div className="maincart-cart-item-mobile">
                    <div className="maincart-mobile-row">
                      <Link to={`/product/${item.slug || ''}`}>
                        <img
                          src={imgSrc}
                          alt="Product"
                          className="maincart-product-img"
                        />
                      </Link>
                      <button className="maincart-remove" onClick={() => handleRemove(item.id)}>×</button>
                      <div className="maincart-mobile-info">
                        <div className="maincart-collection maincart-attrs-title">{item.item_name || item.name}</div>
                        <div className="maincart-mobile-pricing">
                          <span className="maincart-mobile-price">₹{sellPrice.toLocaleString()}</span>
                          {discountPercent && discountPercent > 0 && (
                            <span className="maincart-mobile-discount">{discountPercent}% OFF</span>
                          )}
                        </div>
                        <div className="maincart-mobile-attrs">
                          {metalNameDisplay && <div className="maincart-product-attr"><strong>Metal:</strong> {metalNameDisplay}</div>}
                          {weightDisplay && <div className="maincart-product-attr"><strong>Weight:</strong> {weightDisplay}</div>}
                          {purityDisplay && <div className="maincart-product-attr"><strong>Purity:</strong> {purityDisplay}</div>}
                          {sizeDisplay && <div className="maincart-product-attr"><strong>Size:</strong> {sizeDisplay}</div>}
                          {colourDisplay && <div className="maincart-product-attr"><strong>Gold Color:</strong> {colourDisplay}</div>}
                          {dimensionsDisplay && <div className="maincart-product-attr"><strong>Dimensions:</strong> {dimensionsDisplay}</div>}
                          {genderDisplay && <div className="maincart-product-attr"><strong>Gender:</strong> {genderDisplay}</div>}
                          {hasItemLabour && <div className="maincart-product-attr"><strong>Making Charge:</strong> ₹{itemLabourTotal.toLocaleString()}</div>}
                          <div className="maincart-product-attr"><strong>Quantity:</strong> {quantity}</div>
                          {/* Price below quantity - not needed per requirement
                          <div className="maincart-product-attr"><strong>Price:</strong> ₹{sellPrice.toLocaleString()}</div>
                          */}
                        </div>
                      </div>
                    </div>
                    <div className="maincart-mobile-bottomrow">
                      <div className="maincart-qty">
                        <button className="maincart-qty-btn" onClick={() => handleDecrease(item)} disabled={quantity <= 1}><Minus size={18} /></button>
                        <span className="maincart-qty-value">{quantity}</span>
                        <button className="maincart-qty-btn" onClick={() => handleIncrease(item)}><Plus size={18} /></button>
                      </div>
                      <div className="maincart-mobile-total">
                        <div>₹{(total + (hasItemLabour ? itemLabourTotal : 0)).toLocaleString()}</div>
                        {hasItemLabour && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            (Product: ₹{total.toLocaleString()} + Making: ₹{itemLabourTotal.toLocaleString()})
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="maincart-product-offer-row">
                      <button
                        className={`maincart-video-btn${videoCart.some(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null))) ? ' active' : ''}`}
                        onClick={() => {
                          const videoCartItem = videoCart.find(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null)));
                          if (videoCartItem) {
                            removeFromVideoCart(videoCartItem.id || videoCartItem.product_id || item.id);
                          } else {
                            const productForVideoCart = {
                              ...item,
                              product_id: item.id || item.product_id,
                              product_option_id: selectedOption?.id || null
                            };
                            addToVideoCart(productForVideoCart);
                          }
                        }}
                        aria-label={videoCart.some(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null))) ? 'Remove from video' : 'Add to video'}
                        type="button"
                      >
                        {videoCart.some(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null))) ? (
                          <FaVideo size={18} color="var(--pvj-green)" />
                        ) : (
                          <img src={videoIcon} alt="video" style={{ width: 18, height: 18 }} loading="lazy" />
                        )}
                        <span style={{ fontSize: '12px', marginLeft: '6px' }}>
                          Video Cart
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="maincart-product-info">
                    <Link to={`/product/${item.slug || ''}`}>
                      <img
                        src={imgSrc}
                        alt="Product"
                        className="maincart-product-img"
                      />
                    </Link>
                    <div className="maincart-product-details">
                      <div className="maincart-attrs-title"><strong>Title:</strong> {item.item_name || item.name}</div>
                      {metalNameDisplay && <div className="maincart-product-attr"><strong>Metal:</strong> {metalNameDisplay}</div>}
                      {weightDisplay && <div className="maincart-product-attr"><strong>Weight:</strong> {weightDisplay}</div>}
                      {purityDisplay && <div className="maincart-product-attr"><strong>Purity:</strong> {purityDisplay}</div>}
                      {sizeDisplay && <div className="maincart-product-attr"><strong>Size:</strong> {sizeDisplay}</div>}
                      {colourDisplay && <div className="maincart-product-attr"><strong>Gold Color:</strong> {colourDisplay}</div>}
                      {dimensionsDisplay && <div className="maincart-product-attr"><strong>Dimensions:</strong> {dimensionsDisplay}</div>}
                      {genderDisplay && <div className="maincart-product-attr"><strong>Gender:</strong> {genderDisplay}</div>}
                      {hasItemLabour && <div className="maincart-product-attr"><strong>Making Charge:</strong> ₹{itemLabourTotal.toLocaleString()}</div>}
                      <div className="maincart-product-attr"><strong>Quantity:</strong> {quantity}</div>
                      {/* Price below quantity - not needed per requirement
                      <div className="maincart-product-attr"><strong>Price:</strong> ₹{sellPrice.toLocaleString()}</div>
                      */}
                    </div>
                  </div>
                  <div className="maincart-qty">
                    <button className="maincart-qty-btn" onClick={() => handleDecrease(item)} disabled={quantity <= 1}><Minus size={18} /></button>
                    <span className="maincart-qty-value">{quantity}</span>
                    <button className="maincart-qty-btn" onClick={() => handleIncrease(item)}><Plus size={18} /></button>
                  </div>
                  <div className="maincart-price">₹{sellPrice.toLocaleString()}</div>
                  <div className="maincart-total">
                    <div>₹{(total + (hasItemLabour ? itemLabourTotal : 0)).toLocaleString()}</div>
                    {hasItemLabour && (
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                        (₹{total.toLocaleString()} + ₹{itemLabourTotal.toLocaleString()})
                      </div>
                    )}
                  </div>
                  <button className="maincart-remove" onClick={() => handleRemove(item.id)}>×</button>
                  <div className="maincart-product-offer-row">
                    <button
                      className={`maincart-video-btn${videoCart.some(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null))) ? ' active' : ''}`}
                      onClick={() => {
                        const videoCartItem = videoCart.find(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null)));
                        if (videoCartItem) {
                          removeFromVideoCart(videoCartItem.id || videoCartItem.product_id || item.id);
                        } else {
                          const productForVideoCart = {
                            ...item,
                            product_id: item.id || item.product_id,
                            product_option_id: selectedOption?.id || null
                          };
                          addToVideoCart(productForVideoCart);
                        }
                      }}
                      aria-label={videoCart.some(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null))) ? 'Remove from video' : 'Add to video'}
                      style={{ marginLeft: 12 }}
                      type="button"
                    >
                      {videoCart.some(v => (v.id === item.id || v.product_id === item.id) && (v.product_option_id === (selectedOption?.id || null))) ? (
                        <FaVideo size={22} color="var(--green-primary)" />
                      ) : (
                        <img src={videoIcon} alt="video" style={{ width: 22, height: 22 }} loading="lazy" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="maincart-features">
              <div className="maincart-feature-badge">
                <ShieldCheck />
                Certified Jewellery
              </div>
              <div className="maincart-feature-badge">
                <Truck />
                Free Delivery
              </div>
            </div>
          </div>
          <div className="maincart-summarybox">
            <div className="maincart-summary-title">Order Summary</div>
            <div className="maincart-summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {hasMakingCharges && (
              <div className="maincart-summary-row">
                <span>Making Charges</span>
                <span>₹{totalMakingCharges.toLocaleString()}</span>
              </div>
            )}
            <div className="maincart-summary-row">
              <span>Delivery Charge</span>
              <span>Free</span>
            </div>
            <div className="maincart-summary-total">
              <span>Total Payable</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
            <button className="maincart-checkout-btn" onClick={() => navigate('/checkout')}>Proceed To Checkout</button>
            <div className="maincart-or-row"><span>OR</span></div>
            <Link to="/video-cart" className="video-cart-link-btn">
              <FaVideo size={22} /> Schedule Video Call
            </Link>
          </div>
        </div>
      </div>
      <YouMayAlsoLike />
    </>
  );
};

export default Maincart;
