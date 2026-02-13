import React, { useState, useEffect } from 'react';
import './privacy.css';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Privacypolicy = () => {
  const [policyData, setPolicyData] = useState({
    header: null,
    sections: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicyData();
  }, []);

  const fetchPolicyData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/privacy-policy/all`);

      if (response.data.success) {
        const data = response.data.data;
        setPolicyData(data);
      } else {
        console.error('❌ Failed to fetch Privacy Policy data:', response.data.message);
      }
    } catch (error) {
      console.error('🚨 Error fetching Privacy Policy data:', error);
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
        <section key={section.id || index} className="privacy-policy-section">
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
        <section className="privacy-policy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to PVJ (Precious Valuable Jewellery). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our mobile application, or make purchases from our jewellery stores.
          </p>
          <p>
            By using our services, you consent to the data practices described in this policy. If you do not agree with our policies and practices, please do not use our services.
          </p>
        </section>

        <section className="privacy-policy-section">
          <h2>2. Information We Collect</h2>

          <h3>2.1 Personal Information</h3>
          <p>We may collect the following personal information: Name, email address, phone number, and postal address; Date of birth and gender (for personalized jewellery recommendations); Payment information (credit card details, billing address); Purchase history and preferences; Customer service communications; Account credentials and profile information.</p>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you visit our website or use our app, we automatically collect: Device information (IP address, browser type, operating system); Usage data (pages visited, time spent, links clicked); Location data (with your consent); Cookies and similar tracking technologies.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes: Process and fulfill your jewellery orders; Provide customer support and respond to inquiries; Send order confirmations, shipping updates, and delivery notifications; Personalize your shopping experience and recommend products; Send marketing communications (with your consent); Improve our website, products, and services; Prevent fraud and ensure security; Comply with legal obligations.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>4. Information Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. However, we may share your information in the following circumstances: <strong>Service Providers:</strong> With trusted third-party vendors who assist in operating our business (payment processors, shipping companies, IT services); <strong>Legal Requirements:</strong> When required by law or to protect our rights and safety; <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets; <strong>Consent:</strong> With your explicit consent for specific purposes.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>5. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include: Encryption of sensitive data during transmission and storage; Regular security assessments and updates; Access controls and authentication procedures; Employee training on data protection practices.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>6. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to enhance your browsing experience: <strong>Essential Cookies:</strong> Required for basic website functionality; <strong>Analytics Cookies:</strong> Help us understand how visitors use our site; <strong>Marketing Cookies:</strong> Used for targeted advertising (with consent); <strong>Preference Cookies:</strong> Remember your settings and preferences. You can control cookie settings through your browser preferences.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>7. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information: <strong>Access:</strong> Request a copy of your personal data; <strong>Correction:</strong> Update or correct inaccurate information; <strong>Deletion:</strong> Request deletion of your personal data; <strong>Portability:</strong> Receive your data in a structured format; <strong>Objection:</strong> Object to certain processing activities; <strong>Withdrawal:</strong> Withdraw consent for marketing communications.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>8. Marketing Communications</h2>
          <p>We may send you marketing communications about our latest jewellery collections, promotions, and events. You can: Opt-in to receive marketing emails during account creation; Unsubscribe from marketing emails using the link in each email; Update your communication preferences in your account settings.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>9. Children's Privacy</h2>
          <p>Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>10. International Data Transfers</h2>
          <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.</p>
        </section>

        <section className="privacy-policy-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by: Posting the updated policy on our website; Sending an email notification to registered users; Displaying a prominent notice on our website. Your continued use of our services after such changes constitutes acceptance of the updated policy.</p>
        </section>
      </>
    );
  };

  if (loading) {
    return (
      <div className="privacy-policy-container">
        <div className="privacy-policy-content">
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.1rem', color: '#666' }}>
            Loading Privacy Policy...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-content">
        <header className="privacy-header">
          <h1>{policyData.header?.page_title || 'Privacy Policy'}</h1>
          <p className="privacy-last-updated">
            Last Updated: {policyData.header?.last_updated ? new Date(policyData.header.last_updated).toLocaleDateString() : new Date().toLocaleDateString()}
          </p>
        </header>

        {renderSections()}
      </div>
    </div>
  );
};

export default Privacypolicy;
