import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./predictionCard.css";
import diamondImg from "../../assets/img/icons/diamond.png";
import WrapperWithLove from "../../assets/img/wrapper-with-love.png?w=105&format=webp&q=75";
import JewelleryDiamondIcon from "../../assets/img/icons/jewelry-diamond.png";
import necklace from "../../assets/img/wrrpaed with love1.jpg";
import bangle from "../../assets/img/wrrpaed with love2.jpg";
import necklace2 from "../../assets/img/wrrpaed with love3.jpg";
import { Link } from "react-router-dom";
import { ArrowDownCircle, ArrowUpCircle, IndianRupee } from "lucide-react";
import { getResponsiveImage } from "../../utils/responsiveImage";

const API_BASE_URL = import.meta.env.VITE_API_URL; // Adjust if needed

const PredictionCard = React.memo(
  ({
    title,
    currentPrice,
    priceChange,
    predictedPrice,
    confidence,
    timeframe,
    recommendBuy,
    recommendBuyText,
    marketAnalysis,
  }) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;

    // Ensure recommendBuy is boolean - handle 1, '1', true, or any truthy value
    const shouldRecommendBuy =
      recommendBuy === true ||
      recommendBuy === 1 ||
      recommendBuy === "1" ||
      Boolean(recommendBuy);
    
    // Theme based on price change percentage - if price is increasing (positive), green-theme, else red-theme
    const priceChangeValue = parseFloat(priceChange) || 0;
    const themeClass = priceChangeValue >= 0 ? "green-theme" : "red-theme";
    
    // Get recommendation text - use recommendBuyText if available, otherwise fallback to default
    const getRecommendationText = () => {
      if (recommendBuyText && recommendBuyText.trim()) {
        return recommendBuyText.trim();
      }
      // Fallback to default text based on price change
      return priceChangeValue >= 0 ? "Recommend to Buy" : "Recommend to Sell";
    };

    return (
      <div className={`prediction-card-2024 ${themeClass}`}>
        <div className="pcard-header">
          <div className="pcard-header-row">
            <span className="pcard-title">{title}</span>
            <span className="pcard-header-icon">
              {parseFloat(priceChange) >= 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  style={{
                    color: "#10b981",
                    width: "24px",
                    height: "24px",
                    display: "block",
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  style={{
                    color: "#ef4444",
                    width: "24px",
                    height: "24px",
                    display: "block",
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"
                  />
                </svg>
              )}
            </span>
          </div>
          <div className="pcard-prices-row">
            <div className="pcard-price-block">
              <div className="pcard-label">Prediction Price</div>
              <div className="pcard-price">
                <IndianRupee size={16} style={{ marginRight: 2 }} />
                {currentPrice}
              </div>
            </div>
            <div className="pcard-price-block predicted-price-block">
              <div className="pcard-label">Prediction Price Range</div>
              <div className="pcard-price">
                <IndianRupee size={16} style={{ marginRight: 2 }} />
                {predictedPrice}
              </div>
            </div>
          </div>
        </div>
        <div className="pcard-body-lightgreen">
          <div className="pcard-metrics-row">
            <div className="pcard-metric">
              <div className="pcard-metric-icon">
                {priceChange >= 0 ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181"
                    />
                  </svg>
                )}
              </div>
              <div className="pcard-metric-label">
                {isMobile ? "Current Price" : "Price Change"}
              </div>
              <div
                className={`pcard-metric-value ${
                  priceChange >= 0 ? "positive" : "negative"
                }`}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange}%
              </div>
            </div>
            <div className="pcard-metric">
              <div className="pcard-metric-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L4 5V11C4 16 8 20 12 22C16 20 20 16 20 11V5L12 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="pcard-metric-label">
                Confidence
              </div>
              <div className="pcard-metric-value confidence">{confidence}%</div>
            </div>
            <div className="pcard-metric">
              <div className="pcard-metric-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 6V12L16 14"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="pcard-metric-label">
                {isMobile ? "Timeframe" : "Forecast Period"}
              </div>
              <div className="pcard-metric-value timeframe">{timeframe}</div>
            </div>
          </div>
          <div className="pcard-analysis">
            <div className="pcard-analysis-label">Market Analysis</div>
            <div className="pcard-analysis-desc">
              {marketAnalysis ||
                (shouldRecommendBuy
                  ? "Prices show strong upward momentum due to increasing global demand and favorable market conditions. Consider investing now for potential gains."
                  : "Market indicates moderate volatility with potential for price stabilization. Monitor market conditions before making investment decisions.")}
            </div>
            <div
              className={`pcard-recommend ${
                priceChangeValue >= 0 ? "buy" : "sell"
              }`}
            >
              <span className="pcard-recommend-icon">
                {priceChange <= 0 ? (
                  <>
                    <ArrowDownCircle
                      size={28}
                      strokeWidth={2.5}
                      color="#ef4444"
                    />
                    <span className="pcard-recommend-text">
                      {getRecommendationText()}
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle size={28} strokeWidth={2.5} color="#10b981" />
                    <span className="pcard-recommend-text">
                      {getRecommendationText()}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PredictionCard.displayName = "PredictionCard";

const WrappedWithLove = () => {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchWrappedWithLoveData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/home-banners/wrapped-love`
        );

        if (
          response.data.success &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          // Transform backend data to match component structure
          const backendProducts = response.data.data.map((item) => {
            const imageUrl = item.image_url || item.image;

            // Generate category slug from category name
            const generateCategorySlug = (categoryName) => {
              if (!categoryName) return null;
              return categoryName
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
            };

            const categorySlug = generateCategorySlug(item.category_name);

            const transformedProduct = {
              name: item.title || item.name || "Product",
              image: imageUrl ? `${API_BASE_URL}${imageUrl}` : null,
              slug:
                item.slug ||
                item.title?.toLowerCase().replace(/\s+/g, "-") ||
                "product",
              category_slug: categorySlug,
            };

            return transformedProduct;
          });
          setProducts(backendProducts);
        } else {
          // No fallback - show empty state
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching wrapped with love data:", error);
        // No fallback - show empty state
        setProducts([]);
      }
    };

    fetchWrappedWithLoveData();
  }, []);

  // Professional drag-to-scroll logic (mouse + touch, no grabbing cursor)
  const pos = useRef({ left: 0, x: 0, isDown: false });

  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    // Mouse events
    const onMouseDown = (e) => {
      pos.current = {
        isDown: true,
        x: e.pageX,
        left: slider.scrollLeft,
      };
      document.body.classList.add("no-select");
    };
    const onMouseMove = (e) => {
      if (!pos.current.isDown) return;
      const dx = e.pageX - pos.current.x;
      slider.scrollLeft = pos.current.left - dx;
    };
    const onMouseUp = () => {
      pos.current.isDown = false;
      document.body.classList.remove("no-select");
    };

    // Touch events
    const onTouchStart = (e) => {
      const touch = e.touches[0];
      pos.current = {
        isDown: true,
        x: touch.pageX,
        left: slider.scrollLeft,
      };
    };
    const onTouchMove = (e) => {
      if (!pos.current.isDown) return;
      const touch = e.touches[0];
      const dx = touch.pageX - pos.current.x;
      slider.scrollLeft = pos.current.left - dx;
    };
    const onTouchEnd = () => {
      pos.current.isDown = false;
    };

    slider.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    slider.addEventListener("touchstart", onTouchStart, { passive: false });
    slider.addEventListener("touchmove", onTouchMove, { passive: false });
    slider.addEventListener("touchend", onTouchEnd);

    return () => {
      slider.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      slider.removeEventListener("touchstart", onTouchStart);
      slider.removeEventListener("touchmove", onTouchMove);
      slider.removeEventListener("touchend", onTouchEnd);
      document.body.classList.remove("no-select");
    };
  }, []);

  return (
    <section className="wrapped-banner">
      {/* Mobile-only decorative images */}
      <img
        src={JewelleryDiamondIcon}
        alt="mobile decor"
        className="mobile-decor mobile-decor-top-left"
        loading="lazy"
        decoding="async"
        width="100"
        height="100"
      />
      <img
        src={JewelleryDiamondIcon}
        alt="mobile decor"
        className="mobile-decor mobile-decor-top-right"
        loading="lazy"
        decoding="async"
        width="100"
        height="100"
      />
      <img
        src={JewelleryDiamondIcon}
        alt="mobile decor"
        className="mobile-decor mobile-decor-bottom-center"
        loading="lazy"
        decoding="async"
        width="100"
        height="100"
      />
      {/* Top right corner diamond icon */}
      <div className="wrapped-top-right-icon">
        <img
          src={JewelleryDiamondIcon}
          alt="Diamond Icon"
          loading="lazy"
          decoding="async"
          width="100"
          height="100"
        />
      </div>
      {/* Center left corner diamond icon */}
      <div className="wrapped-center-left-icon">
        <img
          src={JewelleryDiamondIcon}
          alt="Diamond Icon"
          loading="lazy"
          decoding="async"
          width="100"
          height="100"
        />
      </div>

      <div className="wrapped-row">
        <div className="wrapped-left">
          <img
            src={WrapperWithLove}
            alt="Wrapped With Love"
            className="wrapped-icon"
            loading="lazy"
            decoding="async"
            width="80"
            height="80"
            sizes="80px"
          />
          <span className="wrapped-title">
            <span className="wrapped-title-main">Wrapped </span>
            <span className="wrapped-title-with">With&nbsp;</span>
            <span className="wrapped-title-love">Love</span>
          </span>
        </div>
        <div className="wrapped-products" ref={scrollRef}>
          {products.length > 0 ? (
            products.map((product, i) => {
              // Generate proper link URL based on category availability
              const linkUrl = product.category_slug
                ? `/shop?category=${product.category_slug}`
                : `/product/${product.slug}`;

              return (
                <div key={i} className="wrapped-product-item">
                  <Link
                    to={linkUrl}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={
                        product.image?.includes("backend.pvjewellers.in") ||
                        (product.image?.startsWith("/") &&
                          !product.image?.startsWith("/assets"))
                          ? getResponsiveImage(product.image, {
                              thumbnail: 100,
                              card: 140,
                              full: 140,
                              quality: 55,
                            }).src
                          : product.image
                      }
                      srcSet={
                        product.image?.includes("backend.pvjewellers.in") ||
                        (product.image?.startsWith("/") &&
                          !product.image?.startsWith("/assets"))
                          ? getResponsiveImage(product.image, {
                              thumbnail: 100,
                              card: 140,
                              full: 140,
                              quality: 55,
                            }).srcSet
                          : undefined
                      }
                      sizes="(max-width: 600px) 100px, 140px"
                      alt={product.name}
                      draggable="false"
                      loading="lazy"
                      decoding="async"
                      width="140"
                      height="140"
                    />
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="no-products-message">No products available</div>
          )}
        </div>
      </div>
    </section>
  );
};

const Gallery = () => {
  const [galleryData, setGalleryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch both mobile and desktop gallery items - browser will select via <picture> element
  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        setLoading(true);
        const [mobileResponse, desktopResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/gallery?device_type=mobile`),
          axios.get(`${API_BASE_URL}/api/gallery?device_type=desktop`),
        ]);

        const mobileItems = mobileResponse.data?.success
          ? mobileResponse.data.data.filter(
              (item) => item.is_active === 1 || item.is_active === true
            )
          : [];
        const desktopItems = desktopResponse.data?.success
          ? desktopResponse.data.data.filter(
              (item) => item.is_active === 1 || item.is_active === true
            )
          : [];

        // Create a map to combine mobile and desktop images by position
        const galleryMap = new Map();

        // Add mobile items
        mobileItems.forEach((item) => {
          if (!galleryMap.has(item.position)) {
            galleryMap.set(item.position, {
              mobile: null,
              desktop: null,
              ...item,
            });
          }
          const existing = galleryMap.get(item.position);
          existing.mobile = item.imageUrl
            ? `${API_BASE_URL}${item.imageUrl}`
            : null;
          existing.title = item.title || existing.title;
          existing.category_name = item.category_name || existing.category_name;
        });

        // Add desktop items
        desktopItems.forEach((item) => {
          if (!galleryMap.has(item.position)) {
            galleryMap.set(item.position, {
              mobile: null,
              desktop: null,
              ...item,
            });
          }
          const existing = galleryMap.get(item.position);
          existing.desktop = item.imageUrl
            ? `${API_BASE_URL}${item.imageUrl}`
            : null;
          existing.title = item.title || existing.title;
          existing.category_name = item.category_name || existing.category_name;
        });

        // Convert map to array, sort by position, take first 3
        const combinedGallery = Array.from(galleryMap.values())
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .slice(0, 3);

        setGalleryData(combinedGallery);
      } catch (err) {
        console.error("Error fetching gallery data:", err);
        setError("Failed to load gallery.");
        setGalleryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  if (loading) {
    return <div className="gallery-section loading">Loading gallery...</div>;
  }

  if (!galleryData || galleryData.length === 0) {
    // Show fallback images when no gallery data is available
    const fallbackImages = [necklace, bangle, necklace2];

    return (
      <section className="gallery-section">
        <div className="gallery-left">
          <Link
            to="/shop?category=necklaces"
            style={{ display: "block", height: "100%" }}
          >
            <img
              src={fallbackImages[0]}
              alt="Gallery image"
              loading="lazy"
              decoding="async"
              width="700"
              height="525"
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ cursor: "pointer", width: "100%" }}
            />
          </Link>
        </div>
        <div className="gallery-right">
          <div className="gallery-right-top">
            <Link
              to="/shop?category=necklaces"
              style={{ display: "block", height: "100%" }}
            >
              <img
                src={fallbackImages[1]}
                alt="Gallery image"
                loading="lazy"
                decoding="async"
                width="700"
                height="525"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ cursor: "pointer", width: "100%" }}
              />
            </Link>
          </div>
          <div className="gallery-right-bottom">
            <Link
              to="/shop?category=rings"
              style={{ display: "block", height: "100%" }}
            >
              <img
                src={fallbackImages[2]}
                alt="Gallery image"
                loading="lazy"
                decoding="async"
                width="700"
                height="525"
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ cursor: "pointer", width: "100%" }}
              />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Helper function to get category name for shop filtering
  const getCategoryForShop = (categoryName) => {
    if (!categoryName) return "Gallery";
    return categoryName; // Use the actual category name as it comes from the backend
  };

  return (
    <section className="gallery-section">
      <div className="gallery-left">
        <Link
          to={`/shop?category=${getCategoryForShop(
            galleryData[0]?.category_name
          )}`}
          style={{ display: "block", height: "100%" }}
        >
          <picture>
            {galleryData[0]?.mobile && (
              <source
                srcSet={galleryData[0].mobile}
                media="(max-width: 768px)"
                type="image/webp"
              />
            )}
            {galleryData[0]?.desktop && (
              <source
                srcSet={galleryData[0].desktop}
                media="(min-width: 769px)"
                type="image/webp"
              />
            )}
            <img
              src={
                galleryData[0]?.desktop || galleryData[0]?.mobile || necklace
              }
              alt={galleryData[0]?.title || "Gallery image"}
              loading="lazy"
              decoding="async"
              width="700"
              height="525"
              style={{ cursor: "pointer", width: "100%", height: "auto" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = necklace;
              }}
            />
          </picture>
        </Link>
      </div>
      <div className="gallery-right">
        <div className="gallery-right-top">
          <Link
            to={`/shop?category=${getCategoryForShop(
              galleryData[1]?.category_name
            )}`}
            style={{ display: "block", height: "100%" }}
          >
            <picture>
              {galleryData[1]?.mobile && (
                <source
                  srcSet={galleryData[1].mobile}
                  media="(max-width: 768px)"
                  type="image/webp"
                />
              )}
              {galleryData[1]?.desktop && (
                <source
                  srcSet={galleryData[1].desktop}
                  media="(min-width: 769px)"
                  type="image/webp"
                />
              )}
              <img
                src={
                  galleryData[1]?.desktop || galleryData[1]?.mobile || bangle
                }
                alt={galleryData[1]?.title || "Gallery image"}
                loading="lazy"
                decoding="async"
                width="700"
                height="525"
                style={{ cursor: "pointer", width: "100%", height: "auto" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = bangle;
                }}
              />
            </picture>
          </Link>
        </div>
        <div className="gallery-right-bottom">
          <Link
            to={`/shop?category=${getCategoryForShop(
              galleryData[2]?.category_name
            )}`}
            style={{ display: "block", height: "100%" }}
          >
            <picture>
              {galleryData[2]?.mobile && (
                <source
                  srcSet={galleryData[2].mobile}
                  media="(max-width: 768px)"
                  type="image/webp"
                />
              )}
              {galleryData[2]?.desktop && (
                <source
                  srcSet={galleryData[2].desktop}
                  media="(min-width: 769px)"
                  type="image/webp"
                />
              )}
              <img
                src={
                  galleryData[2]?.desktop || galleryData[2]?.mobile || necklace2
                }
                alt={galleryData[2]?.title || "Gallery image"}
                loading="lazy"
                decoding="async"
                width="700"
                height="525"
                style={{ cursor: "pointer", width: "100%", height: "auto" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = necklace2;
                }}
              />
            </picture>
          </Link>
        </div>
      </div>
      {error && <div className="gallery-error">{error}</div>}
    </section>
  );
};

const Prediction = React.memo(function Prediction() {
  const [isMobile, setIsMobile] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch predictions data
  const fetchPredictions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Try managed predictions first (from database)
      try {
        const managedResponse = await axios.get(
          `${API_BASE_URL}/api/metal-rates/predictions/managed`
        );
        if (
          managedResponse.data.success &&
          managedResponse.data.data.gold &&
          managedResponse.data.data.silver
        ) {
          setPredictions(managedResponse.data.data);
          return;
        }
      } catch (managedError) {
        console.error("Error fetching managed predictions:", managedError);
      }

      // Fallback to algorithm-based predictions
      const response = await axios.get(
        `${API_BASE_URL}/api/metal-rates/predictions`
      );

      if (response.data.success) {
        setPredictions(response.data.data);
      } else {
        throw new Error("Failed to fetch predictions");
      }
    } catch (err) {
      console.error("Error fetching predictions:", err);
      setError("Failed to load live data. Using default predictions.");

      // Fallback to static data
      setPredictions({
        gold: {
          currentPrice: 62450,
          predictedPrice: 63200,
          priceChange: 2.3,
          confidence: 85,
          timeframe: "24 hours",
          recommendBuy: true,
        },
        silver: {
          currentPrice: 72340,
          predictedPrice: 71900,
          priceChange: -1.8,
          confidence: 75,
          timeframe: "24 hours",
          recommendBuy: false,
        },
        lastUpdated: new Date().toISOString(),
        source: "fallback",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPredictions();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    // Throttle resize events
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Format price with commas
  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "0";
    }
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="prediction-container">
      <div className="prediction-header">
        <div className="logo-container">
          <img
            src={diamondImg}
            alt="Diamond Logo"
            className="diamond-img"
            loading="lazy"
            decoding="async"
            width="100"
            height="100"
          />
        </div>
        <div className="prediction-header-title-wrapper">
          <span className="prediction-header-line"></span>
          <h1>PVJ PREDICTION</h1>
          <span className="prediction-header-line"></span>
        </div>
        <p>
          Expert Gold & Silver Price Predictions Using Advanced Analytics for
          Smart Investment Decisions
        </p>
        {error && <div className="prediction-error">⚠️ {error}</div>}
      </div>

      <div className="cards-container">
        {loading ? (
          <div className="prediction-loading">Loading live predictions...</div>
        ) : predictions ? (
          <>
            <PredictionCard
              title="Gold"
              currentPrice={formatPrice(predictions.gold?.currentPrice)}
              priceChange={predictions.gold?.priceChange || 0}
              predictedPrice={formatPrice(predictions.gold?.predictedPrice)}
              confidence={predictions.gold?.confidence || 0}
              timeframe={predictions.gold?.timeframe || "24 hours"}
              recommendBuy={predictions.gold?.recommendBuy}
              recommendBuyText={predictions.gold?.recommendBuyText}
              marketAnalysis={predictions.gold?.marketAnalysis}
            />
            <PredictionCard
              title="Silver"
              currentPrice={formatPrice(predictions.silver?.currentPrice)}
              priceChange={predictions.silver?.priceChange || 0}
              predictedPrice={formatPrice(predictions.silver?.predictedPrice)}
              confidence={predictions.silver?.confidence || 0}
              timeframe={predictions.silver?.timeframe || "24 hours"}
              recommendBuy={predictions.silver?.recommendBuy}
              recommendBuyText={predictions.silver?.recommendBuyText}
              marketAnalysis={predictions.silver?.marketAnalysis}
            />
          </>
        ) : (
          <div className="prediction-no-data">No prediction data available</div>
        )}
      </div>
      {isMobile ? (
        <>
          <Gallery />
          <WrappedWithLove />
        </>
      ) : (
        <>
          <WrappedWithLove />
          <Gallery />
        </>
      )}
    </div>
  );
});

Prediction.displayName = "Prediction";
PredictionCard.displayName = "PredictionCard";

export default Prediction;
