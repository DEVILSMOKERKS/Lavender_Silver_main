const db = require('../config/db');
const axios = require('axios');

const pincodeController = {
    // Get all pincodes with pagination and filters
    getAllPincodes: async (req, res) => {
        try {
            const { page = 1, limit = 20, search = '', status = '', zone = '', delivery_available = '', cod_available = '', state = '' } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let where = 'WHERE 1=1';
            const params = [];

            if (search) {
                where += ' AND (pincode LIKE ? OR city LIKE ? OR state LIKE ? OR district LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            if (status && status !== 'All Pincode') {
                where += ' AND status = ?';
                params.push(status.toLowerCase());
            }

            if (zone && zone !== 'All Zones') {
                where += ' AND zone = ?';
                params.push(zone);
            }

            if (delivery_available !== '') {
                where += ' AND delivery_available = ?';
                params.push(parseInt(delivery_available));
            }

            if (cod_available !== '') {
                where += ' AND cod_available = ?';
                params.push(parseInt(cod_available));
            }

            if (state && state !== 'All States') {
                where += ' AND state = ?';
                params.push(state);
            }

            // Get total count
            const [countRows] = await db.execute(
                `SELECT COUNT(*) as total FROM pincodes ${where}`,
                params
            );

            // Get pincodes - using template literals for LIMIT and OFFSET
            const limitValue = parseInt(limit) || 20;
            const offsetValue = parseInt(offset) || 0;
            const [pincodes] = await db.execute(
                `SELECT * FROM pincodes ${where} ORDER BY created_at DESC LIMIT ${limitValue} OFFSET ${offsetValue}`,
                params
            );

            // Calculate stats
            const [totalCount] = await db.execute(
                'SELECT COUNT(*) as count FROM pincodes'
            );
            const [activeCount] = await db.execute(
                'SELECT COUNT(*) as count FROM pincodes WHERE status = "active"'
            );
            const [inactiveCount] = await db.execute(
                'SELECT COUNT(*) as count FROM pincodes WHERE status = "inactive"'
            );
            const [codCount] = await db.execute(
                'SELECT COUNT(*) as count FROM pincodes WHERE cod_available = 1 AND status = "active"'
            );

            // Get unique states for filter dropdown
            const [states] = await db.execute(
                'SELECT DISTINCT state FROM pincodes ORDER BY state ASC'
            );
            const allStates = states.map(row => row.state);

            res.json({
                success: true,
                data: pincodes,
                pagination: {
                    total: countRows[0].total,
                    total_pages: Math.ceil(countRows[0].total / parseInt(limit)),
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                },
                stats: {
                    totalPincodes: totalCount[0].count,
                    activePincodes: activeCount[0].count,
                    inactivePincodes: inactiveCount[0].count,
                    codAvailable: codCount[0].count
                },
                allStates: allStates
            });
        } catch (error) {
            console.error('Error in getAllPincodes:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Get pincode by ID
    getPincodeById: async (req, res) => {
        try {
            const { id } = req.params;
            const [pincodes] = await db.execute(
                'SELECT * FROM pincodes WHERE id = ?',
                [id]
            );

            if (pincodes.length === 0) {
                return res.status(404).json({ success: false, message: 'Pincode not found' });
            }

            res.json({ success: true, data: pincodes[0] });
        } catch (error) {
            console.error('Error in getPincodeById:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Search pincode (for product page)
    searchPincode: async (req, res) => {
        try {
            const { pincode } = req.query;

            if (!pincode || pincode.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Pincode is required' });
            }

            const [pincodes] = await db.execute(
                'SELECT * FROM pincodes WHERE pincode = ? AND status = "active"',
                [pincode.trim()]
            );

            if (pincodes.length === 0) {
                return res.json({
                    success: false,
                    message: 'Delivery not available for this pincode',
                    data: null
                });
            }

            const pincodeData = pincodes[0];
            res.json({
                success: true,
                message: 'Delivery available',
                data: {
                    pincode: pincodeData.pincode,
                    city: pincodeData.city,
                    state: pincodeData.state,
                    district: pincodeData.district,
                    zone: pincodeData.zone,
                    deliveryAvailable: pincodeData.delivery_available === 1,
                    codAvailable: pincodeData.cod_available === 1,
                    estimatedDeliveryDays: pincodeData.estimated_delivery_days
                }
            });
        } catch (error) {
            console.error('Error in searchPincode:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Create new pincode
    createPincode: async (req, res) => {
        try {
            const {
                pincode,
                city,
                state,
                district,
                zone,
                delivery_available,
                cod_available,
                estimated_delivery_days,
                status
            } = req.body;

            // Validation
            if (!pincode || !city || !state) {
                return res.status(400).json({
                    success: false,
                    message: 'Pincode, city, and state are required'
                });
            }

            // Check if pincode already exists
            const [existing] = await db.execute(
                'SELECT id FROM pincodes WHERE pincode = ?',
                [pincode.trim()]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Pincode already exists'
                });
            }

            // Insert new pincode
            const [result] = await db.execute(
                `INSERT INTO pincodes (
                    pincode, city, state, district, zone,
                    delivery_available, cod_available,
                    estimated_delivery_days, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pincode.trim(),
                    city.trim(),
                    state.trim(),
                    district?.trim() || null,
                    zone || 'Tier2',
                    delivery_available !== undefined ? delivery_available : 1,
                    cod_available !== undefined ? cod_available : 1,
                    estimated_delivery_days || 3,
                    status || 'active'
                ]
            );

            res.json({
                success: true,
                message: 'Pincode created successfully',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('Error in createPincode:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Update pincode
    updatePincode: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                pincode,
                city,
                state,
                district,
                zone,
                delivery_available,
                cod_available,
                estimated_delivery_days,
                status
            } = req.body;

            // Check if pincode exists
            const [existing] = await db.execute(
                'SELECT id FROM pincodes WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pincode not found'
                });
            }

            // Check if pincode number is being changed and if it conflicts
            if (pincode) {
                const [duplicate] = await db.execute(
                    'SELECT id FROM pincodes WHERE pincode = ? AND id != ?',
                    [pincode.trim(), id]
                );

                if (duplicate.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Pincode already exists'
                    });
                }
            }

            // Build update query
            const updateFields = [];
            const updateValues = [];

            if (pincode) {
                updateFields.push('pincode = ?');
                updateValues.push(pincode.trim());
            }
            if (city) {
                updateFields.push('city = ?');
                updateValues.push(city.trim());
            }
            if (state) {
                updateFields.push('state = ?');
                updateValues.push(state.trim());
            }
            if (district !== undefined) {
                updateFields.push('district = ?');
                updateValues.push(district?.trim() || null);
            }
            if (zone) {
                updateFields.push('zone = ?');
                updateValues.push(zone);
            }
            if (delivery_available !== undefined) {
                updateFields.push('delivery_available = ?');
                updateValues.push(delivery_available);
            }
            if (cod_available !== undefined) {
                updateFields.push('cod_available = ?');
                updateValues.push(cod_available);
            }
            if (estimated_delivery_days !== undefined) {
                updateFields.push('estimated_delivery_days = ?');
                updateValues.push(estimated_delivery_days);
            }
            if (status) {
                updateFields.push('status = ?');
                updateValues.push(status);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            updateValues.push(id);

            await db.execute(
                `UPDATE pincodes SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            res.json({
                success: true,
                message: 'Pincode updated successfully'
            });
        } catch (error) {
            console.error('Error in updatePincode:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Delete pincode
    deletePincode: async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await db.execute(
                'DELETE FROM pincodes WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pincode not found'
                });
            }

            res.json({
                success: true,
                message: 'Pincode deleted successfully'
            });
        } catch (error) {
            console.error('Error in deletePincode:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    // Fetch pincode details from external API (for admin form auto-fill - single result)
    fetchPincodeDetails: async (req, res) => {
        try {
            const { pincode } = req.query;

            if (!pincode || pincode.trim().length !== 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Pincode must be exactly 6 digits'
                });
            }

            try {
                const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode.trim()}`, {
                    timeout: 10000
                });

                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    const apiResponse = response.data[0];

                    if (apiResponse.Status === 'Success' && apiResponse.PostOffice && apiResponse.PostOffice.length > 0) {
                        const postOffices = apiResponse.PostOffice;

                        // Admin wants first delivery office or just the first result
                        const deliveryOffice = postOffices.find(po => po.DeliveryStatus === 'Delivery') || postOffices[0];

                        return res.status(200).json({
                            success: true,
                            data: {
                                pincode: pincode.trim(),
                                city: deliveryOffice.District || deliveryOffice.Name || '',
                                state: deliveryOffice.State || '',
                                district: deliveryOffice.District || ''
                            }
                        });
                    } else {
                        return res.status(404).json({
                            success: false,
                            message: 'No post office found for this pincode'
                        });
                    }
                } else {
                    return res.status(404).json({
                        success: false,
                        message: 'Invalid pincode. Please check and try again.'
                    });
                }
            } catch (apiError) {
                console.error('Error fetching pincode from external API:', apiError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Unable to fetch pincode details. Please try again later.'
                });
            }
        } catch (error) {
            console.error('Error in fetchPincodeDetails:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Lookup pincode for public checkout (returns multiple places if available)
    lookupPincode: async (req, res) => {
        try {
            const { pincode } = req.query;

            if (!pincode || pincode.trim().length !== 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Pincode must be exactly 6 digits'
                });
            }

            const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode.trim()}`, {
                timeout: 10000
            });

            if (response.data && response.data[0].Status === 'Success') {
                const postOffices = response.data[0].PostOffice;
                
                // Get all unique places
                const places = Array.from(new Set(postOffices.map(po => po.Name))).map(name => {
                    const office = postOffices.find(po => po.Name === name);
                    return {
                        name: office.Name,
                        district: office.District,
                        state: office.State
                    };
                });

                return res.status(200).json({
                    success: true,
                    data: {
                        pincode: pincode.trim(),
                        places: places,
                        state: postOffices[0].State,
                        district: postOffices[0].District
                    }
                });
            }

            return res.status(404).json({
                success: false,
                message: 'No details found for this pincode'
            });
        } catch (error) {
            console.error('Error in lookupPincode:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};


module.exports = pincodeController;

