import React, { useState, useRef, useEffect } from "react";
import "./checkout.css";
import { useWishlistCart } from "../../context/wishlistCartContext";
import { useUser } from "../../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const statesOfIndia = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

// Import MainCart styles
import "./maincart.css";

const requiredFields = [
  "email",
  "country",
  "firstName",
  "lastName",
  "address",
  "city",
  "state",
  "pincode",
  "phone",
];

const initialForm = {
  email: "",
  country: "India",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  panNumber: "",
  aadhaarNumber: "",
  saveInfo: false,
};

import { Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { launchRazorpayCheckout } from "./MagicCheckoutRazorpay.js";
import { useDynamicLinks } from "../../hooks/useDynamicLinks";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
  const { cart, cartItemCount } = useWishlistCart();
  const { user } = useUser();
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [products, setProducts] = React.useState([]);
  const [notification, setNotification] = useState(null);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [pincodePlaces, setPincodePlaces] = useState([]);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const notificationTimeout = useRef(null);
  const navigate = useNavigate();
  const { links } = useDynamicLinks();
  // Fetch discounts on mount
  // Fetch products and discounts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch discounts and filter out expired ones
        const discountRes = await axios.get(
          `${API_BASE_URL}/api/discounts/frontend`
        );
        const allDiscounts = discountRes.data?.data || discountRes.data || [];

        // Filter out expired discounts
        const now = new Date();
        const validDiscounts = allDiscounts.filter((discount) => {
          // Check if discount has end_date and if it's expired
          if (discount.end_date && new Date(discount.end_date) < now) {
            return false; // Expired
          }
          // Check if discount has start_date and if it's not yet active
          if (discount.start_date && new Date(discount.start_date) > now) {
            return false; // Not yet active
          }
          return true; // Valid discount
        });

        setAvailableDiscounts(validDiscounts);

        // Fetch products based on cart items
        let ids = Array.isArray(cart) ? cart.map((item) => item.id) : [];
        if (!ids.length) {
          setProducts([]);
          return;
        }
        const productRes = await axios.get(`${API_BASE_URL}/api/products`, {
          params: { ids: ids.join(",") },
        });
        const productData = productRes.data?.data || [];
        setProducts(productData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [cart]);

  // Auto-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      // Split name into first and last name
      const nameParts = (user.name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Parse address if it exists
      let address = "";
      let city = "";
      let state = "";
      let pincode = "";
      let country = "India";

      if (user.address) {
        if (typeof user.address === "object") {
          address = user.address.place || user.address.address || "";
          city = user.address.city || "";
          state = user.address.state || "";
          pincode = user.address.pincode || "";
          country = user.address.country || "India";
        } else if (typeof user.address === "string") {
          try {
            const parsed = JSON.parse(user.address);
            if (typeof parsed === "object") {
              address = parsed.place || parsed.address || "";
              city = parsed.city || "";
              state = parsed.state || "";
              pincode = parsed.pincode || "";
              country = parsed.country || "India";
            } else {
              address = user.address;
            }
          } catch {
            address = user.address;
          }
        }
      }

      // Clean phone number - remove +91 prefix if present
      let cleanPhone = user.phone || form.phone;
      if (cleanPhone) {
        if (cleanPhone.startsWith('+91')) {
          cleanPhone = cleanPhone.substring(3);
        } else if (cleanPhone.startsWith('91') && cleanPhone.length > 2) {
          cleanPhone = cleanPhone.substring(2);
        }
        // Remove all non-digit characters and limit to 10 digits
        cleanPhone = cleanPhone.replace(/\D/g, "").slice(0, 10);
      }

      setForm((prevForm) => ({
        ...prevForm,
        email: user.email || prevForm.email,
        firstName: firstName || prevForm.firstName,
        lastName: lastName || prevForm.lastName,
        phone: cleanPhone || prevForm.phone,
        address: address || prevForm.address,
        city: city || prevForm.city,
        state: state || prevForm.state,
        pincode: pincode || prevForm.pincode,
        country: country || prevForm.country,
      }));
    }
  }, [user]);

  // Calculate labour cost for a product (same logic as AddProduct)
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

  // Cart calculations
  const subtotal = Array.isArray(cart)
    ? cart.reduce((sum, cartItem) => {
        const prod = products.find((p) => p.id === cartItem.id);
        if (!prod) return sum;

        const selectedOption =
          prod.product_options?.find(
            (opt) =>
              opt.size === cartItem.selectedSize &&
              opt.metal_type === cartItem.selectedMetalType &&
              opt.metal_purity === cartItem.selectedMetalPurity
          ) || prod.product_options?.[0];

        let sellPrice = 0;
        if (selectedOption?.sell_price) {
          sellPrice = Number(selectedOption.sell_price);
        } else if (selectedOption?.value) {
          sellPrice = Number(selectedOption.value);
        } else if (prod.price) {
          sellPrice = typeof prod.price === "string"
            ? Number(prod.price.replace(/[^\d.]/g, ""))
            : Number(prod.price);
        }

        let quantity = Number(cartItem.quantity) || 1;
        return sum + sellPrice * quantity;
      }, 0)
    : 0;

  const totalLabourCost = Array.isArray(cart)
    ? cart.reduce((sum, cartItem) => {
        const prod = products.find((p) => p.id === cartItem.id);
        if (!prod) return sum;
        const labourCost = calculateLabourCost(prod);
        const quantity = Number(cartItem.quantity) || 1;
        return sum + labourCost * quantity;
      }, 0)
    : 0;

  const hasLabour = totalLabourCost > 0;
  const totalQuantity = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    : 0;

  // Invoice Logic Calculations
  const metalValue = Array.isArray(cart)
    ? cart.reduce((sum, cartItem) => {
      console.log(cartItem);
        const prod = products.find((p) => p.id === cartItem.id);
        if (!prod) return sum;
        const rate = parseFloat(prod.rate) || 0;
        const weight = parseFloat(prod.fine_weight) || parseFloat(prod.net_weight) || parseFloat(prod.gross_weight) || 0;
        const quantity = Number(cartItem.quantity) || 1;
        return sum + (rate * weight * quantity);
      }, 0)
    : 0;

  const taxableLabour = Math.max(0, totalLabourCost - discountAmount);
  
  // GST Rates
  const metalGSTAmount = metalValue * 0.03;
  const labourGSTAmount = taxableLabour * 0.05;
  const totalGSTAmount = metalGSTAmount + labourGSTAmount;

  // Final Total Payable (Including GST)
  const total = metalValue + taxableLabour + totalGSTAmount;
  
  const isHighValueOrder = total >= 200000;

  // Clear PAN and Aadhaar when order total drops below ₹2,00,000
  useEffect(() => {
    if (!isHighValueOrder) {
      setForm((prev) => ({
        ...prev,
        panNumber: "",
        aadhaarNumber: "",
      }));
      setFormErrors((prev) => ({
        ...prev,
        panNumber: undefined,
        aadhaarNumber: undefined,
      }));
    }
  }, [isHighValueOrder]);

  // PAN validation: 5 uppercase letters + 4 digits + 1 uppercase letter
  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  // Aadhaar validation: Exactly 12 numeric digits
  const validateAadhaar = (aadhaar) => {
    const aadhaarRegex = /^[0-9]{12}$/;
    return aadhaarRegex.test(aadhaar);
  };

  // Form validation
  const validateForm = () => {
    let isValid = true;
    const errors = {};
    requiredFields.forEach((field) => {
      if (!form[field] || !form[field].toString().trim()) {
        isValid = false;
        errors[field] = `${
          field.charAt(0).toUpperCase() +
          field.slice(1).replace(/([A-Z])/g, " $1")
        } is required`;
      }
    });
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      isValid = false;
      errors.email = "Please enter a valid email address";
    }
    if (form.pincode.trim() && !/^[1-9][0-9]{5}$/.test(form.pincode)) {
      isValid = false;
      errors.pincode = "Please enter a valid PIN code";
    }
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone)) {
      isValid = false;
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    
    // Conditional validation for PAN and Aadhaar when order value >= ₹2,00,000
    if (isHighValueOrder) {
      if (!form.panNumber || !form.panNumber.trim()) {
        isValid = false;
        errors.panNumber = "PAN Number is required for orders above ₹2,00,000";
      } else {
        const panUpper = form.panNumber.trim().toUpperCase();
        if (!validatePAN(panUpper)) {
          isValid = false;
          errors.panNumber = "Invalid PAN format. Format: ABCDE1234F";
        }
      }
      
      if (!form.aadhaarNumber || !form.aadhaarNumber.trim()) {
        isValid = false;
        errors.aadhaarNumber = "Aadhaar Number is required for orders above ₹2,00,000";
      } else {
        const aadhaarClean = form.aadhaarNumber.trim().replace(/\s/g, "");
        if (!validateAadhaar(aadhaarClean)) {
          isValid = false;
          errors.aadhaarNumber = "Invalid Aadhaar format. Must be exactly 12 digits";
        }
      }
    }
    
    setFormErrors(errors);
    return { isValid, errors };
  };

  // Notification
  const showNotif = (message, type) => {
    setNotification({ message, type });
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    notificationTimeout.current = setTimeout(() => setNotification(null), 3000);
  };

  // Discount apply logic
  const handleApplyDiscount = (code, discountObj) => {
    setDiscountError("");

    // Check if labour exists - discount only applies when labour exists
    if (!hasLabour) {
      setDiscountError(
        "Discount can only be applied when labour charges are present."
      );
      setAppliedDiscount(null);
      setDiscountAmount(0);
      return;
    }

    let discount = null;
    if (discountObj) {
      discount = discountObj;
    } else {
      discount = availableDiscounts.find(
        (d) => d.code.toLowerCase() === code.toLowerCase()
      );
    }
    if (!discount) {
      setDiscountError("Invalid or expired coupon code.");
      setAppliedDiscount(null);
      setDiscountAmount(0);
      return;
    }
    // Check min order amount - use subtotal (main price) for minimum order check
    if (
      discount.minimum_order_amount &&
      subtotal < discount.minimum_order_amount
    ) {
      setDiscountError(
        `Minimum order amount for this coupon is ₹${discount.minimum_order_amount}`
      );
      setAppliedDiscount(null);
      setDiscountAmount(0);
      return;
    }
    // Check date validity
    const now = new Date();
    if (discount.start_date && new Date(discount.start_date) > now) {
      setDiscountError("This coupon is not yet active.");
      setAppliedDiscount(null);
      setDiscountAmount(0);
      return;
    }
    if (discount.end_date && new Date(discount.end_date) < now) {
      setDiscountError("This coupon has expired.");
      setAppliedDiscount(null);
      setDiscountAmount(0);
      return;
    }
    // Calculate discount - apply only to labour value
    // But discount amount will be deducted from main price (subtotal)
    let discountAmt = 0;
    if (hasLabour) {
      if (discount.discount_type === "percentage") {
        // Calculate discount based on labour value
        discountAmt = Math.round(
          (totalLabourCost * discount.discount_value) / 100
        );
        if (discount.max_discount_amount) {
          discountAmt = Math.min(discountAmt, discount.max_discount_amount);
        }
      } else {
        // Flat discount - but limit it to labour cost if discount is more than labour
        discountAmt = Math.min(discount.discount_value, totalLabourCost);
      }
    } else {
      // No labour, no discount
      setDiscountError(
        "Discount can only be applied when labour charges are present."
      );
      setAppliedDiscount(null);
      setDiscountAmount(0);
      return;
    }
    setAppliedDiscount(discount);
    setDiscountAmount(discountAmt);
    setDiscountError("");
    showNotif("Coupon applied!", "success");
  };

  // Payment with Magic Checkout
  const handleProceed = async (e) => {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.isValid) {
      showNotif(Object.values(validation.errors)[0], "error");
      return;
    }
    if (!cartItemCount) {
      showNotif("Your cart is empty.", "error");
      return;
    }
    setProcessing(true);

    try {
      const orderData = {
        user_name: form.firstName + " " + form.lastName,
        user_email: form.email,
        user_phone: form.phone,
        total_amount: total,
        payment_method: "online",
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_country: form.country,
        shipping_postal_code: form.pincode,
        shipping_address:
          form.address + (form.apartment ? ", " + form.apartment : ""),
        cod_charge: 0,
        discount_code: appliedDiscount?.code || null,
        discount_amount: discountAmount || 0,
        pan_number: isHighValueOrder && form.panNumber ? form.panNumber.trim().toUpperCase() : null,
        aadhaar_number: isHighValueOrder && form.aadhaarNumber ? form.aadhaarNumber.trim().replace(/\s/g, "") : null,
        items: cart.map((item) => {
          let price = 0;
          if (item.selectedOption?.sell_price) {
            price = Number(item.selectedOption.sell_price);
          } else if (item.selectedOption?.value) {
            price = Number(item.selectedOption.value);
          } else if (
            item.product_options &&
            item.product_options[0] &&
            item.product_options[0].sell_price
          ) {
            price = Number(item.product_options[0].sell_price);
          } else if (
            item.product_options &&
            item.product_options[0] &&
            item.product_options[0].value
          ) {
            price = Number(item.product_options[0].value);
          } else if (item.custom_price) {
            price = Number(item.custom_price);
          } else if (item.price) {
            price =
              typeof item.price === "string"
                ? Number(item.price.replace(/[^\d.]/g, ""))
                : Number(item.price);
          }

          // Professional product option ID logic
          let productOptionId = null;
          if (item.selectedOption && item.selectedOption.id) {
            productOptionId = item.selectedOption.id;
          } else if (
            item.product_options &&
            item.product_options[0] &&
            item.product_options[0].id
          ) {
            productOptionId = item.product_options[0].id;
          }

          // Professional size logic
          let size = null;
          if (item.selectedOption && item.selectedOption.size) {
            size = item.selectedOption.size;
          } else if (item.selected_size) {
            size = item.selected_size;
          } else if (item.size) {
            size = item.size;
          } else if (
            item.product_options &&
            item.product_options[0] &&
            item.product_options[0].size
          ) {
            size = item.product_options[0].size;
          }

          // Professional weight logic
          let weight = null;
          if (item.selectedOption && item.selectedOption.weight) {
            weight = item.selectedOption.weight;
          } else if (item.selected_weight) {
            weight = item.selected_weight;
          } else if (item.weight) {
            weight = item.weight;
          } else if (
            item.product_options &&
            item.product_options[0] &&
            item.product_options[0].weight
          ) {
            weight = item.product_options[0].weight;
          }

          // Professional metal type logic
          let metalType = null;
          if (item.selectedOption && item.selectedOption.metal_type) {
            metalType = item.selectedOption.metal_type;
          } else if (item.selected_metal_type) {
            metalType = item.selected_metal_type;
          } else if (item.metal_type) {
            metalType = item.metal_type;
          } else if (
            item.product_options &&
            item.product_options[0] &&
            item.product_options[0].metal_type
          ) {
            metalType = item.product_options[0].metal_type;
          }

          // Professional diamond quality logic
          let diamondQuality = null;
          if (item.selectedOption && item.selectedOption.quality) {
            diamondQuality = item.selectedOption.quality;
          } else if (item.selected_diamond_quality) {
            diamondQuality = item.selected_diamond_quality;
          } else if (item.diamond_quality) {
            diamondQuality = item.diamond_quality;
          } else if (
            item.product_options &&
            item.product_options[0] &&
            item.product_options[0].quality
          ) {
            diamondQuality = item.product_options[0].quality;
          }

          return {
            product_id: item.id,
            product_option_id: productOptionId,
            quantity: item.quantity ? item.quantity : 1,
            price: price,
            size: size,
            weight: weight,
            metal_type: metalType,
            diamond_quality: diamondQuality,
            custom_price: item.custom_price ? item.custom_price : null,
          };
        }),
      };

      await launchRazorpayCheckout(
        orderData,
        (response) => {
          showNotif("Payment successful!", "success");
          setForm(initialForm);
          setAppliedDiscount(null);
          setDiscountAmount(0);
          navigate("/thankyou", { state: { order: response, cart } });
        },
        (error) => {
          const errorMessage = error?.message || "Unknown error occurred";
          showNotif(errorMessage, "error");
        }
      );
    } catch (err) {
      showNotif(
        "Payment initiation failed: " + (err?.message || "Unknown error"),
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  
  // PAN input handler - auto uppercase and limit to 10 characters
  const handlePANInput = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, panNumber: value }));
    setFormErrors((prev) => ({ ...prev, panNumber: undefined }));
  };
  
  // Aadhaar input handler - only digits, limit to 12
  const handleAadhaarInput = (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 12);
    setForm((prev) => ({ ...prev, aadhaarNumber: value }));
    setFormErrors((prev) => ({ ...prev, aadhaarNumber: undefined }));
  };
  const handlePincodeInput = async (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, pincode: value }));
    setFormErrors((prev) => ({ ...prev, pincode: undefined }));

    if (value.length === 6) {
      setLoadingPincode(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/pincodes/lookup`, {
          params: { pincode: value }
        });

        if (response.data.success && response.data.data) {
          const { places, state } = response.data.data;
          
          if (places && places.length > 0) {
            setPincodePlaces(places);
            
            // Try to find matching state in our predefined list (case-insensitive)
            const matchedState = statesOfIndia.find(s => s.toLowerCase() === (state || "").toLowerCase()) || state;

            // If only one place, auto-fill it
            if (places.length === 1) {
              setForm(prev => ({
                ...prev,
                city: places[0].name,
                state: matchedState || prev.state
              }));
            } else {
              // More than one place, let user select, but auto-fill state
              setForm(prev => ({
                ...prev,
                state: matchedState || prev.state,
                city: "" // Reset city to force selection
              }));
            }
          }
        } else {
          setPincodePlaces([]);
        }
      } catch (error) {
        console.error("Error fetching pincode details:", error);
        setPincodePlaces([]);
      } finally {
        setLoadingPincode(false);
      }
    } else {
      setPincodePlaces([]);
    }
  };
  const handlePhoneInput = (e) => {
    let value = e.target.value;
    
    // Remove +91 prefix if it exists
    if (value.startsWith('+91')) {
      value = value.substring(3);
    } else if (value.startsWith('91') && value.length > 2) {
      value = value.substring(2);
    }
    
    // Remove all non-digit characters and limit to 10 digits
    value = value.replace(/\D/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, phone: value }));
    setFormErrors((prev) => ({ ...prev, phone: undefined }));
  };

  // View Details Popup
  const CartDetailsPopup = () => {
    // Lock body scroll when popup is open
    React.useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }, []);

    // Merge cart quantities/customizations with backend products
    const cartMap = Array.isArray(cart)
      ? cart.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {})
      : {};
    const cartIds = Array.isArray(cart) ? cart.map((item) => item.id) : [];
    const filteredProducts = cartIds
      .map((id) => {
        const prod = products.find((p) => p.id === id);
        const cartItem = cartMap[id];
        if (!prod) return null;

        // Find the selected product option
        const selectedOption =
          prod.product_options?.find(
            (opt) =>
              opt.size === cartItem.selectedSize &&
              opt.metal_type === cartItem.selectedMetalType &&
              opt.metal_purity === cartItem.selectedMetalPurity
          ) || prod.product_options?.[0];

        // Merge product data with cart data and selected option prices
        return {
          ...prod,
          ...cartItem,
          price: selectedOption?.value || prod.price,
          oldPrice: selectedOption?.actual_price || prod.oldPrice,
          selectedOption,
        };
      })
      .filter(Boolean);

    return (
      <div
        className="checkout-popup-overlay"
        onClick={() => setViewDetailsOpen(false)}
      >
        <div
          className="checkout-popup-modal checkout-cart-details-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="checkout-popup-title">
            Cart Details{" "}
            <span className="maincart-item-count">
              ({cartItemCount} Item{cartItemCount !== 1 ? "s" : ""})
            </span>
          </h3>
          {cartItemCount === 0 ? (
            <div>Your cart is empty.</div>
          ) : (
            <div className="maincart-cartbox">
              <div
                className="maincart-cart-header"
                style={{ color: "black", fontWeight: "bold" }}
              >
                <span>PRODUCT</span>
                <span>QUANTITY</span>
                <span>PRICE</span>
                <span>TOTAL</span>
              </div>
              {filteredProducts.map((item) => {
                let sellPrice = 0;
                if (item.selectedOption?.sell_price) {
                  sellPrice = Number(item.selectedOption.sell_price);
                } else if (item.selectedOption?.value) {
                  sellPrice = Number(item.selectedOption.value);
                } else if (
                  item.product_options &&
                  item.product_options[0] &&
                  item.product_options[0].sell_price
                ) {
                  sellPrice = Number(item.product_options[0].sell_price);
                } else if (
                  item.product_options &&
                  item.product_options[0] &&
                  item.product_options[0].value
                ) {
                  sellPrice = Number(item.product_options[0].value);
                } else if (item.custom_price) {
                  sellPrice = Number(item.custom_price);
                } else if (item.price) {
                  sellPrice =
                    typeof item.price === "string"
                      ? Number(item.price.replace(/[^\d.]/g, ""))
                      : Number(item.price);
                }

                const actualPrice = Number(item.oldPrice || sellPrice || 0);
                const quantity = Number(item.quantity) || 1;
                const total = sellPrice * quantity;
                const discountPercent =
                  actualPrice && sellPrice && actualPrice > sellPrice
                    ? Math.round(100 - (sellPrice / actualPrice) * 100)
                    : null;
                // Proper image handling for cart detail popup
                let imgSrc = "";
                if (item.image && item.image != "") {
                  if (item.image.startsWith("https://")) {
                    imgSrc = item.image;
                  } else {
                    imgSrc = `${API_BASE_URL}${item.image}`;
                  }
                } else if (item.images && item.images.length > 0) {
                  imgSrc = `${API_BASE_URL}${item.images[0]}`;
                }

                // Get the selected product option
                const selectedOption =
                  item.product_options && item.product_options.length > 0
                    ? item.product_options[0]
                    : null;

                // Get dynamic option details - use product_options if option_details is not available
                const optionDetails = item.option_details || {};
                const size =
                  optionDetails.size ||
                  selectedOption?.size ||
                  item.selected_size ||
                  "";
                const weight =
                  optionDetails.weight ||
                  selectedOption?.weight ||
                  item.selected_weight ||
                  "";
                const metalType =
                  optionDetails.metal_color ||
                  selectedOption?.metal_color ||
                  item.selected_metal_type ||
                  "";

                return (
                  <div className="maincart-cart-item" key={item.id}>
                    {/* Mobile structure */}
                    <div className="maincart-cart-item-mobile">
                      <div className="maincart-mobile-row">
                        <Link to={`/product/${item.slug || ""}`}>
                          <img
                            src={imgSrc}
                            alt={item.item_name}
                            className="maincart-product-img"
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>
                        <div className="maincart-mobile-info">
                          <div className="maincart-collection maincart-attrs-title">
                            {item.item_name}
                          </div>
                          <div className="maincart-mobile-pricing">
                            <span className="maincart-mobile-price">
                              ₹{sellPrice.toLocaleString()}
                            </span>
                            {discountPercent && discountPercent > 0 && (
                              <span className="maincart-mobile-discount">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>
                          <div className="maincart-mobile-attrs">
                            {item.stamp && (
                              <div className="maincart-product-attr">
                                <strong>Stamp:</strong> {item.stamp}
                              </div>
                            )}
                            <div className="maincart-product-attr">
                              <strong>Size:</strong> {size}
                            </div>
                            <div className="maincart-product-attr">
                              <strong>Weight:</strong> {weight}
                            </div>
                            <div className="maincart-product-attr">
                              <strong>Metal:</strong> {metalType}
                            </div>
                            {item.rate && parseFloat(item.rate) > 0 && (
                              <div className="maincart-product-attr">
                                <strong>Rate:</strong> ₹{parseFloat(item.rate).toLocaleString()}
                              </div>
                            )}
                            {item.less_weight && parseFloat(item.less_weight) > 0 && (
                              <div className="maincart-product-attr">
                                <strong>Less Weight:</strong> {parseFloat(item.less_weight).toFixed(3)} g
                              </div>
                            )}
                            {item.category_name && (
                              <div className="maincart-product-attr">
                                <strong>Category:</strong> {item.category_name}
                              </div>
                            )}
                            {item.subcategory_name && (
                              <div className="maincart-product-attr">
                                <strong>Subcategory:</strong> {item.subcategory_name}
                              </div>
                            )}
                            {item.diamond_weight && parseFloat(item.diamond_weight) > 0 && (
                              <div className="maincart-product-attr">
                                <strong>Diamond Weight:</strong> {parseFloat(item.diamond_weight).toFixed(3)} ct
                              </div>
                            )}
                            {item.stone_weight && parseFloat(item.stone_weight) > 0 && (
                              <div className="maincart-product-attr">
                                <strong>Stone Weight:</strong> {parseFloat(item.stone_weight).toFixed(3)} ct
                              </div>
                            )}
                            {item.tunch && parseFloat(item.tunch) > 0 && item.tunch !== 100 && (
                              <div className="maincart-product-attr">
                                <strong>Purity:</strong> {parseFloat(item.tunch).toFixed(2)}%
                              </div>
                            )}
                            {(() => {
                              const itemLabourCost = calculateLabourCost(item);
                              const itemLabourTotal = itemLabourCost * quantity;
                              return itemLabourCost > 0 ? (
                                <div className="maincart-product-attr">
                                  <strong>Making Charge:</strong> ₹{itemLabourTotal.toLocaleString()}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="maincart-mobile-bottomrow">
                        <div className="maincart-qty">
                          <span className="maincart-qty-value">{quantity}</span>
                        </div>
                        <div className="maincart-mobile-total">
                          ₹{total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {/* Desktop structure */}
                    <div className="maincart-product-info">
                      <Link to={`/product/${item.slug || ""}`}>
                        <img
                          src={imgSrc}
                          alt={item.item_name}
                          className="maincart-product-img"
                          loading="lazy"
                          decoding="async"
                        />
                      </Link>
                      <div className="maincart-product-details">
                        <div className="maincart-attrs-title">
                          <strong>Title:</strong> {item.item_name}
                        </div>
                        {item.stamp && (
                          <div className="maincart-product-attr">
                            <strong>Stamp:</strong> {item.stamp}
                          </div>
                        )}
                        <div className="maincart-product-attr">
                          <strong>Size:</strong> {size}
                        </div>
                        <div className="maincart-product-attr">
                          <strong>Weight:</strong> {weight}
                        </div>
                        <div className="maincart-product-attr">
                          <strong>Metal:</strong> {metalType}
                        </div>
                        {item.rate && parseFloat(item.rate) > 0 && (
                          <div className="maincart-product-attr">
                            <strong>Rate:</strong> ₹{parseFloat(item.rate).toLocaleString()}
                          </div>
                        )}
                        {item.less_weight && parseFloat(item.less_weight) > 0 && (
                          <div className="maincart-product-attr">
                            <strong>Less Weight:</strong> {parseFloat(item.less_weight).toFixed(3)} g
                          </div>
                        )}
                        {item.category_name && (
                          <div className="maincart-product-attr">
                            <strong>Category:</strong> {item.category_name}
                          </div>
                        )}
                        {item.subcategory_name && (
                          <div className="maincart-product-attr">
                            <strong>Subcategory:</strong> {item.subcategory_name}
                          </div>
                        )}
                        {item.diamond_weight && parseFloat(item.diamond_weight) > 0 && (
                          <div className="maincart-product-attr">
                            <strong>Diamond Weight:</strong> {parseFloat(item.diamond_weight).toFixed(3)} ct
                          </div>
                        )}
                        {item.stone_weight && parseFloat(item.stone_weight) > 0 && (
                          <div className="maincart-product-attr">
                            <strong>Stone Weight:</strong> {parseFloat(item.stone_weight).toFixed(3)} ct
                          </div>
                        )}
                        {item.tunch && parseFloat(item.tunch) > 0 && item.tunch !== 100 && (
                          <div className="maincart-product-attr">
                            <strong>Purity:</strong> {parseFloat(item.tunch).toFixed(2)}%
                          </div>
                        )}
                        {(() => {
                          const itemLabourCost = calculateLabourCost(item);
                          const itemLabourTotal = itemLabourCost * quantity;
                          return itemLabourCost > 0 ? (
                            <div className="maincart-product-attr">
                              <strong>Making Charge:</strong> ₹{itemLabourTotal.toLocaleString()}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="maincart-qty">
                      <span className="maincart-qty-value">{quantity}</span>
                    </div>
                    <div className="maincart-price">
                      ₹{sellPrice.toLocaleString()}
                    </div>
                    <div className="maincart-total">
                      ₹{total.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            className="checkout-popup-close-btn"
            onClick={() => setViewDetailsOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // Render
  if (!cartItemCount) {
    return (
      <div className="checkout-main-container">
        <h2 className="checkout-title">Your Cart is Empty</h2>
      </div>
    );
  }

  return (
    <div className="checkout-main-container">
      <h2 className="checkout-title">Your Details</h2>
      <div className="checkout-grid">
        {/* Left Column */}
        <div className="checkout-left-col">
          {/* Coupon Section */}
          <div className="checkout-card checkout-coupon-card">
            <div className="checkout-coupon-title">Available Coupons</div>
            <div className="checkout-coupon-grid">
              {availableDiscounts.length === 0 && (
                <div>No coupons available.</div>
              )}
              {availableDiscounts.map((d, idx) => (
                <div
                  key={d.id || d.code || idx}
                  className="checkout-coupon-card-item"
                  onClick={() => handleApplyDiscount(d.code, d)}
                >
                  <div className="checkout-coupon-card-code">{d.code}</div>
                  <div className="checkout-coupon-card-value">
                    {d.discount_type === "percentage"
                      ? `${d.discount_value}% OFF`
                      : `₹${d.discount_value} OFF`}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="checkout-coupon-input-row"
              style={{ marginTop: 10 }}
            >
              <input
                className="checkout-form-input"
                type="text"
                placeholder="Enter Coupon Code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyDiscount(discountCode);
                  }
                }}
              />
              <button
                type="button"
                className="checkout-coupon-apply-btn"
                onClick={() => handleApplyDiscount(discountCode)}
              >
                Apply
              </button>
            </div>
            {discountError && (
              <div className="checkout-discount-error">{discountError}</div>
            )}
            {appliedDiscount && !discountError && (
              <div className="checkout-discount-success">
                Applied: {appliedDiscount.code} (-₹
                {discountAmount.toLocaleString()})
                <button
                  type="button"
                  className="checkout-coupon-cancel-btn"
                  style={{
                    marginLeft: 12,
                    background: "#7b2b3e",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setAppliedDiscount(null);
                    setDiscountAmount(0);
                    setDiscountError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {/* Contact & Delivery Section */}
          <div className="checkout-card checkout-contact-card">
            <div className="checkout-contact-title">Email</div>
            <div className="checkout-form-group">
              <input
                className="checkout-form-input"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleInputChange}
                required
                style={{ borderColor: formErrors.email ? "#ff4444" : "#ddd" }}
              />
            </div>
            <div className="checkout-delivery-title">Delivery</div>
            <div className="checkout-form-group">
              <select
                className="checkout-form-input"
                name="country"
                value={form.country}
                onChange={handleInputChange}
                required
                style={{ borderColor: formErrors.country ? "#ff4444" : "#ddd" }}
              >
                <option value="India">India</option>
              </select>
            </div>
            <div className="checkout-form-row">
              <input
                className="checkout-form-input"
                type="text"
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={handleInputChange}
                required
                style={{
                  borderColor: formErrors.firstName ? "#ff4444" : "#ddd",
                }}
              />
              <input
                className="checkout-form-input"
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleInputChange}
                required
                style={{
                  borderColor: formErrors.lastName ? "#ff4444" : "#ddd",
                }}
              />
            </div>
            <div className="checkout-form-group">
              <input
                className="checkout-form-input"
                type="text"
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleInputChange}
                required
                style={{ borderColor: formErrors.address ? "#ff4444" : "#ddd" }}
              />
            </div>
            <div className="checkout-form-group">
              <input
                className="checkout-form-input"
                type="text"
                name="apartment"
                placeholder="Apartment, Suite, Etc. (Optional)"
                value={form.apartment}
                onChange={handleInputChange}
                style={{ borderColor: "#ddd" }}
              />
            </div>
            <div className="checkout-form-group" style={{ position: 'relative' }}>
              <input
                className="checkout-form-input"
                type="text"
                name="pincode"
                placeholder="PIN Code"
                value={form.pincode}
                onChange={handlePincodeInput}
                required
                style={{ borderColor: formErrors.pincode ? "#ff4444" : "#ddd" }}
                maxLength={6}
              />
              {loadingPincode && (
                <div style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  ...
                </div>
              )}
            </div>
            <div className="checkout-form-row">
              <div className="checkout-form-group" style={{ flex: 1 }}>
                {pincodePlaces.length > 1 ? (
                  <select
                    className="checkout-form-input"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    required
                    style={{ borderColor: formErrors.city ? "#ff4444" : "#ddd" }}
                  >
                    <option value="">Select City/Area</option>
                    {pincodePlaces.map((place, idx) => (
                      <option key={`${place.name}-${idx}`} value={place.name}>
                        {place.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="checkout-form-input"
                    type="text"
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={handleInputChange}
                    required
                    style={{ borderColor: formErrors.city ? "#ff4444" : "#ddd" }}
                  />
                )}
              </div>
              <div className="checkout-form-group" style={{ flex: 1 }}>
                <select
                  className="checkout-form-input"
                  name="state"
                  value={form.state}
                  onChange={handleInputChange}
                  required
                  style={{ borderColor: formErrors.state ? "#ff4444" : "#ddd" }}
                >
                  <option value="">State</option>
                  {statesOfIndia.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="checkout-form-group">
              <input
                className="checkout-form-input"
                type="text"
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handlePhoneInput}
                required
                style={{ borderColor: formErrors.phone ? "#ff4444" : "#ddd" }}
                maxLength={10}
              />
            </div>
            {isHighValueOrder && (
              <>
                <div className="checkout-form-group" style={{ marginTop: "20px" }}>
                  <div style={{ 
                    padding: "12px", 
                    backgroundColor: "#fff3cd", 
                    border: "1px solid #ffc107", 
                    borderRadius: "4px", 
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: "#856404"
                  }}>
                    <strong>Legal Compliance Notice:</strong> As per legal compliance, PAN and Aadhaar are mandatory for orders above ₹2,00,000.
                  </div>
                </div>
                <div className="checkout-form-group">
                  <input
                    className="checkout-form-input"
                    type="text"
                    name="panNumber"
                    placeholder="PAN Number (e.g., ABCDE1234F)"
                    value={form.panNumber}
                    onChange={handlePANInput}
                    required={isHighValueOrder}
                    style={{ borderColor: formErrors.panNumber ? "#ff4444" : "#ddd" }}
                    maxLength={10}
                  />
                  {formErrors.panNumber && (
                    <div style={{ color: "#ff4444", fontSize: "12px", marginTop: "4px" }}>
                      {formErrors.panNumber}
                    </div>
                  )}
                </div>
                <div className="checkout-form-group">
                  <input
                    className="checkout-form-input"
                    type="text"
                    name="aadhaarNumber"
                    placeholder="Aadhaar Number (12 digits)"
                    value={form.aadhaarNumber}
                    onChange={handleAadhaarInput}
                    required={isHighValueOrder}
                    style={{ borderColor: formErrors.aadhaarNumber ? "#ff4444" : "#ddd" }}
                    maxLength={12}
                  />
                  {formErrors.aadhaarNumber && (
                    <div style={{ color: "#ff4444", fontSize: "12px", marginTop: "4px" }}>
                      {formErrors.aadhaarNumber}
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="checkout-save-info-row">
              <input
                type="checkbox"
                id="saveInfo"
                name="saveInfo"
                checked={form.saveInfo}
                onChange={handleInputChange}
              />
              <label
                htmlFor="saveInfo"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Save This Information For Next Time
              </label>
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="checkout-right-col">
          {/* Order Summary Section */}
          <div className="checkout-card checkout-summary-card">
            <div className="checkout-summary-header">
              <div className="checkout-summary-title">Order Summary</div>
              <button
                className="checkout-summary-details-btn"
                onClick={() => setViewDetailsOpen(true)}
              >
                View Details
              </button>
            </div>
            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <span>₹{(subtotal - totalLabourCost).toLocaleString()}</span>
            </div>
            {hasLabour && (
              <div className="checkout-summary-row">
                <span>Making Charge</span>
                <span>₹{totalLabourCost.toLocaleString()}</span>
              </div>
            )}
            {appliedDiscount && hasLabour && (
              <div className="checkout-summary-row checkout-discount-row">
                <span>Discount ({appliedDiscount.code})</span>
                <span className="checkout-discount">
                  - ₹{discountAmount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="checkout-summary-row">
              <span>Delivery Charge</span>
              <span>Free</span>
            </div>
            <div className="checkout-summary-row checkout-total-row">
              <span>Total Payable</span>
              <span className="total-amount">₹{total.toLocaleString()}</span>
            </div>
            <div className="checkout-summary-row">
              <span>Total Products</span>
              <span>{cartItemCount}</span>
            </div>
            <div className="checkout-summary-row">
              <span>Total Quantity</span>
              <span>{totalQuantity}</span>
            </div>
            <button
              type="button"
              className="checkout-proceed-btn"
              onClick={handleProceed}
              disabled={processing}
            >
              {processing ? "Processing..." : "Pay with Razorpay"}
            </button>
            <div className="checkout-summary-help">
              Any Questions?
              <br />
              Please Call us: {links.whatsapp}
            </div>
          </div>

          {/* GST Calculation Section */}
          <div className="checkout-card checkout-gst-calculation-card" style={{ marginTop: '20px' }}>
            <div className="checkout-summary-title" style={{ marginBottom: '15px', fontSize: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              GST DETAILS 
              {(!form.pincode || form.pincode.length < 6) && (
                <span style={{ fontSize: '12px', fontWeight: 'normal', textTransform: 'none', color: '#7b2b3e', marginLeft: '8px' }}>
                  (Fill the pincode and check GST amount)
                </span>
              )}
            </div>
            {!form.pincode || form.pincode.length < 6 ? (
              <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', padding: '10px', border: '1px dashed #ddd', borderRadius: '4px' }}>
                Waiting for pincode...
              </div>
            ) : !form.state ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '10px' }}>
                Detecting state from PIN code...
              </div>
            ) : (
              <div className="checkout-gst-breakdown">
                {form.state.toLowerCase().includes("rajasthan") ? (
                  <>
                    <div className="checkout-summary-row">
                      <span>Metal CGST (1.5% on ₹{metalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                      <span>₹{(metalGSTAmount / 2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="checkout-summary-row">
                      <span>Metal SGST (1.5% on ₹{metalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                      <span>₹{(metalGSTAmount / 2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {hasLabour && (
                      <>
                        <div className="checkout-summary-row">
                          <span>Labour CGST (2.5% on ₹{taxableLabour.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                          <span>₹{(labourGSTAmount / 2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="checkout-summary-row">
                          <span>Labour SGST (2.5% on ₹{taxableLabour.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                          <span>₹{(labourGSTAmount / 2).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="checkout-summary-row">
                      <span>Metal IGST (3% on ₹{metalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                      <span>₹{metalGSTAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    {hasLabour && (
                      <div className="checkout-summary-row">
                        <span>Labour IGST (5% on ₹{taxableLabour.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>
                        <span>₹{labourGSTAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="checkout-summary-row" style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px', fontWeight: 'bold' }}>
                  <span>Total GST Amount</span>
                  <span>₹{totalGSTAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {viewDetailsOpen && <CartDetailsPopup />}
      {notification && (
        <div className={`checkout-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default Checkout;
