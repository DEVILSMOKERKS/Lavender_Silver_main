import React, { useState, useEffect } from 'react';
import './return.css';
import { Clock, Package, CreditCard, Shield, Phone, Mail, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useDynamicLinks } from '../../hooks/useDynamicLinks';
import { getTelURL, getMailtoURL, getGoogleMapsURL } from '../../utils/dynamicLinks';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Return = () => {
  const [policyData, setPolicyData] = useState({
    header: null,
    sections: []
  });
  const [loading, setLoading] = useState(true);
  const { links } = useDynamicLinks();

  useEffect(() => {
    fetchPolicyData();
  }, []);

  const fetchPolicyData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/return-policy/all`);

      if (response.data.success) {
        const data = response.data.data;
        setPolicyData(data);
      } else {
        console.error('❌ Failed to fetch Return Policy data:', response.data.message);
      }
    } catch (error) {
      console.error('🚨 Error fetching Return Policy data:', error);
      console.error('Error Response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render sections with subsections
  const renderSections = () => {
    if (!policyData.sections || policyData.sections.length === 0) {
      return renderStaticContent();
    }

    // Group sections by main sections and subsections
    const mainSections = policyData.sections.filter(section => !section.parent_section_number);
    const subsections = policyData.sections.filter(section => section.parent_section_number);

    return mainSections.map((section, index) => {
      const sectionSubsections = subsections.filter(sub => sub.parent_section_number === section.section_number);

      return (
        <section key={section.id || index} className="return-policy-section">
          <h2>{section.section_number} {section.section_title}</h2>
          {section.content && <p>{section.content}</p>}

          {/* Render subsections */}
          {sectionSubsections.map((subsection, subIndex) => (
            <div key={subsection.id || subIndex}>
              <h3>{subsection.section_number} {subsection.section_title}</h3>
              <p>{subsection.content}</p>
            </div>
          ))}
        </section>
      );
    });
  };

  // Fallback static content
  const renderStaticContent = () => {
    return (
      <>
        <section className="return-policy-section">
          <h2>1. Overview</h2>
          <p>
            At PVJ (Precious Valuable Jewellery), we understand that purchasing jewellery is a significant investment and personal decision. We are committed to providing you with a seamless shopping experience and stand behind the quality of our products with our comprehensive return and cancellation policy.
          </p>
          <p>
            Our policy is designed to protect both our customers and the integrity of our jewellery pieces. We offer a 30-day money-back guarantee on most items, ensuring you can shop with confidence knowing that your satisfaction is our priority.
          </p>
        </section>

        <section className="return-policy-section">
          <h2>2. Return Policy</h2>

          <h3>2.1 Eligible Items for Returns</h3>
          <p>The following items are eligible for returns within 30 days of delivery: All jewellery items in original, unworn condition; Items with original packaging, tags, and certificates intact; Non-customized jewellery pieces; Items purchased within the 30-day return window; Products that meet our quality standards upon inspection.</p>

          <h3>2.2 Non-Eligible Items</h3>
          <p>The following items are not eligible for returns: Solitaires and diamond jewellery above ₹3,00,000; Customized or personalized jewellery pieces; Gold coins and investment products; Damaged, worn, or altered items; Items without original packaging and certificates; Sale or clearance items (unless defective); Items purchased from third-party retailers.</p>
        </section>

        <section className="return-policy-section">
          <h2>3. Return Process</h2>
          <p>To initiate a return, follow these simple steps:</p>
          <p><strong>Step 1:</strong> Log into your PVJ account and navigate to "My Orders" section. Select the item you wish to return and click "Initiate Return" within 30 days of delivery.</p>
          <p><strong>Step 2:</strong> Ensure the item is in its original condition with all packaging, tags, certificates, and documentation included. Any missing components may affect your return eligibility.</p>
          <p><strong>Step 3:</strong> Download and print the return shipping label provided by PVJ. Securely package the item and attach the label to your package.</p>
          <p><strong>Step 4:</strong> Drop off your package at any authorized courier location. Return shipping is free for all eligible returns within India.</p>
          <p><strong>Step 5:</strong> Once we receive and inspect your return, we will process your refund within 5-7 business days to your original payment method.</p>
        </section>

        <section className="return-policy-section">
          <h2>4. Cancellation Policy</h2>
          <p><strong>Order Cancellation:</strong> You can cancel your order at no cost any time before we send the Dispatch Confirmation email. For orders containing multiple items, you can cancel individual items without affecting the entire order.</p>
          <p><strong>Cancellation Timeline:</strong> Before dispatch - Free cancellation available; After dispatch - Return process applies (30-day window); After delivery - 30-day return policy applies.</p>
          <p><strong>Processing Time:</strong> Cancellation requests are processed within 24 hours during business days. You will receive a confirmation email once your cancellation is processed.</p>
        </section>

        <section className="return-policy-section">
          <h2>5. Refund Information</h2>
          <p><strong>Refund Methods:</strong> We process refunds through the following methods: Credit/Debit Card (original payment method); Net Banking (original account); PVJ Cash Account (for future purchases); Bank Transfer (for cash on delivery orders).</p>
          <p><strong>Refund Timeline:</strong> Return received (1-2 business days) → Quality check (2-3 business days) → Refund processed (5-7 business days). Total processing time: 8-12 business days from receipt of return.</p>
          <p><strong>Refund Amount:</strong> Full refund of the purchase price, excluding any shipping charges paid by the customer. For prepaid orders, the full amount will be refunded to the original payment method.</p>
        </section>

        <section className="return-policy-section">
          <h2>6. Special Cases</h2>
          <p><strong>Defective Items:</strong> If you receive a defective item, contact our customer service immediately with photos of the defect. We will arrange for a replacement or full refund, including all shipping costs.</p>
          <p><strong>Wrong Item Received:</strong> If you receive the wrong item, we will arrange for the correct item to be shipped at no additional cost, or provide a full refund if the correct item is not available.</p>
          <p><strong>Gift Cards:</strong> Upon cancellation or return of orders placed using gift cards, the gift card amount will be refunded back to the original gift card for future use.</p>
          <p><strong>Promotional Codes:</strong> For products ordered using promotional codes (FLAT10, DIWALI20, etc.), all products in the order must be returned together to maintain the promotional discount integrity.</p>
        </section>

        <section className="return-policy-section">
          <h2>7. Quality Standards</h2>
          <p>All returned items undergo a thorough quality inspection by our certified jewellery experts. We check for: Original condition and finish; Presence of all original packaging and certificates; No signs of wear, damage, or alteration; Authenticity of the jewellery piece; Completeness of all components and accessories.</p>
          <p>Items that do not meet our quality standards may be refused for return, and you will be notified of the specific reason for rejection.</p>
        </section>

        <section className="return-policy-section">
          <h2>8. Shipping and Handling</h2>
          <p><strong>Return Shipping:</strong> We provide free return shipping for all eligible returns within India. Return shipping labels are valid for 7 days from the date of generation.</p>
          <p><strong>International Returns:</strong> For international orders, return shipping costs are the responsibility of the customer. We recommend using a trackable shipping method and purchasing insurance for valuable items.</p>
          <p><strong>Package Requirements:</strong> Items must be securely packaged to prevent damage during transit. We recommend using the original packaging or equivalent protective materials.</p>
        </section>

        <section className="return-policy-section">
          <h2>9. Legal and Compliance</h2>
          <p><strong>Government Regulations:</strong> As per Government of India guidelines, PAN (Permanent Account Number) is required for all purchases above ₹2,00,000. This information is mandatory for processing returns and refunds for high-value items.</p>
          <p><strong>Consumer Rights:</strong> This policy is in addition to your statutory rights under Indian consumer protection laws. Nothing in this policy affects your legal rights as a consumer.</p>
          <p><strong>Dispute Resolution:</strong> Any disputes regarding returns or refunds will be resolved through our customer service team. If a resolution cannot be reached, the matter will be referred to appropriate legal authorities.</p>
        </section>

        <section className="return-policy-section">
          <h2>10. Important Notes</h2>
          <p>All returns must be initiated within 30 days of the delivery date. Items must be in original condition with all packaging, tags, and certificates included. PVJ reserves the right to refuse returns that do not meet our policy requirements. Return shipping labels are valid for 7 days from the date of generation. For security reasons, we may require additional verification for high-value returns. This policy is subject to change without prior notice, but changes will not affect returns already in progress.</p>
        </section>

        <section className="return-policy-section">
          <h2>11. Contact Information</h2>
          <div className="return-contact-info">
            <p><strong>Customer Service:</strong> <a href={getTelURL(links.whatsapp)} style={{ textDecoration: 'none', color: 'inherit' }}>{links.whatsapp}</a> (Mon-Sat: 9:00 AM - 8:00 PM)</p>
            <p><strong>Email Support:</strong> <a href={getMailtoURL(links.email)} style={{ textDecoration: 'none', color: 'inherit' }}>{links.email}</a> (Response within 24 hours)</p>
            <p><strong>Store Address:</strong> <a href={getGoogleMapsURL()} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>{links.address || 'PVJ Jewellery Store'}</a></p>
            <p><strong>Website:</strong> <a href={links.website || 'https://www.pvjjewellery.com'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>{links.website ? links.website.replace(/^https?:\/\//, '').replace(/^www\./, '') : 'www.pvjjewellery.com'}</a></p>
            <p><strong>Business Hours:</strong> Monday to Saturday: 9:00 AM - 8:00 PM (Closed on Sundays and National Holidays)</p>
          </div>
        </section>

        <section className="return-policy-section">
          <h2>12. Frequently Asked Questions</h2>

          <h3>12.1 Can I return a gift I received?</h3>
          <p>Yes, you can return gifts within 30 days of delivery. The refund will be processed to the original payment method or as store credit for future purchases.</p>

          <h3>12.2 What if my item arrives damaged?</h3>
          <p>Contact us immediately with photos of the damage. We will arrange for a replacement or full refund, including all shipping costs.</p>

          <h3>12.3 How long does it take to get my refund?</h3>
          <p>Refunds are typically processed within 5-7 business days after we receive and inspect your return.</p>

          <h3>12.4 Can I exchange an item instead of returning it?</h3>
          <p>Yes, you can request an exchange for a different size or style. Contact our customer service team for assistance with exchanges.</p>

          <h3>12.5 Is return shipping free?</h3>
          <p>Yes, we provide free return shipping for all eligible returns within India. You will receive a prepaid shipping label.</p>

          <h3>12.6 What happens if my return is rejected?</h3>
          <p>If your return is rejected, we will notify you of the specific reason and return the item to you at your expense. You may appeal the decision by contacting our customer service team.</p>
        </section>
      </>
    );
  };

  if (loading) {
    return (
      <div className="return-policy-container">
        <div className="return-policy-content">
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.1rem', color: '#666' }}>
            Loading Return Policy...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="return-policy-container">
      <div className="return-policy-content">
        <header className="return-header">
          <h1>{policyData.header?.page_title || 'Return & Cancellation Policy'}</h1>
          <p className="return-last-updated">
            Last Updated: {policyData.header?.last_updated ? new Date(policyData.header.last_updated).toLocaleDateString() : new Date().toLocaleDateString()}
          </p>
        </header>

        {renderSections()}
      </div>
    </div>
  );
};

export default Return;
