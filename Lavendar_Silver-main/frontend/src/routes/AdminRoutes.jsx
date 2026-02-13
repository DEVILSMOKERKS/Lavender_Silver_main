import React, { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import SEOHelmet from "../components/SEOHelmet";
import { ADMIN_SEO_META } from "../components/ADMIN_SEO_META";
import AppLoader from "../components/Loader/AppLoader";

// Lazy load all admin route components for better code splitting
const MSME = lazy(() => import("../admin/MSME"));
const Dashboard = lazy(() => import("../admin/page/Dashboard/Dashboard"));
const OrdersManagement = lazy(() =>
  import("../admin/page/Orders&Consultations/OrdersManagement/OrdersManagement")
);
const VideoConsultations = lazy(() =>
  import("../admin/page/Orders&Consultations/VideoConsultations")
);
const CartManagement = lazy(() =>
  import("../admin/page/Orders&Consultations/OrdersManagement/CartManagement")
);
const ProductListing = lazy(() =>
  import("../admin/page/productInventory/ProductListing")
);
const WishlistMonitoring = lazy(() =>
  import("../admin/page/productInventory/WishlistMonitoring")
);
const CertificateManagement = lazy(() =>
  import("../admin/page/productInventory/CertificateManagement")
);
const CartAndDiscount = lazy(() =>
  import("../admin/page/carts&Discounts/CartAndDiscount")
);
const DiscountManagement = lazy(() =>
  import("../admin/page/carts&Discounts/DiscountManagement")
);
const PincodeManagement = lazy(() =>
  import("../admin/page/PincodeManagement/PincodeManagement")
);
const ProductDelivery = lazy(() =>
  import("../admin/page/PincodeManagement/ProductDelivery")
);
const EmailAutomation = lazy(() =>
  import("../admin/page/marketing-insight/EmailAutomation")
);
const ReviewRating = lazy(() =>
  import("../admin/page/marketing-insight/ReviewRating")
);
const MostSellingProducts = lazy(() =>
  import("../admin/page/marketing-insight/MostSellingProducts")
);
const MostSellingLocations = lazy(() =>
  import("../admin/page/marketing-insight/MostSellingLocations")
);
const RatePradiction = lazy(() =>
  import("../admin/page/Gold&Silver/RatePradiction")
);
const PredictionManagement = lazy(() =>
  import("../admin/page/Gold&Silver/PredictionManagement")
);
const CmsTracker = lazy(() => import("../admin/page/cms-content/CmsTracker"));
const BlogGuide = lazy(() => import("../admin/page/cms-content/BlogGuide"));
const SocialLinks = lazy(() => import("../admin/page/cms-content/SocialLinks"));
const DigitalGoldOverview = lazy(() =>
  import("../admin/page/digital-gold-overview/DigitalGoldOverview")
);
const PlanControllerCenter = lazy(() =>
  import("../admin/page/plan-controller-center/PlanControllerCenter")
);
const UserAccount = lazy(() =>
  import("../admin/page/UserManagement/UserAccount")
);
const SupportTicket = lazy(() =>
  import("../admin/page/UserManagement/SupportTicket")
);
const ContactManagement = lazy(() =>
  import("../admin/page/UserManagement/ContactManagement")
);
const EliteMemberManagement = lazy(() =>
  import("../admin/page/UserManagement/EliteMemberManagement")
);
const RateUpdateSetting = lazy(() =>
  import("../admin/page/Gold&Silver/RateUpdateSetting")
);
const HeroBanner = lazy(() =>
  import("../admin/page/cms-content/hero-banner/HeroBanner")
);
const FeaturedImages = lazy(() =>
  import("../admin/page/cms-content/FeaturedImages")
);
const Productcatlog = lazy(() =>
  import("../admin/page/productInventory/productCatelog/Productcatlog")
);
const AdminWrappedWithLove = lazy(() =>
  import("../admin/page/cms-content/wrapped-with-love/AdminWrappedWithLove")
);
const AdminSecondFeatureCat = lazy(() =>
  import(
    "../admin/page/cms-content/second-feature-category/AdminSecondFeatureCat"
  )
);
const AdminInstaImages = lazy(() =>
  import("../admin/page/cms-content/instagram-images/AdminInstaImages")
);
const AboutUsManagement = lazy(() =>
  import("../admin/page/cms-content/AboutUsManagement")
);
const FaqManagement = lazy(() =>
  import("../admin/page/cms-content/FaqManagement")
);
const ReturnPolicyManagement = lazy(() =>
  import("../admin/page/cms-content/ReturnPolicyManagement")
);
const PrivacyPolicyManagement = lazy(() =>
  import("../admin/page/cms-content/PrivacyPolicyManagement")
);
const TermsConditionsManagement = lazy(() =>
  import("../admin/page/cms-content/TermsConditionsManagement")
);
const ShippingPolicyManagement = lazy(() =>
  import("../admin/page/cms-content/ShippingPolicyManagement")
);
const ShopBannerManagement = lazy(() =>
  import("../admin/page/cms-content/ShopBannerManagement")
);
const ClientDiaryManagement = lazy(() =>
  import("../admin/page/cms-content/ClientDiaryManagement")
);
const ProductBannerCMS = lazy(() =>
  import("../admin/page/cms-content/ProductBannerCMS")
);
const AdminGallery = lazy(() =>
  import("../admin/page/cms-content/gallery/AdminGallery")
);
const OfferCarouselAdmin = lazy(() =>
  import("../admin/page/cms-content/offercarouseladmin/OfferCarouselAdmin")
);
const ChatbotQAManagement = lazy(() =>
  import("../admin/page/ChatbotQAManagement/ChatbotQAManagement")
);
const CustomJewelryManagement = lazy(() =>
  import("../admin/page/custom-jewelry/CustomJewelryManagement")
);
const FacebookPixel = lazy(() =>
  import("../admin/page/marketing-insight/FacebookPixel")
);
const GemstoneCatalog = lazy(() =>
  import("../admin/page/productInventory/productCatelog/GemstoneCatalog")
);
const Admin404 = lazy(() => import("../admin/components/Admin404/Admin404"));

function SEOPage({ element: Element, metaKey }) {
  const location = useLocation();
  const meta =
    ADMIN_SEO_META[metaKey] ||
    ADMIN_SEO_META[location.pathname] ||
    ADMIN_SEO_META["*"];
  return (
    <>
      <SEOHelmet {...meta} />
      {Element && <Element />}
    </>
  );
}

const AdminRoutes = () => (
  <main>
    <Suspense fallback={<AppLoader />}>
      <Routes>
        <Route
          path="/admin"
          element={<SEOPage element={MSME} metaKey="/admin" />}
        >
          <Route
            path="dashboard"
            element={<SEOPage element={Dashboard} metaKey="/admin/dashboard" />}
          />
          <Route path="orders">
            <Route
              path="orders-management"
              element={
                <SEOPage
                  element={OrdersManagement}
                  metaKey="/admin/orders/orders-management"
                />
              }
            />
            <Route
              path="video-consultations"
              element={
                <SEOPage
                  element={VideoConsultations}
                  metaKey="/admin/orders/video-consultations"
                />
              }
            />
            <Route
              path="cart-management"
              element={
                <SEOPage
                  element={CartManagement}
                  metaKey="/admin/orders/cart-management"
                />
              }
            />
          </Route>
          <Route path="products">
            <Route
              path="listing"
              element={
                <SEOPage
                  element={ProductListing}
                  metaKey="/admin/products/listing"
                />
              }
            />
            <Route
              path="wishlist-monitoring"
              element={
                <SEOPage
                  element={WishlistMonitoring}
                  metaKey="/admin/products/wishlist-monitoring"
                />
              }
            />
            <Route
              path="certificate-management"
              element={
                <SEOPage
                  element={CertificateManagement}
                  metaKey="/admin/products/certificate-management"
                />
              }
            />
            <Route
              path="product-catelog"
              element={
                <SEOPage
                  element={Productcatlog}
                  metaKey="/admin/products/product-catelog"
                />
              }
            />
            <Route
              path="gemstone-catalog"
              element={
                <SEOPage
                  element={GemstoneCatalog}
                  metaKey="/admin/products/gemstone-catalog"
                />
              }
            />
          </Route>
          <Route path="carts-discounts">
            <Route
              path="cart-and-discount"
              element={
                <SEOPage
                  element={CartAndDiscount}
                  metaKey="/admin/carts-discounts/cart-and-discount"
                />
              }
            />
            <Route
              path="discount-management"
              element={
                <SEOPage
                  element={DiscountManagement}
                  metaKey="/admin/carts-discounts/discount-management"
                />
              }
            />
          </Route>
          <Route path="shipping">
            <Route
              path="pincode-management"
              element={
                <SEOPage
                  element={PincodeManagement}
                  metaKey="/admin/shipping/pincode-management"
                />
              }
            />
            {/* <Route path="product-delivery" element={<SEOPage element={ProductDelivery} metaKey="/admin/shipping/product-delivery" />} /> */}
          </Route>
          <Route path="user-management">
            <Route
              path="user-account"
              element={
                <SEOPage
                  element={UserAccount}
                  metaKey="/admin/user-management/user-account"
                />
              }
            />
            <Route
              path="support-ticket"
              element={
                <SEOPage
                  element={SupportTicket}
                  metaKey="/admin/user-management/support-ticket"
                />
              }
            />
            <Route
              path="contact-management"
              element={
                <SEOPage
                  element={ContactManagement}
                  metaKey="/admin/user-management/contact-management"
                />
              }
            />
            <Route
              path="elite-member-management"
              element={
                <SEOPage
                  element={EliteMemberManagement}
                  metaKey="/admin/user-management/elite-member-management"
                />
              }
            />
          </Route>
          <Route path="marketing">
            <Route
              path="email-automation"
              element={
                <SEOPage
                  element={EmailAutomation}
                  metaKey="/admin/marketing/email-automation"
                />
              }
            />
            <Route
              path="review-rating"
              element={
                <SEOPage
                  element={ReviewRating}
                  metaKey="/admin/marketing/review-rating"
                />
              }
            />
            <Route
              path="most-selling-products"
              element={
                <SEOPage
                  element={MostSellingProducts}
                  metaKey="/admin/marketing/most-selling-products"
                />
              }
            />
            <Route
              path="most-selling-locations"
              element={
                <SEOPage
                  element={MostSellingLocations}
                  metaKey="/admin/marketing/most-selling-locations"
                />
              }
            />
            <Route
              path="facebook-pixel"
              element={
                <SEOPage
                  element={FacebookPixel}
                  metaKey="/admin/marketing/facebook-pixel"
                />
              }
            />
          </Route>
          <Route path="gold-silver">
            <Route
              path="rate-prediction"
              element={
                <SEOPage
                  element={RatePradiction}
                  metaKey="/admin/gold-silver/rate-prediction"
                />
              }
            />
            <Route
              path="rate-update"
              element={
                <SEOPage
                  element={RateUpdateSetting}
                  metaKey="/admin/gold-silver/rate-update"
                />
              }
            />
            <Route
              path="prediction-management"
              element={
                <SEOPage
                  element={PredictionManagement}
                  metaKey="/admin/gold-silver/prediction-management"
                />
              }
            />
          </Route>
          <Route path="cms">
            <Route
              path="cms-tracker"
              element={
                <SEOPage
                  element={CmsTracker}
                  metaKey="/admin/cms/cms-tracker"
                />
              }
            />
            <Route
              path="blog-guide"
              element={
                <SEOPage element={BlogGuide} metaKey="/admin/cms/blog-guide" />
              }
            />
            <Route
              path="social-links"
              element={
                <SEOPage
                  element={SocialLinks}
                  metaKey="/admin/cms/social-links"
                />
              }
            />
            <Route
              path="gallery-management"
              element={<SEOPage element={AdminGallery} metaKey="gallery" />}
            />
            <Route
              path="offer-carousel"
              element={
                <SEOPage
                  element={OfferCarouselAdmin}
                  metaKey="offer-carousel"
                />
              }
            />
            <Route
              path="chatbot-qa"
              element={
                <SEOPage element={ChatbotQAManagement} metaKey="chatbot-qa" />
              }
            />
            <Route
              path="hero-banner"
              element={
                <SEOPage
                  element={HeroBanner}
                  metaKey="/admin/cms/hero-banner"
                />
              }
            />
            <Route
              path="featured-images"
              element={
                <SEOPage
                  element={FeaturedImages}
                  metaKey="/admin/cms/featured-images"
                />
              }
            />
            <Route
              path="pvj-prediction"
              element={
                <SEOPage
                  element={AdminWrappedWithLove}
                  metaKey="/admin/cms/pvj-prediction"
                />
              }
            />
            <Route
              path="second-category"
              element={
                <SEOPage
                  element={AdminSecondFeatureCat}
                  metaKey="/admin/cms/second-category"
                />
              }
            />
            <Route
              path="insta-images"
              element={
                <SEOPage
                  element={AdminInstaImages}
                  metaKey="/admin/cms/insta-images"
                />
              }
            />
            <Route
              path="about-us"
              element={
                <SEOPage
                  element={AboutUsManagement}
                  metaKey="/admin/cms/about-us"
                />
              }
            />
            <Route
              path="faq-management"
              element={
                <SEOPage
                  element={FaqManagement}
                  metaKey="/admin/cms/faq-management"
                />
              }
            />
            <Route
              path="return-policy"
              element={
                <SEOPage
                  element={ReturnPolicyManagement}
                  metaKey="/admin/cms/return-policy"
                />
              }
            />
            <Route
              path="privacy-policy"
              element={
                <SEOPage
                  element={PrivacyPolicyManagement}
                  metaKey="/admin/cms/privacy-policy"
                />
              }
            />
            <Route
              path="terms-conditions"
              element={
                <SEOPage
                  element={TermsConditionsManagement}
                  metaKey="/admin/cms/terms-conditions"
                />
              }
            />
            <Route
              path="shipping-policy"
              element={
                <SEOPage
                  element={ShippingPolicyManagement}
                  metaKey="/admin/cms/shipping-policy"
                />
              }
            />
            <Route
              path="shop-banner"
              element={
                <SEOPage
                  element={ShopBannerManagement}
                  metaKey="/admin/cms/shop-banner"
                />
              }
            />
            <Route
              path="client-diary"
              element={
                <SEOPage
                  element={ClientDiaryManagement}
                  metaKey="/admin/cms/client-diary"
                />
              }
            />
            <Route
              path="product-banner"
              element={
                <SEOPage
                  element={ProductBannerCMS}
                  metaKey="/admin/cms/product-banner"
                />
              }
            />
          </Route>
          <Route
            path="digital-gold"
            element={
              <SEOPage
                element={DigitalGoldOverview}
                metaKey="/admin/digital-gold"
              />
            }
          />
          <Route
            path="custom-jewelry"
            element={
              <SEOPage
                element={CustomJewelryManagement}
                metaKey="/admin/custom-jewelry"
              />
            }
          />
          <Route
            path="plan-controller-center"
            element={
              <SEOPage
                element={PlanControllerCenter}
                metaKey="/admin/plan-controller-center"
              />
            }
          />
          <Route
            path="chatbot-qa-management"
            element={
              <SEOPage
                element={ChatbotQAManagement}
                metaKey="/admin/chatbot-qa-management"
              />
            }
          />
          {/* Admin 404 Catch-all Route */}
          <Route
            path="*"
            element={<SEOPage element={Admin404} metaKey="*" />}
          />
        </Route>
        <Route
          path="/admin/reset-password"
          element={<SEOPage element={MSME} metaKey="/admin/reset-password" />}
        />
      </Routes>
    </Suspense>
  </main>
);

export default AdminRoutes;
