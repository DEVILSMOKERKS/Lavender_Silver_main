// Handles fetching, validating, and applying discounts in Maincart
import axios from 'axios';
import React from 'react';

/**
 * Fetch available discounts for the user (public and hidden if logged in)
 * @param {string} token - User JWT token (if logged in)
 * @returns {Promise<Array>} List of discounts
 */
export async function fetchAvailableDiscounts(token) {
    try {
        // Public discounts
        const publicRes = await axios.get('/api/discounts/frontend');
        let discounts = Array.isArray(publicRes.data) ? publicRes.data : (publicRes.data.data || []);
        // If logged in, also fetch hidden discounts
        if (token) {
            const hiddenRes = await axios.get('/api/discounts/hidden', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const hidden = Array.isArray(hiddenRes.data) ? hiddenRes.data : (hiddenRes.data.data || []);
            discounts = [...discounts, ...hidden];
        }
        return discounts;
    } catch (err) {
        console.error('Error fetching available discounts:', err);
        return [];
    }
}

/**
 * Validate and apply a discount code to the cart
 * @param {string} code - Discount code
 * @param {Array} discounts - List of available discounts
 * @param {number} totalAmount - Cart total
 * @returns {Object} { valid, discountAmount, message, discountObj }
 */
export function applyDiscountCode(code, discounts, totalAmount) {
    const discount = discounts.find(d => d.code.toLowerCase() === code.toLowerCase());
    if (!discount) {
        return { valid: false, discountAmount: 0, message: 'Invalid or expired coupon code.' };
    }
    // Check min order amount
    if (discount.minimum_order_amount && totalAmount < discount.minimum_order_amount) {
        return { valid: false, discountAmount: 0, message: `Minimum order amount for this coupon is ₹${discount.minimum_order_amount}` };
    }
    // Check date validity
    const now = new Date();
    if (discount.start_date && new Date(discount.start_date) > now) {
        return { valid: false, discountAmount: 0, message: 'This coupon is not yet active.' };
    }
    if (discount.end_date && new Date(discount.end_date) < now) {
        return { valid: false, discountAmount: 0, message: 'This coupon has expired.' };
    }
    // Calculate discount
    let discountAmount = 0;
    if (discount.discount_type === 'percentage') {
        discountAmount = Math.round((totalAmount * discount.discount_value) / 100);
        if (discount.max_discount_amount) {
            discountAmount = Math.min(discountAmount, discount.max_discount_amount);
        }
    } else {
        discountAmount = discount.discount_value;
    }
    return { valid: true, discountAmount, message: 'Coupon applied!', discountObj: discount };
}

/**
 * Show a popup/modal for entering and applying a discount code
 * @param {Object} options - { open, onClose, onApply, discounts, user, totalAmount }
 * @returns JSX (to be used in Maincart)
 */
export function DiscountPopup({ open, onClose, onApply, discounts, totalAmount }) {
    const [code, setCode] = React.useState('');
    const [result, setResult] = React.useState(null);
    if (!open) return null;
    const handleApply = () => {
        const res = applyDiscountCode(code, discounts, totalAmount);
        setResult(res);
        if (res.valid) {
            onApply(res.discountAmount, res.discountObj);
            onClose();
        }
    };
    return (
        <div className="maincart-discount-popup-overlay">
            <div className="maincart-discount-popup-modal">
                <h3>Apply Discount Coupon</h3>
                <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="maincart-discount-input"
                />
                <button className="maincart-discount-apply-btn" onClick={handleApply}>
                    Apply Now
                </button>
                {/* Example: show available discounts (optional, for user reference) */}
                {discounts && discounts.length > 0 && (
                    <div style={{ margin: '10px 0 0 0', textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Available Coupons:</div>
                        <ul style={{ paddingLeft: 18, margin: 0 }}>
                            {discounts.map((d, idx) => (
                                <li key={d.id || d.code || idx} style={{ fontSize: '0.95rem', marginBottom: 2 }}>
                                    <b>{d.code}</b>: {d.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {result && <div className={result.valid ? 'maincart-discount-success' : 'maincart-discount-error'}>{result.message}</div>}
                <button className="maincart-discount-cancel-btn" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
} 