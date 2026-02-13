import React from "react";
import "./pageNotFound.css";
import { useNavigate } from "react-router-dom";

const PageNotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="pnf-container">
            <div className="pnf-content">
                <h1 className="pnf-title">404</h1>
                <h2 className="pnf-subtitle">Page Not Found</h2>
                <p className="pnf-message">Sorry, the page you are looking for does not exist or has been moved.</p>
                <button className="pnf-home-btn" onClick={() => navigate("/")}>Go to Homepage</button>
            </div>
            <div className="pnf-bg-anim"></div>
        </div>
    );
};

export default PageNotFound; 