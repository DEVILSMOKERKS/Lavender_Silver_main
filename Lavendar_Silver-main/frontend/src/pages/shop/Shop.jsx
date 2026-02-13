import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import "./shop.css";
import shopBanner from "../../assets/img/banner/shop-banner2.jpg";
import shopCart from "../../assets/img/banner/shop.jpg";
import shopBanner2 from "../../assets/img/banner/shop-ban.jpg";
import filterIcon from "../../assets/img/icons/filter.png";
import { useWishlistCart } from "../../context/wishlistCartContext";
import { useNotification } from "../../context/NotificationContext";
import axios from "axios";
import ProductComparisonPopup from "../product/ProductComparisonPopup";
import { useShopFilters } from "./hooks/useShopFilters";
import { useResponsive } from "./hooks/useResponsive";
import { filterProducts, sortProducts, generatePriceRanges } from "./utils/filterHelpers";
import { FILTER_BUTTONS, SORT_OPTIONS, GENDER_OPTIONS, OCCASION_OPTIONS, DISCOUNT_OPTIONS } from "./constants";
import FilterSidebar from "./components/FilterSidebar";
import MobileFilterDrawer from "./components/MobileFilterDrawer";
import ProductGrid from "./components/ProductGrid";
import HorizontalFilterBar from "./components/HorizontalFilterBar";

let API_BASE_URL = import.meta.env.VITE_API_URL;

function Shop() {
  const [imageIndexes, setImageIndexes] = useState({});
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const cartTimeoutRef = useRef();
  const [showComparisonPopup, setShowComparisonPopup] = useState(false);
  const [selectedProductForComparison, setSelectedProductForComparison] = useState(null);

  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const {
    cart,
    wishlist,
    addToCart: contextAddToCart,
    addToWishlist,
    removeFromWishlist,
  } = useWishlistCart();
  const { showNotification, showCustomNotification } = useNotification();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [subSubcategories, setSubSubcategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [shopBanners, setShopBanners] = useState(null);
  const [gemstoneCatalog, setGemstoneCatalog] = useState([]);

  const priceRanges = useMemo(() => generatePriceRanges(products), [products]);

  const filters = useShopFilters({
    categories,
    subcategories,
    subSubcategories,
    priceRanges,
    discounts,
    gemstoneCatalog,
  });

  let fallbackBanners = [
    { image: shopBanner, alt: "Shop Banner 1" },
    { image: shopBanner2, alt: "Shop Banner 2" },
    { image: shopCart, alt: "Shop Banner 3" },
  ];

  const getDisplayBanner = (bannerNumber) => {
    if (
      shopBanners &&
      shopBanners[
      `${["first", "second", "third"][bannerNumber - 1]}_banner_image`
      ]
    ) {
      let imageField = `${["first", "second", "third"][bannerNumber - 1]
        }_banner_image`;
      let altField = `${["first", "second", "third"][bannerNumber - 1]
        }_banner_alt`;

      return {
        src: shopBanners[imageField].startsWith("http")
          ? shopBanners[imageField]
          : `${API_BASE_URL}${shopBanners[imageField]}`,
        alt: shopBanners[altField] || `Banner ${bannerNumber}`,
      };
    } else {
      return {
        src: fallbackBanners[bannerNumber - 1].image,
        alt: fallbackBanners[bannerNumber - 1].alt,
      };
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = `${API_BASE_URL}/api/products`;
        let params = {};

        if (filters.activeFilter === "new") {
          endpoint = `${API_BASE_URL}/api/products/new-in`;
        } else if (filters.activeFilter === "bestseller") {
          endpoint = `${API_BASE_URL}/api/products/section/signature_pieces`;
        } else {
          // Fetch enough products so URL filters (category, subcategory, itemName) have data to filter client-side
          params = {
            sort_by: "created_at",
            sort_order: "DESC",
            limit: 500,
          };
        }

        const response = await axios.get(endpoint, { params });
        if (response.data && response.data.success) {
          setProducts(response.data.data || []);
        } else {
          setError("Failed to fetch products");
          showNotification("Failed to fetch products", "error");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        if (err.response?.status === 404) {
          setProducts([]);
          setError(null);
        } else {
          setError(err.message || "Failed to fetch products");
          showNotification("Error loading products", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/categories`);

        if (response.data && response.data.success) {
          setCategories(response.data.data || []);
        } else if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        console.error("Error details:", err.response?.data || err.message);
      }
    };

    const fetchSubcategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/subcategories`);

        if (response.data && response.data.success) {
          setSubcategories(response.data.data || []);
        } else if (response.data && Array.isArray(response.data)) {
          setSubcategories(response.data);
        }
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        console.error("Error details:", err.response?.data || err.message);
      }
    };

    const fetchSubSubcategories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/sub-subcategories`
        );

        if (response.data && response.data.success) {
          setSubSubcategories(response.data.data || []);
        } else if (response.data && Array.isArray(response.data)) {
          setSubSubcategories(response.data);
        }
      } catch (err) {
        console.error("Error fetching sub-subcategories:", err);
        console.error("Error details:", err.response?.data || err.message);
      }
    };

    const fetchDiscounts = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/discounts/frontend`
        );

        if (response.data && response.data.success) {
          setDiscounts(response.data.data || []);
        } else if (response.data && Array.isArray(response.data)) {
          setDiscounts(response.data);
        }
      } catch (err) {
        console.error("Error fetching discounts from frontend endpoint:", err);
        console.error("Error details:", err.response?.data || err.message);
      }
    };

    const fetchShopBanners = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/shop-banners`);

        if (response.data && response.data.success && response.data.data) {
          setShopBanners(response.data.data);
        } else {
          setShopBanners(null);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error fetching shop banners:", err);
        }
        setShopBanners(null);
      }
    };

    fetchProducts();
    fetchCategories();
    fetchSubcategories();
    fetchSubSubcategories();
    fetchDiscounts();
    fetchShopBanners();
  }, [filters.activeFilter, filters.clearFiltersTrigger, showNotification]);

  useEffect(() => {
    const fetchGemstoneCatalog = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/gemstone-catalog`
        );
        if (response.data && response.data.success) {
          setGemstoneCatalog(response.data.data || []);
        } else if (response.data && Array.isArray(response.data)) {
          setGemstoneCatalog(response.data);
        }
      } catch (err) {
        console.error("Error fetching gemstone catalog:", err);
      }
    };
    fetchGemstoneCatalog();
  }, []);

  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(
      products,
      {
        selectedCategories: filters.selectedCategories,
        selectedSubcategories: filters.selectedSubcategories,
        selectedSubSubcategories: filters.selectedSubSubcategories,
        selectedPriceRanges: filters.selectedPriceRanges,
        customPriceRange: filters.customPriceRange,
        selectedDiscounts: filters.selectedDiscounts,
        selectedGenders: filters.selectedGenders,
        selectedOccasions: filters.selectedOccasions,
        selectedGemstoneTypes: filters.selectedGemstoneTypes,
        itemNameFilter: filters.itemNameFilter,
      },
      categories,
      subcategories,
      subSubcategories,
      priceRanges,
      discounts,
      gemstoneCatalog
    );
    return sortProducts(filtered, filters.sortBy);
  }, [
    products,
    filters.selectedCategories,
    filters.selectedSubcategories,
    filters.selectedSubSubcategories,
    filters.selectedPriceRanges,
    filters.customPriceRange,
    filters.selectedDiscounts,
    filters.selectedGenders,
    filters.selectedOccasions,
    filters.selectedGemstoneTypes,
    filters.itemNameFilter,
    filters.sortBy,
    categories,
    subcategories,
    subSubcategories,
    priceRanges,
    discounts,
    gemstoneCatalog,
  ]);

  let priceRangeCounts = useMemo(() => {
    const counts = {};
    priceRanges.forEach(({ label, min, max }) => {
      counts[label] = products.filter((p) => {
        const productPrice = p.product_options?.[0]?.sell_price
          ? parseFloat(p.product_options[0].sell_price)
          : parseFloat(p.price || 0);
        return productPrice >= min && productPrice <= max;
      }).length;
    });
    return counts;
  }, [products, priceRanges]);

  let genderCounts = useMemo(() => {
    const counts = {};
    GENDER_OPTIONS.forEach(({ value }) => {
      counts[value] = products.filter((p) => {
        if (p.product_options && Array.isArray(p.product_options)) {
          return p.product_options.some((option) => {
            if (option.gender) {
              const genders = option.gender
                .split(",")
                .map((g) => g.trim().toLowerCase());
              return genders.includes(value.toLowerCase());
            }
            return false;
          });
        }
        return false;
      }).length;
    });
    return counts;
  }, [products]);

  let occasionCounts = useMemo(() => {
    const counts = {};
    OCCASION_OPTIONS.forEach(({ value }) => {
      counts[value] = products.filter((p) => {
        if (p.product_options && Array.isArray(p.product_options)) {
          return p.product_options.some((option) => {
            if (option.occasion) {
              const occasions = option.occasion
                .split(",")
                .map((o) => o.trim().toLowerCase());
              return occasions.includes(value.toLowerCase());
            }
            return false;
          });
        }
        return false;
      }).length;
    });
    return counts;
  }, [products]);

  const handlePrevImage = (productId, imagesLength) => {
    setImageIndexes((prev) => ({
      ...prev,
      [productId]:
        prev[productId] === undefined
          ? imagesLength - 1
          : (prev[productId] - 1 + imagesLength) % imagesLength,
    }));
  };

  const handleNextImage = (productId, imagesLength) => {
    setImageIndexes((prev) => ({
      ...prev,
      [productId]:
        prev[productId] === undefined
          ? 1 % imagesLength
          : (prev[productId] + 1) % imagesLength,
    }));
  };

  const handleComparisonClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProductForComparison(product);
    setShowComparisonPopup(true);
  };

  const handleComparisonProductSelect = (selectedProduct) => {
    if (selectedProductForComparison && selectedProduct) {
      navigate(
        `/compare/${selectedProductForComparison.id}/${selectedProduct.id}`
      );
    }
  };

  const handleAddToCart = (product) => {
    const firstOption =
      Array.isArray(product.product_options) &&
        product.product_options.length > 0
        ? product.product_options[0]
        : {};

    let productWithImageAndOptions = {
      ...product,
      image: product.images?.[0]?.image_url
        ? `${API_BASE_URL}${product.images[0].image_url}`
        : product.image
          ? product.image
          : product.img
            ? product.img
            : "",
      product_option_id: firstOption.id ? firstOption.id : null,
      product_id: product.id,
      quantity: 1,
    };

    contextAddToCart(productWithImageAndOptions);
    showCustomNotification({
      type: "cart",
      product: productWithImageAndOptions,
      action: "add",
    });
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
  };

  const handleAddToWishlist = (product) => {
    const firstOption =
      Array.isArray(product.product_options) &&
        product.product_options.length > 0
        ? product.product_options[0]
        : {};

    let productWithOptions = {
      ...product,
      image: product.images?.[0]?.image_url
        ? `${API_BASE_URL}${product.images[0].image_url}`
        : product.image
          ? product.image
          : product.img
            ? product.img
            : "",
      product_option_id: firstOption.id ? firstOption.id : null,
      product_id: product.id,
    };

    addToWishlist(productWithOptions);
  };

  const handleRemoveFromWishlist = (id) => {
    removeFromWishlist(id);
  };

  if (loading) {
    return (
      <div className="shop-container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            fontSize: "1.2rem",
            color: "#666",
          }}
        >
          Loading products...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-container">
        <div className="shop-error-container">
          <div className="shop-error-content">
            <div className="shop-error-icon">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="#0e593c"
                />
              </svg>
            </div>
            <h2 className="shop-error-title">Oops! Something went wrong</h2>
            <p className="shop-error-message">
              We're having trouble loading the shop right now. This might be due
              to a network issue or our servers being temporarily unavailable.
            </p>
            <div className="shop-error-actions">
              <button
                onClick={() => window.location.reload()}
                className="shop-error-retry-btn"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                    fill="currentColor"
                  />
                </svg>
                Try Again
              </button>
              <Link to="/" className="shop-error-home-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
                    fill="currentColor"
                  />
                </svg>
                Go to Home
              </Link>
            </div>
            <div className="shop-error-help">
              <p>If the problem persists, please:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
                <li>Contact our support team</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container">
      <MobileFilterDrawer
        isOpen={showMobileFilter}
        onClose={() => setShowMobileFilter(false)}
        filters={filters}
        categories={categories}
        subcategories={subcategories}
        subSubcategories={subSubcategories}
        priceRanges={priceRanges}
        discounts={discounts}
        priceRangeCounts={priceRangeCounts}
        genderCounts={genderCounts}
        occasionCounts={occasionCounts}
      />
      <nav className="shop-breadcrumb">
        <Link to="/" className="shop-breadcrumb-link">
          Home
        </Link>
        <span className="shop-breadcrumb-separator">&gt;</span>
        <span className="shop-breadcrumb-current">Shop Page</span>
      </nav>
      <div className="shop-banner">
        <img
          src={getDisplayBanner(1).src}
          alt={getDisplayBanner(1).alt}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Section Title */}
      <div className="shop-section-title">
        <h2 className="shop-section-title-text">
          {filters.selectedSubcategories.length > 0
            ? `${filters.selectedSubcategories.join(", ")}`
            : filters.selectedCategories.length > 0
              ? `${filters.selectedCategories.join(", ")}`
              : filters.itemNameFilter
                ? `${filters.itemNameFilter.charAt(0).toUpperCase() + filters.itemNameFilter.slice(1)}`
                : "Valentine Forever"}
          <span className="shop-section-title-count"> ({filteredProducts.length} Designs)</span>
        </h2>
      </div>

      {/* Horizontal Filter Bar */}
      <div className="shop-filter-bar-container">
        <HorizontalFilterBar
          filters={filters}
          categories={categories}
          subcategories={subcategories}
          priceRanges={priceRanges}
          genderOptions={GENDER_OPTIONS}
          occasionOptions={OCCASION_OPTIONS}
          gemstoneCatalog={gemstoneCatalog}
          onFilterChange={(key, value) => {
            switch(key) {
              case 'productType':
                filters.handleCategoryChange(value);
                break;
              case 'price':
                if (value && typeof value === 'object' && value.min !== undefined) {
                  filters.handlePriceRangeChange({ min: value.min, max: value.max });
                }
                break;
              case 'shopFor':
                filters.handleGenderChange(value);
                break;
              case 'subCategory':
                filters.handleSubcategoryChange(value);
                break;
            }
          }}
        />
        <div className="shop-sort-container">
          <select
            className="shop-sort-select"
            value={filters.sortBy}
            onChange={(e) => filters.handleSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label === "Sort by: Featured" ? "Sort by: Best selling" : opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="shop-sort-chevron"
            size={14}
          />
        </div>
      </div>
      <div
        className="shop-mobile-filter-sort-row"
        style={{ position: "relative" }}
      >
        <button
          className="shop-mobile-filter-btn"
          onClick={() => setShowMobileFilter(true)}
        >
          Filter{" "}
          <span className="shop-mobile-filter-icon">
            <img
              src={filterIcon}
              alt="filterIcon"
              loading="lazy"
              decoding="async"
            />
          </span>
        </button>
        <div style={{ position: "relative" }}>
          <select
            className="shop-category-bar-sort shop-mobile-sort-select"
            value={filters.sortBy}
            onChange={(e) => {
              filters.handleSortChange(e.target.value);
            }}
            style={{ paddingRight: "2.2rem", width: "max-content" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            style={{
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#fff",
              width: "1em",
              height: "1.2em",
            }}
          />
        </div>
      </div>
      <div className="shop-flex shop-flex-no-sidebar">
        <ProductGrid
          products={filteredProducts}
          imageIndexes={imageIndexes}
          cart={cart}
          wishlist={wishlist}
          API_BASE_URL={API_BASE_URL}
          activeFilter={filters.activeFilter}
          onPrevImage={handlePrevImage}
          onNextImage={handleNextImage}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onRemoveFromWishlist={handleRemoveFromWishlist}
          onComparisonClick={handleComparisonClick}
          onClearFilters={filters.clearAllFilters}
        />
      </div>

      {showComparisonPopup && selectedProductForComparison && (
        <ProductComparisonPopup
          isOpen={showComparisonPopup}
          onClose={() => {
            setShowComparisonPopup(false);
            setSelectedProductForComparison(null);
          }}
          currentProductId={selectedProductForComparison.id}
          onProductSelect={(selectedProduct) => handleComparisonProductSelect(selectedProduct)}
        />
      )}
    </div>
  );
}

export default Shop;
