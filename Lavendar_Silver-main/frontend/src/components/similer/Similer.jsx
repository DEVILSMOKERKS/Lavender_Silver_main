import React, { useEffect, useState } from "react";
import "./similer.css";
import productImg from "../../assets/img/signatureImg.png";
import cartIcon from "../../assets/img/icons/cartGreen.png";
import { Link } from "react-router-dom";
import diamondImg from "../../assets/img/icons/diamond.png";
import flowerImg1 from "../../assets/img/beautiful-ethnic-mandala-design-1.png?w=410&format=webp&q=75";
import flowerImg2 from "../../assets/img/beautiful-ethnic-mandala-design-2.png?w=410&format=webp&q=75";
import { FaShoppingCart } from "react-icons/fa";
import { GoHeartFill } from "react-icons/go";
import wishlistIcon from "../../assets/img/icons/wishlist.png";
import { useWishlistCart } from '../../context/wishlistCartContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';

const Similer = ({ currentProduct }) => {
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cart, wishlist, addToCart, removeFromCart, addToWishlist, removeFromWishlist } = useWishlistCart();
  const { showCustomNotification } = useNotification();
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!currentProduct) {
      setLoading(false);
      setSimilarProducts([]);
      return;
    }

    setLoading(true);
    const fetchSimilarProducts = async () => {
      try {
        const getCategoryId = (product) => {
          if (Array.isArray(product.categories) && product.categories[0]?.id) return product.categories[0].id;
          if (product.categories?.id) return product.categories.id;
          if (product.category_id) return product.category_id;
          return null;
        };

        const params = new URLSearchParams({ page: 1, limit: 10, status: 'active' });
        const categoryId = getCategoryId(currentProduct);
        if (categoryId) params.append('category_id', categoryId);

        const { data } = await axios.get(`${API_BASE_URL}/api/products?${params}`);
        if (!data.success) {
          setSimilarProducts([]);
          return;
        }

        const currentId = currentProduct?.id || currentProduct?.product_id;
        const filtered = data.data
          .filter(p => p?.id && p.id !== currentId)
          .map(p => {
            const price = parseFloat(p.product_options?.[0]?.sell_price || p.product_options?.[0]?.value || p.price_breakup?.final_price || p.total_rs || p.selling_price || p.base_price || 0);
            const img = p.images?.[0];
            let imageUrl = productImg;
            if (img) {
              const url = typeof img === 'string' ? img : img.image_url;
              if (url?.trim()) {
                const path = url.trim();
                imageUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
              }
            } else if (p.image_url?.trim()) {
              const path = p.image_url.trim();
              imageUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
            } else if (p.thumbnail?.trim()) {
              const path = p.thumbnail.trim();
              imageUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
            }

            return {
              id: p.id,
              title: p.item_name || p.title || 'Product',
              price: price > 0 ? `₹${price.toLocaleString()}` : '₹0',
              img: imageUrl,
              tag: p.tag || "Bestseller",
              slug: p.slug || p.id,
              description: (p.description || "Beautiful jewelry piece").substring(0, 100),
              originalProduct: p
            };
          });

        setSimilarProducts(filtered);
      } catch (error) {
        setSimilarProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [currentProduct, API_BASE_URL]);

  const handleWishlistToggle = (product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    const price = parseInt(product.price.replace(/[₹,]/g, "")) || 0;
    const productData = { id: product.id, name: product.title, image: product.img, price };

    if (isInWishlist) {
      removeFromWishlist(product.id);
      showCustomNotification({ type: 'wishlist', action: 'remove', product: productData });
    } else {
      addToWishlist({ ...productData, quantity: 1 });
      showCustomNotification({ type: 'wishlist', action: 'add', product: productData });
    }
  };

  const handleCartToggle = (product) => {
    const isInCart = cart.some(item => item.id === product.id);
    const price = parseInt(product.price.replace(/[₹,]/g, "")) || 0;
    const productData = { id: product.id, name: product.title, image: product.img, price };

    if (isInCart) {
      removeFromCart(product.id);
      showCustomNotification({ type: 'cart', action: 'remove', product: productData });
    } else {
      addToCart({ ...productData, quantity: 1, originalProduct: product.originalProduct });
      showCustomNotification({ type: 'cart', action: 'add', product: productData });
    }
  };

  if (loading) {
    return (
      <section className="similer-product-section">
        <div className="similer-product-header">
          <img src={diamondImg} alt="diamond" className="similer-product-logo" loading="lazy" decoding="async" width="100" height="100" />
          <h2>Similar Designs</h2>
        </div>
        <div className="similer-product-loading">Loading...</div>
      </section>
    );
  }

  if (similarProducts.length === 0) {
    return (
      <section className="similer-product-section">
        <img src={flowerImg1} alt="flower" className="similer-product-flower similer-product-flower-top" loading="lazy" decoding="async" />
        <img src={flowerImg2} alt="flower" className="similer-product-flower similer-product-flower-bottom" loading="lazy" decoding="async" />
        <div className="similer-product-header">
          <img src={diamondImg} alt="diamond" className="similer-product-logo" loading="lazy" decoding="async" width="100" height="100" />
          <h2>Similar Designs</h2>
        </div>
        <div className="similer-product-empty">
          <h3>More Amazing Designs Coming Soon!</h3>
          <p>We're curating the perfect collection of similar designs just for you.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="similer-product-section">
      <img src={flowerImg1} alt="flower" className="similer-product-flower similer-product-flower-top" loading="lazy" decoding="async" />
      <img src={flowerImg2} alt="flower" className="similer-product-flower similer-product-flower-bottom" loading="lazy" decoding="async" />
      <div className="similer-product-header">
        <img src={diamondImg} alt="diamond" className="similer-product-logo" loading="lazy" decoding="async" />
        <h2>Similar Designs</h2>
      </div>
      <div className="similer-product-scroll">
        {similarProducts.map((product) => {
          const isInWishlist = wishlist.some(item => item.id === product.id);
          const isInCart = cart.some(item => item.id === product.id);
          return (
            <div className="similer-product-card" key={product.id}>
              <Link to={`/product/${product.slug || product.id}`} className="similer-product-img-wrap">
                <span className="similer-product-tag">{product.tag}</span>
                {isInWishlist ? (
                  <GoHeartFill className="similer-product-heart similer-product-heart-filled" onClick={e => { e.preventDefault(); handleWishlistToggle(product); }} />
                ) : (
                  <img src={wishlistIcon} alt="wishlist" className="similer-product-heart" onClick={e => { e.preventDefault(); handleWishlistToggle(product); }} loading="lazy" decoding="async" />
                )}
                {isInCart ? (
                  <FaShoppingCart className="similer-product-cart similer-product-cart-filled" onClick={e => { e.preventDefault(); handleCartToggle(product); }} />
                ) : (
                  <img src={cartIcon} alt="cart" className="similer-product-cart" onClick={e => { e.preventDefault(); handleCartToggle(product); }} loading="lazy" decoding="async" />
                )}
                <img src={product.img} alt={product.title} className="similer-product-img" loading="lazy" decoding="async" onError={(e) => { if (e.target.src !== productImg) e.target.src = productImg; }} />
              </Link>
              <div className="similer-product-body">
                <div className="similer-product-title-row">
                  <h3>{product.title}</h3>
                </div>
                <p className="similer-product-desc">{product.description}</p>
                <div className="similer-product-price-row">
                  <span className="similer-product-price">{product.price}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Similer;
