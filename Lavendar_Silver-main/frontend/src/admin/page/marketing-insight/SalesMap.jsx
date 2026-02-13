import React, { useState, useEffect, useRef } from 'react';
import './SalesMap.css';

const SalesMap = ({ locations = [] }) => {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const mapRef = useRef(null);

    // Sample coordinates for Indian cities (you can expand this)
    const cityCoordinates = {
        'Mumbai': { lat: 19.0760, lng: 72.8777 },
        'Delhi': { lat: 28.7041, lng: 77.1025 },
        'Bangalore': { lat: 12.9716, lng: 77.5946 },
        'Hyderabad': { lat: 17.3850, lng: 78.4867 },
        'Chennai': { lat: 13.0827, lng: 80.2707 },
        'Kolkata': { lat: 22.5726, lng: 88.3639 },
        'Pune': { lat: 18.5204, lng: 73.8567 },
        'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
        'Jaipur': { lat: 26.9124, lng: 75.7873 },
        'Lucknow': { lat: 26.8467, lng: 80.9462 },
        'Kanpur': { lat: 26.4499, lng: 80.3319 },
        'Nagpur': { lat: 21.1458, lng: 79.0882 },
        'Indore': { lat: 22.7196, lng: 75.8577 },
        'Thane': { lat: 19.2183, lng: 72.9781 },
        'Bhopal': { lat: 23.2599, lng: 77.4126 },
        'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
        'Pimpri-Chinchwad': { lat: 18.6298, lng: 73.7997 },
        'Patna': { lat: 25.5941, lng: 85.1376 },
        'Vadodara': { lat: 22.3072, lng: 73.1812 },
        'Ghaziabad': { lat: 28.6692, lng: 77.4538 },
        'Ludhiana': { lat: 30.9010, lng: 75.8573 },
        'Agra': { lat: 27.1767, lng: 78.0081 },
        'Nashik': { lat: 19.9975, lng: 73.7898 },
        'Faridabad': { lat: 28.4089, lng: 77.3178 },
        'Meerut': { lat: 28.9845, lng: 77.7064 },
        'Rajkot': { lat: 22.3039, lng: 70.8022 },
        'Kalyan-Dombivali': { lat: 19.2350, lng: 73.1295 },
        'Vasai-Virar': { lat: 19.4259, lng: 72.8225 },
        'Varanasi': { lat: 25.3176, lng: 82.9739 },
        'Srinagar': { lat: 34.0837, lng: 74.7973 },
        'Aurangabad': { lat: 19.8762, lng: 75.3433 },
        'Dhanbad': { lat: 23.7957, lng: 86.4304 },
        'Amritsar': { lat: 31.6340, lng: 74.8723 },
        'Allahabad': { lat: 25.4358, lng: 81.8463 },
        'Ranchi': { lat: 23.3441, lng: 85.3096 },
        'Howrah': { lat: 22.5958, lng: 88.2636 },
        'Coimbatore': { lat: 11.0168, lng: 76.9558 },
        'Jabalpur': { lat: 23.1815, lng: 79.9864 },
        'Gwalior': { lat: 26.2183, lng: 78.1828 },
        'Vijayawada': { lat: 16.5062, lng: 80.6480 },
        'Jodhpur': { lat: 26.2389, lng: 73.0243 },
        'Madurai': { lat: 9.9252, lng: 78.1198 },
        'Raipur': { lat: 21.2514, lng: 81.6296 },
        'Kota': { lat: 25.2138, lng: 75.8648 },
        'Guwahati': { lat: 26.1445, lng: 91.7362 },
        'Chandigarh': { lat: 30.7333, lng: 76.7794 },
        'Solapur': { lat: 17.6599, lng: 75.9064 },
        'Hubli-Dharwad': { lat: 15.3647, lng: 75.1240 },
        'Bareilly': { lat: 28.3670, lng: 79.4304 },
        'Moradabad': { lat: 28.8389, lng: 78.7738 },
        'Mysore': { lat: 12.2958, lng: 76.6394 },
        'Gurgaon': { lat: 28.4595, lng: 77.0266 },
        'Aligarh': { lat: 27.8974, lng: 78.0880 },
        'Jalandhar': { lat: 31.3260, lng: 75.5762 },
        'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
        'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
        'Salem': { lat: 11.6643, lng: 78.1460 },
        'Warangal': { lat: 17.9689, lng: 79.5941 },
        'Mira-Bhayandar': { lat: 19.2952, lng: 72.8544 },
        'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
        'Bhiwandi': { lat: 19.2969, lng: 73.0629 },
        'Saharanpur': { lat: 29.9675, lng: 77.5451 },
        'Guntur': { lat: 16.2991, lng: 80.4575 },
        'Amravati': { lat: 20.9374, lng: 77.7796 },
        'Noida': { lat: 28.5355, lng: 77.3910 },
        'Jamshedpur': { lat: 22.8046, lng: 86.2029 },
        'Bhilai': { lat: 21.2096, lng: 81.4285 },
        'Cuttack': { lat: 20.4625, lng: 85.8830 },
        'Firozabad': { lat: 27.1591, lng: 78.3958 },
        'Kochi': { lat: 9.9312, lng: 76.2673 },
        'Nellore': { lat: 14.4426, lng: 79.9865 },
        'Bhavnagar': { lat: 21.7645, lng: 72.1519 },
        'Dehradun': { lat: 30.3165, lng: 78.0322 },
        'Durgapur': { lat: 23.5204, lng: 87.3119 },
        'Asansol': { lat: 23.6889, lng: 86.9661 },
        'Rourkela': { lat: 22.2492, lng: 84.8828 },
        'Nanded': { lat: 19.1383, lng: 77.3210 },
        'Kolhapur': { lat: 16.7050, lng: 74.2433 },
        'Ajmer': { lat: 26.4499, lng: 74.6399 },
        'Akola': { lat: 20.7096, lng: 77.0022 },
        'Gulbarga': { lat: 17.3297, lng: 76.8343 },
        'Jamnagar': { lat: 22.4707, lng: 70.0577 },
        'Ujjain': { lat: 23.1765, lng: 75.7885 },
        'Loni': { lat: 28.7515, lng: 77.2885 },
        'Siliguri': { lat: 26.7271, lng: 88.3953 },
        'Jhansi': { lat: 25.4484, lng: 78.5685 },
        'Ulhasnagar': { lat: 19.2183, lng: 73.1634 },
        'Jammu': { lat: 32.7266, lng: 74.8570 },
        'Sangli-Miraj & Kupwad': { lat: 16.8524, lng: 74.5815 },
        'Mangalore': { lat: 12.9716, lng: 74.8631 },
        'Erode': { lat: 11.3410, lng: 77.7172 },
        'Belgaum': { lat: 15.8497, lng: 74.4977 },
        'Ambattur': { lat: 13.0982, lng: 80.1614 },
        'Tirunelveli': { lat: 8.7139, lng: 77.7567 },
        'Malegaon': { lat: 20.5609, lng: 74.5250 },
        'Gaya': { lat: 24.7914, lng: 85.0002 },
        'Jalgaon': { lat: 21.0077, lng: 75.5626 },
        'Udaipur': { lat: 24.5854, lng: 73.7125 },
        'Maheshtala': { lat: 22.5086, lng: 88.2532 },
        'Tirupur': { lat: 11.1085, lng: 77.3411 },
        'Davanagere': { lat: 14.4644, lng: 75.9218 },
        'Kozhikode': { lat: 11.2588, lng: 75.7804 },
        'Akbarpur': { lat: 26.4307, lng: 82.5363 },
        'Kurnool': { lat: 15.8281, lng: 78.0373 },
        'Bokaro Steel City': { lat: 23.6693, lng: 86.1511 },
        'Rajahmundry': { lat: 16.9849, lng: 81.7870 },
        'Ballari': { lat: 15.1394, lng: 76.9214 },
        'Agartala': { lat: 23.8315, lng: 91.2868 },
        'Bhagalpur': { lat: 25.2445, lng: 87.0108 },
        'Latur': { lat: 18.4088, lng: 76.5604 },
        'Dhule': { lat: 20.9029, lng: 74.7773 },
        'Korba': { lat: 22.3458, lng: 82.6963 },
        'Bhilwara': { lat: 25.3463, lng: 74.6364 },
        'Brahmapur': { lat: 19.3149, lng: 84.7941 },
        'Muzaffarpur': { lat: 26.1209, lng: 85.3647 },
        'Ahmednagar': { lat: 19.0952, lng: 74.7496 },
        'Mathura': { lat: 27.4924, lng: 77.6737 },
        'Kollam': { lat: 8.8932, lng: 76.6141 },
        'Avadi': { lat: 13.1147, lng: 80.0997 },
        'Kadapa': { lat: 14.4753, lng: 78.8355 },
        'Anantapur': { lat: 14.6819, lng: 77.6006 },
        'Tiruchengode': { lat: 11.3805, lng: 77.8944 },
        'Bharatpur': { lat: 27.1767, lng: 77.8205 },
        'Bijapur': { lat: 16.8302, lng: 75.7156 },
        'Rampur': { lat: 28.8108, lng: 79.0268 },
        'Shivamogga': { lat: 13.9299, lng: 75.5681 },
        'Ratlam': { lat: 23.3343, lng: 75.0376 },
        'Modinagar': { lat: 28.8358, lng: 77.7033 },
        'Durg': { lat: 21.1904, lng: 81.2849 },
        'Shillong': { lat: 25.5788, lng: 91.8933 },
        'Imphal': { lat: 24.8170, lng: 93.9368 },
        'Hapur': { lat: 28.7291, lng: 77.7811 },
        'Arrah': { lat: 25.5545, lng: 84.6704 },
        'Karimnagar': { lat: 18.4386, lng: 79.1288 },
        'Etawah': { lat: 26.7769, lng: 79.0239 },
        'Ambernath': { lat: 19.2016, lng: 73.2005 },
        'North Dumdum': { lat: 22.6140, lng: 88.4227 },
        'Begusarai': { lat: 25.4180, lng: 86.1309 },
        'New Delhi': { lat: 28.6139, lng: 77.2090 },
        'Gandhidham': { lat: 23.0833, lng: 70.1333 },
        'Baranagar': { lat: 22.6413, lng: 88.3773 },
        'Tiruvottiyur': { lat: 13.1579, lng: 80.3045 },
        'Puducherry': { lat: 11.9416, lng: 79.8083 },
        'Sikar': { lat: 27.6093, lng: 75.1397 },
        'Thoothukkudi': { lat: 8.7642, lng: 78.1348 },
        'Rewa': { lat: 24.5373, lng: 81.3042 },
        'Mirzapur': { lat: 25.1449, lng: 82.5653 },
        'Raichur': { lat: 16.2076, lng: 77.3463 },
        'Pali': { lat: 25.7711, lng: 73.3234 },
        'Ramagundam': { lat: 18.8000, lng: 79.4500 },
        'Haridwar': { lat: 29.9457, lng: 78.1642 },
        'Vijayanagaram': { lat: 18.1169, lng: 83.4115 },
        'Katihar': { lat: 25.5335, lng: 87.5837 },
        'Nagercoil': { lat: 8.1833, lng: 77.4167 },
        'Sri Ganganagar': { lat: 29.9038, lng: 73.8772 },
        'Karawal Nagar': { lat: 28.7288, lng: 77.2767 },
        'Mango': { lat: 22.8389, lng: 86.2039 },
        'Thane West': { lat: 19.2183, lng: 72.9781 },
        'Bulandshahr': { lat: 28.4039, lng: 77.8577 },
        'Uluberia': { lat: 22.4707, lng: 88.1105 },
        'Katni': { lat: 23.8315, lng: 80.4074 },
        'Sambhal': { lat: 28.5841, lng: 78.5699 },
        'Singrauli': { lat: 24.1997, lng: 82.6753 },
        'Nadiad': { lat: 22.6939, lng: 72.8616 },
        'Secunderabad': { lat: 17.4399, lng: 78.4983 },
        'Naihati': { lat: 22.8940, lng: 88.4150 },
        'Yamunanagar': { lat: 30.1290, lng: 77.2674 },
        'Bidhan Nagar': { lat: 22.5726, lng: 88.3639 },
        'Pallavaram': { lat: 12.9716, lng: 80.1508 },
        'Bidar': { lat: 17.9104, lng: 77.5199 },
        'Munger': { lat: 25.3748, lng: 86.4735 },
        'Panchkula': { lat: 30.6942, lng: 76.8606 },
        'Burhanpur': { lat: 21.3000, lng: 76.2300 },
        'Raurkela Industrial Township': { lat: 22.2492, lng: 84.8828 },
        'Kharagpur': { lat: 22.3460, lng: 87.2320 },
        'Dindigul': { lat: 10.3650, lng: 77.9800 },
        'Gandhinagar': { lat: 23.2156, lng: 72.6369 },
        'Hospet': { lat: 15.2667, lng: 76.4000 },
        'Nangloi Jat': { lat: 28.6833, lng: 77.0667 },
        'Malda': { lat: 25.0119, lng: 88.1433 },
        'Ongole': { lat: 15.5036, lng: 80.0444 },
        'Deoghar': { lat: 24.4833, lng: 86.7000 },
        'Chapra': { lat: 25.7833, lng: 84.7333 },
        'Haldia': { lat: 22.0257, lng: 88.0583 },
        'Khandwa': { lat: 21.8247, lng: 76.3529 },
        'Nandyal': { lat: 15.4800, lng: 78.4800 },
        'Morena': { lat: 26.4969, lng: 78.0008 },
        'Amroha': { lat: 28.9031, lng: 78.4698 },
        'Anand': { lat: 22.5565, lng: 72.9622 },
        'Bhind': { lat: 26.5667, lng: 78.7833 },
        'Bhalswa Jahangir Pur': { lat: 28.7389, lng: 77.1494 },
        'Madhyamgram': { lat: 22.7000, lng: 88.4500 },
        'Bhiwani': { lat: 28.7975, lng: 76.1318 },
        'Berhampore': { lat: 24.1000, lng: 88.2500 },
        'Ambala': { lat: 30.3752, lng: 76.7821 },
        'Mori': { lat: 30.7196, lng: 78.4601 },
        'Fatehpur': { lat: 25.9304, lng: 80.8129 },
        'Raebareli': { lat: 26.2309, lng: 81.2332 },
        'Khora': { lat: 28.6324, lng: 77.3717 },
        'Chittoor': { lat: 13.2159, lng: 79.1009 },
        'Barshi': { lat: 18.2333, lng: 75.7000 },
        'Puri': { lat: 19.8133, lng: 85.8315 },
        'Haldwani-cum-Kathgodam': { lat: 29.2208, lng: 79.5286 },
        'Vellore': { lat: 12.9716, lng: 79.1586 },
        'Malkajgiri': { lat: 17.4474, lng: 78.5262 },
        'Sangli': { lat: 16.8524, lng: 74.5815 },
        'Proddatur': { lat: 14.7500, lng: 78.5500 },
        'Tinsukia': { lat: 27.5000, lng: 95.3500 },
        'Itanagar': { lat: 27.0844, lng: 93.6053 },
        'Kohima': { lat: 25.6751, lng: 94.1086 },
        'Aizawl': { lat: 23.7307, lng: 92.7173 },
        'Dispur': { lat: 26.1433, lng: 91.7898 },
        'Shahpura': { lat: 25.6200, lng: 74.9300 },
        'Rajasthan': { lat: 27.0238, lng: 74.2179 }
    };

    // Function to get coordinates for a location
    const getLocationCoordinates = (city, state) => {
        // Try to find exact city match first
        if (cityCoordinates[city]) {
            return cityCoordinates[city];
        }
        
        // Try state as fallback
        if (cityCoordinates[state]) {
            return cityCoordinates[state];
        }
        
        // Default to India center if not found
        return { lat: 20.5937, lng: 78.9629 };
    };

    // Function to create custom marker icon
    const createCustomMarker = (rank, revenue) => {
        const size = Math.max(30, Math.min(60, 30 + (revenue / 10000) * 10));
        const color = rank <= 3 ? 
            (rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : '#cd7f32') : 
            '#e5e7eb';
        
        return `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: ${size * 0.4}px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                cursor: pointer;
            ">
                ${rank}
            </div>
        `;
    };

    // Initialize map when component mounts
    useEffect(() => {
        if (!mapRef.current || !leafletLoaded || !window.L) return;

        try {
            // Create map instance
            const mapInstance = window.L.map(mapRef.current).setView([20.5937, 78.9629], 5);
            
            // Add tile layer (OpenStreetMap)
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstance);

            setMap(mapInstance);

            return () => {
                if (mapInstance) {
                    mapInstance.remove();
                }
            };
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }, [leafletLoaded]);

    // Update markers when locations change
    useEffect(() => {
        if (!map || !locations.length || !window.L) return;

        try {
            // Clear existing markers
            markers.forEach(marker => marker.remove());
            const newMarkers = [];

            // Add markers for each location
            locations.forEach((location, index) => {
                const coords = getLocationCoordinates(location.shipping_city, location.shipping_state);
                const rank = index + 1;
                
                // Create custom marker
                const customIcon = window.L.divIcon({
                    html: createCustomMarker(rank, location.total_revenue),
                    className: 'custom-marker',
                    iconSize: [60, 60],
                    iconAnchor: [30, 30]
                });

                // Create popup content
                const popupContent = `
                    <div class="map-popup">
                        <h3>${location.shipping_city}</h3>
                        <p><strong>Rank:</strong> #${rank}</p>
                        <p><strong>Revenue:</strong> ₹${location.total_revenue.toLocaleString()}</p>
                        <p><strong>Orders:</strong> ${location.total_orders}</p>
                        <p><strong>Customers:</strong> ${location.unique_customers}</p>
                        <p><strong>Items Sold:</strong> ${location.total_items_sold}</p>
                    </div>
                `;

                // Add marker to map
                const marker = window.L.marker([coords.lat, coords.lng], { icon: customIcon })
                    .addTo(map)
                    .bindPopup(popupContent);

                newMarkers.push(marker);
            });

            setMarkers(newMarkers);

            // Fit map to show all markers
            if (newMarkers.length > 0) {
                const group = new window.L.featureGroup(newMarkers);
                map.fitBounds(group.getBounds().pad(0.1));
            }
        } catch (error) {
            console.error('Error updating markers:', error);
        }
    }, [map, locations]);

    // Load Leaflet CSS and JS
    useEffect(() => {
        // Check if Leaflet is already loaded
        if (window.L) {
            setLeafletLoaded(true);
            return;
        }

        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => {
            setLeafletLoaded(true);
        };
        script.onerror = () => {
            console.error('Failed to load Leaflet library');
        };
        document.head.appendChild(script);

        return () => {
            // Clean up only if we added them
            const existingLink = document.querySelector('link[href*="leaflet"]');
            const existingScript = document.querySelector('script[src*="leaflet"]');
            
            if (existingLink && existingLink === link) {
                document.head.removeChild(link);
            }
            if (existingScript && existingScript === script) {
                document.head.removeChild(script);
            }
        };
    }, []);

    if (!leafletLoaded) {
        return (
            <div className="map-container">
                <div className="map-loading">
                    <div className="map-loading-spinner"></div>
                    <p>Loading map...</p>
                </div>
            </div>
        );
    }

    if (!locations.length) {
        return (
            <div className="map-container">
                <div className="map-placeholder">
                    <div className="map-icon">🗺️</div>
                    <h3>No Location Data Available</h3>
                    <p>No sales data available to display on the map.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="map-container">
            <div ref={mapRef} className="sales-map"></div>
            <div className="map-legend">
                <h4>Legend</h4>
                <div className="legend-item">
                    <div className="legend-marker rank-1">1</div>
                    <span>Top Performer</span>
                </div>
                <div className="legend-item">
                    <div className="legend-marker rank-2">2</div>
                    <span>Second Best</span>
                </div>
                <div className="legend-item">
                    <div className="legend-marker rank-3">3</div>
                    <span>Third Best</span>
                </div>
                <div className="legend-item">
                    <div className="legend-marker rank-other">4+</div>
                    <span>Other Locations</span>
                </div>
            </div>
        </div>
    );
};

export default SalesMap; 