import React from 'react';
import './CustomActionNotification.css';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const typeConfig = {
  cart: {
    label: 'Cart',
    color: 'var(--pvj-green)',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-13z" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="21" r="1" fill="currentColor" /><circle cx="18" cy="21" r="1" fill="currentColor" /></svg>,
    link: '/carts',
    viewMore: 'View Cart'
  },
  wishlist: {
    label: 'Wishlist',
    color: '#E74C3C',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 21s-6-4.35-9-7.5C-1.5 9.5 2.5 4 7.5 7.5c2.5 2 4.5 2 7 0C21.5 4 25.5 9.5 21 13.5c-3 3.15-9 7.5-9 7.5z" stroke="currentColor" strokeWidth="2" /></svg>,
    link: '/wishlist',
    viewMore: 'View Wishlist'
  },
  video: {
    label: 'Video Cart',
    color: '#3498DB',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 19h8a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" /></svg>,
    link: '/video-cart',
    viewMore: 'View Video Cart'
  }
};

const actionConfig = {
  add: { text: 'Added to', color: 'var(--pvj-green)' },
  remove: { text: 'Removed from', color: '#E74C3C' },
  update: { text: 'Updated in', color: '#F1C40F' }
};

export default function CustomActionNotification({ type, products = [], action, onClose }) {
  if (!typeConfig[type] || !actionConfig[action]) return null;
  const { label, color, icon, link, viewMore } = typeConfig[type];
  const { text, color: actionColor } = actionConfig[action];
  const showViewMore = products.length > 3;
  const displayProducts = products.slice(0, 3);
  return (
    <div className="custom-action-notif-popup" style={{ borderColor: color }}>
      <div className="custom-action-notif-icon" style={{ color }}>{icon}</div>
      <div className="custom-action-notif-info">
        <div className="custom-action-notif-title">
          <span style={{ color: actionColor, fontWeight: 600 }}>{text}</span> <span style={{ color }}>{label}</span>
        </div>
        <div className="custom-action-notif-listing">
          {displayProducts.map((product, idx) => {
            // Robust image selection - direct image handling
            let imgSrc = '';
            if (product?.image) {
              imgSrc = product.image;
              // If image is a relative path, prepend API_BASE_URL
              if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && imgSrc.trim() !== '') {
                imgSrc = imgSrc.startsWith('/') ? `${API_BASE_URL}${imgSrc}` : `${API_BASE_URL}/${imgSrc}`;
              }
            } else if (product?.img) {
              imgSrc = product.img;
              // If image is a relative path, prepend API_BASE_URL
              if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && imgSrc.trim() !== '') {
                imgSrc = imgSrc.startsWith('/') ? `${API_BASE_URL}${imgSrc}` : `${API_BASE_URL}/${imgSrc}`;
              }
            } else if (product?.images?.[0]?.image_url) {
              imgSrc = product.images[0].image_url;
              // If image is a relative path, prepend API_BASE_URL
              if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && imgSrc.trim() !== '') {
                imgSrc = imgSrc.startsWith('/') ? `${API_BASE_URL}${imgSrc}` : `${API_BASE_URL}/${imgSrc}`;
              }
            } else if (product?.images?.[0]) {
              imgSrc = product.images[0];
              // If image is a relative path, prepend API_BASE_URL
              if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && imgSrc.trim() !== '') {
                imgSrc = imgSrc.startsWith('/') ? `${API_BASE_URL}${imgSrc}` : `${API_BASE_URL}/${imgSrc}`;
              }
            }
            // Robust price selection
            let price = 0;
            if (product?.product_options?.[0]?.sell_price) {
              price = product.product_options[0].sell_price;
            } else if (product?.price) {
              price = product.price;
            }
            return (
              <div className="custom-action-notif-product" key={product.id || idx}>
                <img 
                  src={imgSrc || '/placeholder-image.png'} 
                  alt={product?.name || product?.item_name || 'Product'} 
                  className="custom-action-notif-img"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.target.style.display = 'none';
                  }}
                />
                <div className="custom-action-notif-details">
                  <div className="custom-action-notif-name">
                    {product?.name ? product.name.charAt(0).toUpperCase() + product.name.slice(1) : product?.item_name ? product.item_name.charAt(0).toUpperCase() + product.item_name.slice(1) : 'Product'}
                  </div>
                  <div className="custom-action-notif-price">₹{Number(price).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
        {showViewMore && (
          <Link to={link} className="custom-action-notif-viewmore">{viewMore} &rarr;</Link>
        )}
      </div>
      <button className="custom-action-notif-close" onClick={onClose}>&times;</button>
    </div>
  );
} 