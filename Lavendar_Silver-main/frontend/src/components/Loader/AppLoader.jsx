import React from "react";
import "./AppLoader.css";
import { Diamond } from "lucide-react";

const AppLoader = () => (
  <div className="loader-wrapper">
    <div className="loader-container">
      {/* Animated Diamond Logo */}
      <div className="loader-logo">
       
        
        {/* Elegant Ring Animation */}
       
      </div>

      {/* Brand Text */}
      <div className="loader-brand">
        <h1 className="brand-text">
          <span className="letter letter-p">P</span>
          <span className="letter letter-v">V</span>
          <span className="letter letter-j">J</span>
        </h1>
        <div className="brand-tagline">Premium Jewelry Collection</div>
      </div>

      {/* Loading Progress */}
      <div className="loader-progress">
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
        <div className="loader-text">Crafting your luxury experience</div>
      </div>
    </div>

    {/* Background Decorative Elements */}
    <div className="loader-background">
      <div className="bg-sparkle bg-sparkle-1"></div>
      <div className="bg-sparkle bg-sparkle-2"></div>
      <div className="bg-sparkle bg-sparkle-3"></div>
      <div className="bg-sparkle bg-sparkle-4"></div>
      <div className="bg-sparkle bg-sparkle-5"></div>
    </div>
  </div>
);

export default AppLoader;