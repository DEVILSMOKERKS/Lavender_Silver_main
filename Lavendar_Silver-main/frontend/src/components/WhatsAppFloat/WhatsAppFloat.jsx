import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';
import './WhatsAppFloat.css';
import { useDynamicLinks } from '../../hooks/useDynamicLinks';
import { getWhatsAppURL, getTelURL } from '../../utils/dynamicLinks';

const WhatsAppFloat = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { links } = useDynamicLinks();

    // Show the icon after a small delay for better UX
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // WhatsApp number and message - use dynamic phone number or fallback
    const whatsappNumber = links.whatsapp;
    const defaultMessage = "Hello! I'm interested in PVJ Jewellery collection. Can you help me?";

    const handleWhatsAppClick = () => {
        const whatsappURL = getWhatsAppURL(whatsappNumber, defaultMessage);
        window.open(whatsappURL, '_blank');
        setIsExpanded(false); // Auto close popup after WhatsApp click
    };

    const handleCallClick = () => {
        const telURL = getTelURL(whatsappNumber);
        window.open(telURL, '_self');
        setIsExpanded(false); // Auto close popup after call click
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const handleMainButtonClick = () => {
        if (isExpanded) {
            // If popup is open, close it when clicking the main button
            setIsExpanded(false);
        } else {
            // If popup is closed, open it
            setIsExpanded(true);
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`whatsapp-float-container ${isExpanded ? 'expanded' : ''}`}>
            {/* Expanded Menu */}
            {isExpanded && (
                <div className="whatsapp-float-menu">
                    <div className="whatsapp-float-header">
                        <h4>Need Help?</h4>
                        <button
                            className="whatsapp-close-btn"
                            onClick={toggleExpanded}
                            aria-label="Close menu"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="whatsapp-float-content">
                        <p>Get in touch with us for any jewelry queries!</p>

                        <div className="whatsapp-float-actions">
                            <button
                                className="whatsapp-action-btn whatsapp-btn"
                                onClick={handleWhatsAppClick}
                                aria-label="Chat on WhatsApp"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.891 3.488" />
                                </svg>
                                <span>Chat on WhatsApp</span>
                            </button>

                            <button
                                className="whatsapp-action-btn call-btn"
                                onClick={handleCallClick}
                                aria-label="Call us"
                            >
                                <Phone size={20} />
                                <span>Call Now</span>
                            </button>
                        </div>

                        <div className="whatsapp-float-info">
                            <p className="whatsapp-number">{whatsappNumber}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main WhatsApp Button */}
            <div
                className="whatsapp-float-button"
                onClick={handleMainButtonClick}
                title={isExpanded ? "Close menu" : "Contact us"}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleMainButtonClick();
                    }
                }}
            >
                <div className="whatsapp-float-icon">
                    {/* WhatsApp SVG Icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.891 3.488" />
                    </svg>
                </div>

                {!isExpanded && (
                    <div className="whatsapp-float-pulse">
                        <div className="whatsapp-pulse-ring"></div>
                        <div className="whatsapp-pulse-ring"></div>
                    </div>
                )}

                {!isExpanded && (
                    <div className="whatsapp-float-tooltip">
                        <span>Need Help? Chat with us!</span>
                    </div>
                )}
            </div>

            {/* Background overlay when expanded */}
            {isExpanded && (
                <div
                    className="whatsapp-float-overlay"
                    onClick={toggleExpanded}
                ></div>
            )}
        </div>
    );
};

export default WhatsAppFloat;