import React, { useState, useEffect } from 'react';
import './Faq.css';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Static fallback data
const staticFaqData = [
  {
    question: 'Why choose PVJ Jewellery?',
    answer: (
      <>
        Unlike traditional jewellers, we don't believe in mass producing because we make our Jewellery like they are meant for ourselves or our loved ones. Hence we place most of our emphasis on creating exclusive pieces and custom-made jewellery for our loyal customers. Unique and exclusive designs have been created for countless engagement rings and wedding bands. Some of our portfolio are featured on our <b>Portfolio</b> page.<br /><br />
        Started as a family business in the 1970s, the founder of PVJ Jewellery quickly rose to become personal jeweller to the most influential families in Indonesia. Today, Jewellery labels like PVJ with its long-standing history, experience, and contacts, matches the big names in exclusivity, design, and quality at a much fairer cost. With the vision and a strong belief that every customer in the region deserves a Jeweller they can trust, PVJ has since expanded to Singapore in year 2013 offering personal Jeweller services and its wide range of exquisite pieces to their local customers here. It has now a growing online customer base in Asia and Australia.
      </>
    ),
  },
  {
    question: 'Why are your prices attractive?',
    answer: (
      <>
        Our prices are attractive because we operate with lower overheads and source our materials directly from trusted suppliers. This allows us to offer high-quality jewellery at competitive prices without compromising on craftsmanship or design.
      </>
    ),
  },
  {
    question: 'Can I buy a ring setting without buying a diamond?',
    answer: (
      <>
        Yes, you can purchase a ring setting without a diamond. We offer a variety of settings that can be customized to fit your existing diamond or gemstone. Please contact us for more details and assistance with your order.
      </>
    ),
  },
  {
    question: 'Are your diamonds certified?',
    answer: (
      <>
        Yes, all our diamonds are certified by internationally recognized gemological laboratories such as GIA, IGI, or HRD. Each diamond comes with a certificate detailing its quality and characteristics.
      </>
    ),
  },
  {
    question: 'Are discounts available?',
    answer: (
      <>
        We occasionally offer discounts and promotions on selected items. Please subscribe to our newsletter or follow us on social media to stay updated on our latest offers.
      </>
    ),
  },
];

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const [faqData, setFaqData] = useState({
    generalEnquiry: [],
    placingAnOrder: [],
    shipping: [],
    maintenance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaqData();
  }, []);

  const fetchFaqData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/faq/all`);

      if (response.data.success) {
        const data = response.data.data;

        setFaqData({
          generalEnquiry: data.generalEnquiry || [],
          placingAnOrder: data.placingAnOrder || [],
          shipping: data.shipping || [],
          maintenance: data.maintenance || []
        });
      } else {
        console.error('❌ Failed to fetch FAQ data:', response.data.message);
      }
    } catch (error) {
      console.error('🚨 Error fetching FAQ data:', error);
      console.error('Error Response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <div className="main-faq-container">
      <nav className="main-faq-breadcrumb">
        <span className="main-faq-breadcrumb-home"><Link to='/'>Home</Link></span>
        <span className="main-faq-breadcrumb-sep">&#8250;</span>
        <span className="main-faq-breadcrumb-current">FAQ</span>
      </nav>
      <h2 className="main-faq-section-title-order">GENERAL ENQUIRY</h2>
      <div className="main-faq-accordion">
        {loading ? (
          <div className="loading">Loading FAQs...</div>
        ) : faqData.generalEnquiry && faqData.generalEnquiry.length > 0 ? (
          faqData.generalEnquiry.map((item, idx) => (
            <div className="main-faq-item" key={item.id || idx}>
              <button
                className={`main-faq-question${openIndex === idx ? ' main-faq-open' : ''}`}
                aria-expanded={openIndex === idx}
                aria-controls={`main-faq-panel-${idx}`}
                onClick={() => handleToggle(idx)}
              >
                {item.question}
                <span className="main-faq-icon">{openIndex === idx ? '−' : '+'}</span>
              </button>
              {openIndex === idx && (
                <div
                  className="main-faq-answer"
                  id={`main-faq-panel-${idx}`}
                  role="region"
                  aria-labelledby={`main-faq-question-${idx}`}
                >
                  <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                </div>
              )}
            </div>
          ))
        ) : (
          // Fallback to static data
          staticFaqData.map((item, idx) => (
            <div className="main-faq-item" key={idx}>
              <button
                className={`main-faq-question${openIndex === idx ? ' main-faq-open' : ''}`}
                aria-expanded={openIndex === idx}
                aria-controls={`main-faq-panel-${idx}`}
                onClick={() => handleToggle(idx)}
              >
                {item.question}
                <span className="main-faq-icon">{openIndex === idx ? '−' : '+'}</span>
              </button>
              {openIndex === idx && (
                <div
                  className="main-faq-answer"
                  id={`main-faq-panel-${idx}`}
                  role="region"
                  aria-labelledby={`main-faq-question-${idx}`}
                >
                  {item.answer}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Placing an Order Section */}
      <h2 className="main-faq-section-title main-faq-section-title-order">PLACING AN ORDER</h2>
      <FaqOrderAccordion faqData={faqData.placingAnOrder} loading={loading} />
      {/* Shipping Section */}
      <h2 className="main-faq-section-title main-faq-section-title-order">SHIPPING</h2>
      <FaqShippingAccordion faqData={faqData.shipping} loading={loading} />
      {/* Maintenance Section */}
      <h2 className="main-faq-section-title main-faq-section-title-order">MAINTENANCE</h2>
      <FaqMaintenanceAccordion faqData={faqData.maintenance} loading={loading} />
    </div>
  );
};

export default Faq;

// Static fallback data for other sections
const staticOrderFaqData = [
  {
    question: 'Can I see your jewellery in person?',
    answer: (
      <>
        We currently have one retail shop in Indonesia and two appointment-only showrooms located in Singapore and Australia. We also have a collection office in China and Hong Kong. Note that not all designs online are available in each showroom. Please <b>contact us</b> to enquire or make an appointment. We are also experienced in working with customers remotely.
      </>
    ),
  },
  {
    question: 'Which currency are your prices in?',
    answer: (
      <>
        All our prices are listed in Singapore Dollars (SGD) by default. If you are shopping from another country, your payment provider may convert the amount to your local currency at the prevailing exchange rate.
      </>
    ),
  },
  {
    question: 'What payment options do I have?',
    answer: (
      <>
        PVJ Jewellery accepts credit cards payment online via the PayPal gateway. We also accept cheque or bank / telegraphic transfer. Your orders will only be processed upon successful payment.
      </>
    ),
  },
  {
    question: 'Will I be charged tax?',
    answer: (
      <>
        Taxes may apply depending on your shipping destination. For orders shipped within Singapore, GST is included in the price. For international orders, you may be responsible for any import duties, taxes, or customs fees levied by your country.
      </>
    ),
  },
  {
    question: "I'm giving this as a gift. What are my options as I place my order?",
    answer: (
      <>
        We offer gift wrapping and the option to include a personalized message with your order. Please indicate your preferences during checkout or contact us for special arrangements.
      </>
    ),
  },
];

function FaqOrderAccordion({ faqData, loading }) {
  const [openIndex, setOpenIndex] = React.useState([0, 2]); // 0 and 2 open by default

  const handleToggle = (idx) => {
    setOpenIndex((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return <div className="loading">Loading FAQs...</div>;
  }

  const dataToShow = faqData && faqData.length > 0 ? faqData : staticOrderFaqData;

  return (
    <div className="main-faq-accordion">
      {dataToShow.map((item, idx) => (
        <div className="main-faq-item" key={item.id || idx}>
          <button
            className={`main-faq-question${openIndex.includes(idx) ? ' main-faq-open' : ''}`}
            aria-expanded={openIndex.includes(idx)}
            aria-controls={`main-faq-order-panel-${idx}`}
            onClick={() => handleToggle(idx)}
          >
            {item.question}
            <span className="main-faq-icon">{openIndex.includes(idx) ? '−' : '+'}</span>
          </button>
          {openIndex.includes(idx) && (
            <div
              className="main-faq-answer"
              id={`main-faq-order-panel-${idx}`}
              role="region"
              aria-labelledby={`main-faq-order-question-${idx}`}
            >
              {faqData && faqData.length > 0 ? (
                <div dangerouslySetInnerHTML={{ __html: item.answer }} />
              ) : (
                item.answer
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const staticShippingFaqData = [
  {
    question: 'Why is there a difference to the number of days I receive my items?',
    answer: (
      <>
        Items with the status indicated as "In-stock, receive in 5 days" are designs that are in-stock, and they can be packed and sent out in about 5 working days. Items with the status indicated as "Make-to-order, receive in 4 weeks" are designs that require backordering, and they can be packed and sent out in about 4 weeks. Please contact us if you wish to expedite your order.
      </>
    ),
  },
  {
    question: 'Are there any shipping charges to be incurred when I purchase online?',
    answer: (
      <>
        To give our customers an enjoyable shopping experience, shipping charges are waived, and international shipment will be sent via FedEx. For destinations outside Singapore, please note that you may be subjected to import taxes, sales taxes and/or customs duties, which are collected from you once the shipment arrives at your country. Please let us know if you wish to self-collect from our collection points.
      </>
    ),
  },
  {
    question: 'How is my shipment packaged and delivered?',
    answer: (
      <>
        All shipments are securely packaged in tamper-evident boxes to ensure your jewellery arrives safely and in perfect condition. We use trusted courier services and provide tracking information for every order.
      </>
    ),
  },
  {
    question: 'Can I track my order?',
    answer: (
      <>
        Yes. Once your order has been submitted, we will email you on the progress or you may also login to your account online to view the order status. On the day of shipment, we will email you the FedEx delivery confirmation that includes Fedex delivery-tracking information. You will be kept informed of the transportation process at every step.
      </>
    ),
  },
];

function FaqShippingAccordion({ faqData, loading }) {
  const [openIndex, setOpenIndex] = React.useState([0, 1, 3]); // 0, 1, 3 open by default

  const handleToggle = (idx) => {
    setOpenIndex((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return <div className="loading">Loading FAQs...</div>;
  }

  const dataToShow = faqData && faqData.length > 0 ? faqData : staticShippingFaqData;

  return (
    <div className="main-faq-accordion">
      {dataToShow.map((item, idx) => (
        <div className="main-faq-item" key={item.id || idx}>
          <button
            className={`main-faq-question${openIndex.includes(idx) ? ' main-faq-open' : ''}`}
            aria-expanded={openIndex.includes(idx)}
            aria-controls={`main-faq-shipping-panel-${idx}`}
            onClick={() => handleToggle(idx)}
          >
            {item.question}
            <span className="main-faq-icon">{openIndex.includes(idx) ? '−' : '+'}</span>
          </button>
          {openIndex.includes(idx) && (
            <div
              className="main-faq-answer"
              id={`main-faq-shipping-panel-${idx}`}
              role="region"
              aria-labelledby={`main-faq-shipping-question-${idx}`}
            >
              {faqData && faqData.length > 0 ? (
                <div dangerouslySetInnerHTML={{ __html: item.answer }} />
              ) : (
                item.answer
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const staticMaintenanceFaqData = [
  {
    question: 'Can I resize my ring if the size is not right?',
    answer: (
      <>
        Yes. We offer a one-time free resizing service within 6 months of shipment or collection. Simply contact us to arrange for your free resize. Subsequent resizing will at $45-65 per ring which also includes the checking, cleaning of diamonds and polishing of the ring.<br /><br />
        Diamond and gemstone eternity rings with a specific number of gemstones per finger size; milgrain or rings with alternative metals such as Platinum may be difficult or cannot be resized. We are happy to exchange your ring for another size within 30 days of purchase. It is important to note that should you opt for an exchange, your new ring may contain a different number of gemstones, diamonds, or a reduction or increase in precious metal weight which may cause a change in the price.
      </>
    ),
  },
  {
    question: "How can I estimate my girlfriend's ring size?",
    answer: (
      <>
        You can estimate your girlfriend's ring size by borrowing one of her rings (from the correct finger) and having it measured by a jeweller. Alternatively, you can use printable ring size guides available online or consult with our team for assistance.
      </>
    ),
  },
  {
    question: 'How can I better maintain / care for my diamond jewellery?',
    answer: (
      <>
        Do note that while diamonds are forever, the settings are not. It is advisable to take off your jewellery when performing household chores, gardening and outdoor sports. It is also vital to avoid contact with chemicals, such as nail polish removers, alcohol, perfume and hairspray. You may then wish to keep your jewellery in a compartmentalized soft cloth pouch to ensure that your jewellery items are not scratched.<br /><br />
        Daily exposure to household chemicals, skincare products and natural skin oils dulls the diamond’s natural brilliance and sparkle. We recommend professional cleaning once every month in which we use professional jewellery cleaner and brush to wash and brush away accumulated dirt and oil. This is available for purchase at SGD 28 and one bottle can last you more than 5 years if you use it properly. Please contact us if you wish to purchase the jewellery cleaner.<br /><br />
        If your ring or other diamond jewellery has undergone trauma, such as having been dropped or knocked against hard surfaces, we strongly advise a professional check to ensure the firm setting of the diamond. This is a complimentary service by PVJ Jewellery for all our customers.
      </>
    ),
  },
];

function FaqMaintenanceAccordion({ faqData, loading }) {
  const [openIndex, setOpenIndex] = React.useState([0, 2]); // 0 and 2 open by default

  const handleToggle = (idx) => {
    setOpenIndex((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return <div className="loading">Loading FAQs...</div>;
  }

  const dataToShow = faqData && faqData.length > 0 ? faqData : staticMaintenanceFaqData;

  return (
    <div className="main-faq-accordion">
      {dataToShow.map((item, idx) => (
        <div className="main-faq-item" key={item.id || idx}>
          <button
            className={`main-faq-question${openIndex.includes(idx) ? ' main-faq-open' : ''}`}
            aria-expanded={openIndex.includes(idx)}
            aria-controls={`main-faq-maintenance-panel-${idx}`}
            onClick={() => handleToggle(idx)}
          >
            {item.question}
            <span className="main-faq-icon">{openIndex.includes(idx) ? '−' : '+'}</span>
          </button>
          {openIndex.includes(idx) && (
            <div
              className="main-faq-answer"
              id={`main-faq-maintenance-panel-${idx}`}
              role="region"
              aria-labelledby={`main-faq-maintenance-question-${idx}`}
            >
              {faqData && faqData.length > 0 ? (
                <div dangerouslySetInnerHTML={{ __html: item.answer }} />
              ) : (
                item.answer
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
