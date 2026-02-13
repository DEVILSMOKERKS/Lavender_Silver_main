import React, { lazy, Suspense, useRef, useEffect, useState } from "react";

const Hero = lazy(() => import("../components/hero/Hero"));
const Category = lazy(() => import("../components/Category/Category"));
const NewLaunch = lazy(() => import("../components/NewLaunch/NewLaunch"));
const CollectionBanner = lazy(() => import("../components/CollectionBanner/CollectionBanner"));
const FeaturedProducts = lazy(() => import("../components/FeaturedProducts/FeaturedProducts"));
const SignaturePieces = lazy(() =>
  import("../components/SignaturePieces/SignaturePieces")
);
const OffferCarousel = lazy(() =>
  import("../components/offer-carousel/OffferCarousel")
);
const FeaturedCategories = lazy(() =>
  import("../components/FeaturedCategories/FeaturedCategories")
);
const InstagramSection = lazy(() => import("../components/Instagram/Instagram"));
const Blog = lazy(() => import("../components/blog/Blog"));
const LatestLuxury = lazy(() =>
  import("../components/LatestLuxury/LatestLuxury")
);
const ShopByBond = lazy(() => import("../components/ShopByBond/ShopByBond"));
const CustomerReviews = lazy(() => import("../components/CustomerReviews/CustomerReviews"));

// Intersection Observer wrapper for lazy loading below-the-fold components
const LazyComponent = ({ children, fallback = null, rootMargin = "100px" }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (shouldLoad || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [shouldLoad, rootMargin]);

  if (shouldLoad) {
    return children;
  }

  return <div ref={ref} style={{ minHeight: '200px' }}>{fallback}</div>;
};

const Home = React.memo(() => (
  <div className="main-content-container">
    <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
      <Hero />
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <Category />
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <ShopByBond />
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <NewLaunch />
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <CollectionBanner />
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent>
        <FeaturedProducts />
      </LazyComponent>
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent>
        <SignaturePieces />
      </LazyComponent>
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent>
        <LatestLuxury />
      </LazyComponent>
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent>
        <OffferCarousel />
      </LazyComponent>
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent>
        <FeaturedCategories />
      </LazyComponent>
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent rootMargin="200px">
        <InstagramSection />
      </LazyComponent>
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent rootMargin="200px">
        <CustomerReviews />
      </LazyComponent>
    </Suspense>
    <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
      <LazyComponent rootMargin="200px">
        <Blog />
      </LazyComponent>
    </Suspense>
  </div>
));

Home.displayName = 'Home';

export default Home;