import React, { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/Footer/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat/WhatsAppFloat";
import AppLoader from "../components/Loader/AppLoader";
import ScrollToTop from "../components/Loader/ScrollToTop";
import SEOHelmet, { SEO_META } from '../components/SEOHelmet';

// Lazy load components...
const Signup = lazy(() => import("../components/Signup/Signup"));
const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About/About"));
const Shop = lazy(() => import("../pages/shop/Shop"));
const ContactUs = lazy(() => import("../pages/contact-us/ContactUs"));
const Privacy = lazy(() => import("../pages/Privacy/Privacy"));
const Blogs = lazy(() => import("../pages/blog-page/Blogs"));
const SingleBlog = lazy(() => import("../pages/blog-page/SingleBlog"));
const Product = lazy(() => import("../pages/product/Product"));
const MyAccount = lazy(() => import("../pages/my-Account/MyAccount"));
const Terms = lazy(() => import("../pages/Terms/Terms"));
const Return = lazy(() => import("../pages/Return/Return"));
const ShippingPolicy = lazy(() => import("../pages/ShippingPolicy/ShippingPolicy"));
const Thankyou = lazy(() => import("../pages/Thankyou/Thankyou"));
const Maincart = lazy(() => import("../pages/mainCart/Maincart"));
const VideoCart = lazy(() => import("../pages/VideoCart/VideoCart"));
const VideoCartBookingForm = lazy(() => import('../pages/VideoCart/VideoCartBookingForm'));
const VideoCartThankYou = lazy(() => import('../pages/VideoCart/VideoCartThankYou'));
const PageNotFound = lazy(() => import("../pages/PageNotFound/PageNotFound"));
const Wishlist = lazy(() => import("../pages/wishlist/Wishlist"));
const OldGold = lazy(() => import("../pages/oldgold/OldGold"));
const GoldMine = lazy(() => import("../pages/GoldMine/GoldMine"));
const GoldMineSubscription = lazy(() => import("../pages/GoldMine/GoldMineSubscription"));
const DigitalGold = lazy(() => import("../pages/digital-gold/DigitalGold"));
const Faq = lazy(() => import("../pages/faq/Faq"));
const Checkout = lazy(() => import("../pages/mainCart/Checkout"));
const ProductComparison = lazy(() => import("../pages/product/ProductComparison"));
const CustomJewelry = lazy(() => import("../pages/custom-jewelry/CustomJewelry"));

function SEOPage({ element: Element, metaKey }) {
    const location = useLocation();
    const meta = SEO_META[metaKey] || SEO_META[location.pathname] || SEO_META["*"];
    return <><SEOHelmet {...meta} /><Element /></>;
}

const PVJUserRoutes = ({ onAccountClick, loading, isSignupOpen, setIsSignupOpen }) => {
    const location = useLocation();

    // Logic: Agar URL mein '/product' word kahin bhi hai, toh footer hide kar do
    const isProductView = location.pathname.includes("/product");

    return (
        <>
            <ScrollToTop />
            <Navbar onAccountClick={onAccountClick} />
            <main>
                {loading ? (
                    <AppLoader />
                ) : (
                    <Suspense fallback={<AppLoader />}>
                        <Routes>
                            <Route path="/" element={<SEOPage element={Home} metaKey="/" />} />
                            <Route path="/shop" element={<SEOPage element={Shop} metaKey="/shop" />} />
                            <Route path="/About-us" element={<SEOPage element={About} metaKey="/About-us" />} />
                            <Route path="/signup" element={<SEOPage element={Signup} metaKey="/signup" />} />
                            <Route path="/login" element={<SEOPage element={Signup} metaKey="/login" />} />
                            <Route path="/contact" element={<SEOPage element={ContactUs} metaKey="/contact" />} />
                            <Route path="/blogs" element={<SEOPage element={Blogs} metaKey="/blogs" />} />
                            <Route path="/blog/:blogslug" element={<SEOPage element={SingleBlog} metaKey="/blog/:blogslug" />} />
                            <Route path="/carts" element={<SEOPage element={Maincart} metaKey="/carts" />} />
                            
                            {/* Product Route */}
                            <Route path="/product/:productName" element={<SEOPage element={Product} metaKey="/product/:productName" />} />
                            
                            <Route path="/compare/:product1_id/:product2_id" element={<SEOPage element={ProductComparison} metaKey="/compare/:product1_id/:product2_id" />} />
                            <Route path="/myaccount" element={<SEOPage element={MyAccount} metaKey="/myaccount" />} />
                            <Route path="/privacy-policy" element={<SEOPage element={Privacy} metaKey="/privacy-policy" />} />
                            <Route path="/terms-and-conditions" element={<SEOPage element={Terms} metaKey="/terms-and-conditions" />} />
                            <Route path="/return-and-cancellation" element={<SEOPage element={Return} metaKey="/return-and-cancellation" />} />
                            <Route path="/shipping-policy" element={<SEOPage element={ShippingPolicy} metaKey="/shipping-policy" />} />
                            <Route path="/faq" element={<SEOPage element={Faq} metaKey="/faq" />} />
                            <Route path="/video-cart" element={<SEOPage element={VideoCart} metaKey="/video-cart" />} />
                            <Route path="/video-cart/booking" element={<SEOPage element={VideoCartBookingForm} metaKey="/video-cart/booking" />} />
                            <Route path="/video-cart/thankyou" element={<SEOPage element={VideoCartThankYou} metaKey="/video-cart/thankyou" />} />
                            <Route path="/thankyou" element={<SEOPage element={Thankyou} metaKey="/thankyou" />} />
                            <Route path="/wishlist" element={<SEOPage element={Wishlist} metaKey="/wishlist" />} />
                            <Route path="/old-gold" element={<SEOPage element={OldGold} metaKey="/old-gold" />} />
                            <Route path="/goldmine" element={<SEOPage element={GoldMine} metaKey="/goldmine" />} />
                            <Route path="/goldmine-subscription" element={<SEOPage element={GoldMineSubscription} metaKey="/goldmine-subscription" />} />
                            <Route path='/digital-gold' element={<SEOPage element={DigitalGold} metaKey="/digital-gold" />} />
                            <Route path="/custom-jewelry" element={<SEOPage element={CustomJewelry} metaKey="/custom-jewelry" />} />
                            <Route path="/checkout" element={<SEOPage element={Checkout} metaKey="/checkout" />} />
                            <Route path="*" element={<SEOPage element={PageNotFound} metaKey="*" />} />
                        </Routes>
                    </Suspense>
                )}
            </main>

            {/* Change yahan hai: Agar product view nahi hai, tabhi Footer aayega */}
            {!isProductView && <Footer setIsSignupOpen={setIsSignupOpen} />}

            <WhatsAppFloat />
            
            {isSignupOpen && (
                <div className="modal-overlay" onClick={() => setIsSignupOpen(false)}>
                    <div className="signpopup modal-content" onClick={(e) => e.stopPropagation()}>
                        <Suspense fallback={<AppLoader />}>
                            <Signup onClose={() => setIsSignupOpen(false)} />
                        </Suspense>
                    </div>
                </div>
            )}
        </>
    );
};

export default PVJUserRoutes;