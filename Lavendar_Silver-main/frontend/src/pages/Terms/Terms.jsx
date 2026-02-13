import React, { useState, useEffect } from 'react';
import './terms.css';
import axios from 'axios';
import { useDynamicLinks } from '../../hooks/useDynamicLinks';
import { getTelURL, getMailtoURL } from '../../utils/dynamicLinks';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Terms = () => {
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
      const response = await axios.get(`${API_BASE_URL}/api/terms-conditions/all`);

      if (response.data.success) {
        const data = response.data.data;
        setPolicyData(data);
      } else {
        console.error('❌ Failed to fetch Terms & Conditions data:', response.data.message);
      }
    } catch (error) {
      console.error('🚨 Error fetching Terms & Conditions data:', error);
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
        <section key={section.id || index} className="terms-section">
          <h2>{section.section_number} {section.section_title}</h2>
          {section.content && <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>}

          {/* Render subsections */}
          {sectionSubsections.map((subsection, subIndex) => (
            <div key={subsection.id || subIndex}>
              <h3>{subsection.section_number} {subsection.section_title}</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{subsection.content}</p>
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
        <section className="terms-section">
          <h2>Offer Details</h2>

          <h3>Diamond and Gemstone Studded Products</h3>
          <p>Customers can avail additional off on making charges on <strong>diamond and gemstone studded products</strong> using the below mentioned coupon codes subject to minimum cart value:</p>

          <div className="terms-table-container">
            <table className="terms-table">
              <thead>
                <tr>
                  <th>Studded Jewellery Cart Value</th>
                  <th>Making Charges Off</th>
                  <th>Voucher</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rs 75,000 to Rs 1,49,999</td>
                  <td>10%</td>
                  <td>SPARKLE10</td>
                </tr>
                <tr>
                  <td>Rs 1,50,000 to Rs 2,99,999</td>
                  <td>20%</td>
                  <td>SPARKLE20</td>
                </tr>
                <tr>
                  <td>More than Rs 3 Lacs</td>
                  <td>30%</td>
                  <td>SPARKLE30</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Plain Gold and Plain Platinum Products</h3>
          <p>Customers can avail additional off on making charges on <strong>plain gold and plain platinum products</strong> using the below mentioned coupon codes subject to minimum cart value:</p>

          <div className="terms-table-container">
            <table className="terms-table">
              <thead>
                <tr>
                  <th>Plain Jewellery Cart Value</th>
                  <th>Making Charges Off</th>
                  <th>Voucher</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rs 1,50,000 to Rs 2,99,999</td>
                  <td>10%</td>
                  <td>PRECIOUS10</td>
                </tr>
                <tr>
                  <td>More than Rs 3 Lacs</td>
                  <td>15%</td>
                  <td>PRECIOUS15</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="terms-important-notes">
            <ul>
              <li>Voucher FLAT10 is applicable only on Preset Solitaires.</li>
              <li>Vouchers SPARKLE10/20/30 are applicable only on diamond and gemstone studded products. Not applicable on Solitaires and Preset Solitaires.</li>
              <li>Vouchers PRECIOUS10/15 are applicable only on plain gold and plain platinum products. Not applicable on Solitaires, Preset Solitaires and Gold Coins.</li>
              <li>Offer on diamond prices and making charges are valid only on selected products.</li>
              <li>All current vouchers are subject to discontinuation without prior notice.</li>
              <li>The applicability of any additional voucher is at the sole discretion of PVJ.</li>
            </ul>
          </div>
        </section>

        <section className="terms-section">
          <h2>Use of the Website</h2>
          <p>
            By accessing the website, you warrant and represent to the website owner that you are legally entitled to do so and to make use of information made available via the website.
          </p>
        </section>

        <section className="terms-section">
          <h2>Trademarks</h2>
          <p>
            The trademarks, names, logos and service marks (collectively "trademarks") displayed on this website are registered and unregistered trademarks of PVJ Jewellery. Nothing contained on this website should be construed as granting any license or right to use any trademark without the prior written permission of PVJ Jewellery.
          </p>
        </section>

        <section className="terms-section">
          <h2>External Links</h2>
          <p>
            External links may be provided for your convenience, but they are beyond the control of PVJ Jewellery and no representation is made as to their content. Use or reliance on any external links and the content thereon provided is at your own risk.
          </p>
        </section>

        <section className="terms-section">
          <h2>Warranties</h2>
          <p>
            PVJ Jewellery makes no express, implied, residual, or other warranties, representations, statements, or guarantees whatsoever to you and specifically disclaims and excludes any and all implied warranties of merchantability, satisfactory quality, fitness for a particular purpose, and non-infringement of third party rights, unless otherwise disclaimable by law.
          </p>
        </section>

        <section className="terms-section">
          <h2>Prices</h2>
          <p>
            Pricing is calculated based on current precious metal and gem prices, which are subject to fluctuations. Prices on PVJ.com can change without notice. You will be charged the price listed on the day of purchase.
          </p>
        </section>

        <section className="terms-section">
          <h2>Disclaimer of Liability</h2>
          <p>
            PVJ Jewellery disclaims all liability for any loss, damage, personal injury, or expense of any kind whatsoever and howsoever caused, whether directly or indirectly from the use of or reliance upon any information, material, or services available on this website, or any other matter relating to this website and even if such loss or damage is caused by or results from the negligence or gross negligence of PVJ Jewellery, or an authorized representative of PVJ Jewellery, or for any other reason whatsoever.
          </p>
        </section>

        <section className="terms-section">
          <h2>Conflict of Terms</h2>
          <p>
            If there is a conflict or contradiction between the provisions of these website terms and conditions and any other relevant terms and conditions, policies or notices, the other relevant terms and conditions, policies or notices which relate specifically to a particular section or module of the website shall prevail in respect of your use of the relevant section or module of the website.
          </p>
        </section>

        <section className="terms-section">
          <h2>Severability</h2>
          <p>
            Any provision of any relevant terms and conditions, policies and notices, which is or becomes unenforceable in a jurisdiction, whether due to voidness, invalidity, illegality, unlawfulness or for any reason whatever, shall, in such jurisdiction only, be treated as void and the remaining provisions of any relevant terms and conditions, policies and notices, shall remain in full force and effect.
          </p>
        </section>

        <section className="terms-section">
          <h2>Cancellation & Returns</h2>
          <p><strong>Order Cancellation:</strong> Orders can be canceled at no cost before the Dispatch Confirmation E-mail. Individual items can be canceled within an order if it contains 2 or more items without canceling the entire order.</p>
          <p><strong>Refunds for Prepaid Orders:</strong> Amount will be credited to the payment source (Credit Card/Debit Card/Net Banking).</p>
          <p><strong>30 Day Money Back Policy:</strong> Refunds are credited to the PVJ Cash account (not applicable on Solitaires above INR 3 lakh, Coins, and Customized orders). You can choose to make another purchase or get the amount refunded to your bank account.</p>
          <p><strong>Refunds for Cash on Delivery Orders:</strong> Processed to the user's bank account.</p>
          <p><strong>Gift Card Orders:</strong> Refunded back to the gift card.</p>
          <p><strong>Return Conditions for Specific Vouchers:</strong> For products ordered using FLAT02, FLAT05, FLAT10, FLAT15, FLAT20, DIWALI05, DIWALI10, DIWALI15, DIWALI20, DIWALI25, LOVE05, LOVE10, LOVE15, all products in the order need to be returned together.</p>
        </section>

        <section className="terms-section">
          <h2>Applicable Laws</h2>
          <p>
            The website is governed by the laws of India. The parties agree that the courts in India have exclusive jurisdiction over disputes. Customers must provide their Permanent Account Number (PAN) for all purchases above INR 2 lakh, as per government guidelines.
          </p>
        </section>

        <section className="terms-section">
          <h2>Contests</h2>
          <p>
            Winners of contests and giveaways are selected at the company's discretion. Prizes/gifts are non-returnable/exchangeable. Any additional facilities are at the company's discretion. PVJ reserves the right to change contest terms and conditions without prior intimation. All disputes will be resolved via email at p.v.jewellersnsons.sks@gmail.com.
          </p>
        </section>

        <section className="terms-section">
          <h2>Contact Information</h2>
          <div className="terms-contact-info">
            <p><strong>PVJ Jewellery</strong></p>
            <p><strong>Email:</strong> <a href={getMailtoURL(links.email)} style={{ textDecoration: 'none', color: 'inherit' }}>{links.email}</a></p>
            <p><strong>Phone:</strong> <a href={getTelURL(links.whatsapp)} style={{ textDecoration: 'none', color: 'inherit' }}>{links.whatsapp}</a></p>
            <p><strong>Address:</strong> {links.address}</p>
            <p><strong>Website:</strong> www.pvjjewellery.com</p>
          </div>
        </section>
      </>
    );
  };

  if (loading) {
    return (
      <div className="terms-container">
        <div className="terms-content">
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.1rem', color: '#666' }}>
            Loading Terms & Conditions...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="terms-container">
      <div className="terms-content">
        <header className="terms-header">
          <h1>{policyData.header?.page_title || 'Terms & Conditions'}</h1>
          <p className="terms-last-updated">
            Last Updated: {policyData.header?.last_updated ? new Date(policyData.header.last_updated).toLocaleDateString() : new Date().toLocaleDateString()}
          </p>
        </header>

        {renderSections()}
      </div>
    </div>
  );
};

export default Terms;
