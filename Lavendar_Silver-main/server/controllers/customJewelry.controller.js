const db = require("../config/db");
const { sendEmail } = require("../utils/emailSender");
const path = require("path");
const fs = require("fs");

// Create custom jewelry request
const createCustomJewelryRequest = async (req, res) => {
  try {
    const {
      jewelryType,
      metalType,
      weight,
      designDescription,
      budget,
      deliveryDate,
      contactNumber,
      email,
      address,
      specialRequirements,
    } = req.body;

    // Get user ID from token if available, otherwise null
    const userId = req.user ? req.user.id : null;

    // Validate required fields with detailed error messages
    const validationErrors = {};

    if (!jewelryType || jewelryType.trim() === "") {
      validationErrors.jewelryType = "Jewelry type is required";
    }

    if (!metalType || metalType.trim() === "") {
      validationErrors.metalType = "Metal type is required";
    }

    if (!weight || parseFloat(weight) <= 0) {
      validationErrors.weight = "Weight must be greater than 0";
    }

    if (!designDescription || designDescription.trim().length < 10) {
      validationErrors.designDescription =
        "Design description must be at least 10 characters";
    }

    if (!budget || parseFloat(budget) <= 0) {
      validationErrors.budget = "Budget must be greater than 0";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === "") {
      validationErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      validationErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = contactNumber ? contactNumber.replace(/\D/g, "") : "";
    if (!contactNumber || contactNumber.trim() === "") {
      validationErrors.contactNumber = "Contact number is required";
    } else if (!phoneRegex.test(cleanPhone)) {
      validationErrors.contactNumber =
        "Please enter a valid 10-digit phone number";
    }

    // Delivery date validation
    if (deliveryDate) {
      const selectedDate = new Date(deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        validationErrors.deliveryDate = "Delivery date cannot be in the past";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the validation errors",
        errors: validationErrors,
      });
    }

    // Process uploaded files
    let referenceImages = null;
    if (req.files && req.files.length > 0) {
      referenceImages = req.files.map((file) => ({
        url: `/custom-jewelry/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      }));
    }

    // Insert the request
    const query = `
            INSERT INTO custom_jewelry_requests 
            (user_id, jewelry_type, metal_type, weight, design_description, budget, delivery_date, contact_number, email, address, special_requirements, reference_images, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

    const values = [
      userId,
      jewelryType,
      metalType,
      weight,
      designDescription,
      budget,
      deliveryDate || null,
      contactNumber,
      email,
      address || null,
      specialRequirements || null,
      referenceImages ? JSON.stringify(referenceImages) : null,
    ];

    const [result] = await db.execute(query, values);
    const requestId = result.insertId;

    // Create notification (user_id can be null for guest users)
    try {
        await db.execute(
            'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
            [userId || null, 'success', `Custom jewelry request #${requestId} has been submitted successfully!`]
        );
    } catch (notifError) {
        console.error('Error creating notification:', notifError);
    }

    // Send confirmation email to user
    const userEmailSubject = "Custom Jewelry Request Submitted Successfully";
    const userEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0e593c; margin: 0; font-size: 28px;">Custom Jewelry Request</h1>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your request has been submitted successfully!</p>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h2 style="color: #0e593c; margin: 0 0 15px 0; font-size: 20px;">Request Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Request ID:</td>
                                <td style="padding: 8px 0; color: #666;">#${requestId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Jewelry Type:</td>
                                <td style="padding: 8px 0; color: #666;">${jewelryType}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Metal Type:</td>
                                <td style="padding: 8px 0; color: #666;">${metalType}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Weight:</td>
                                <td style="padding: 8px 0; color: #666;">${weight}g</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Budget:</td>
                                <td style="padding: 8px 0; color: #666;">₹${budget}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Status:</td>
                                <td style="padding: 8px 0; color: #0e593c; font-weight: bold;">Pending Review</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #856404;">
                            <li style="margin-bottom: 8px;">Our design team will review your request within 24-48 hours</li>
                            <li style="margin-bottom: 8px;">You'll receive updates via email and in your account</li>
                            <li style="margin-bottom: 8px;">We may contact you for additional details if needed</li>
                            <li style="margin-bottom: 0;">Track your request status in your account dashboard</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #666; margin: 0; font-size: 14px;">
                            Thank you for choosing PVJ for your custom jewelry needs!
                        </p>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                            If you have any questions, please contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        `;

    try {
      const userEmailResult = await sendEmail({
        to: email,
        subject: userEmailSubject,
        html: userEmailHtml,
      });

      if (!userEmailResult.success) {
        console.error("Failed to send user email:", userEmailResult.error);
      } else {
      }
    } catch (emailError) {
      console.error("Error sending user confirmation email:", emailError);
    }

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@pvj.com";
    const adminEmailSubject = `New Custom Jewelry Request - #${requestId}`;
    const adminEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                <div style="background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0e593c; margin: 0; font-size: 28px;">New Custom Request</h1>
                        <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">A new custom jewelry request has been submitted</p>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <h2 style="color: #1976d2; margin: 0 0 15px 0; font-size: 20px;">Request Information</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Request ID:</td>
                                <td style="padding: 8px 0; color: #666;">#${requestId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Customer Email:</td>
                                <td style="padding: 8px 0; color: #666;">${email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Contact Number:</td>
                                <td style="padding: 8px 0; color: #666;">${contactNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Jewelry Type:</td>
                                <td style="padding: 8px 0; color: #666;">${jewelryType}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Metal Type:</td>
                                <td style="padding: 8px 0; color: #666;">${metalType}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Weight:</td>
                                <td style="padding: 8px 0; color: #666;">${weight}g</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #333;">Budget:</td>
                                <td style="padding: 8px 0; color: #666;">₹${budget}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px;">
                        <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">Design Description</h3>
                        <p style="color: #856404; margin: 0; line-height: 1.6;">${designDescription}</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #666; margin: 0; font-size: 14px;">
                            Please review this request in the admin panel.
                        </p>
                    </div>
                </div>
            </div>
        `;

    try {
      const adminEmailResult = await sendEmail({
        to: adminEmail,
        subject: adminEmailSubject,
        html: adminEmailHtml,
      });

      if (!adminEmailResult.success) {
        console.error("Failed to send admin email:", adminEmailResult.error);
      } else {
      }
    } catch (emailError) {
      console.error("Error sending admin notification email:", emailError);
    }

    res.status(201).json({
      success: true,
      message:
        "Custom jewelry request submitted successfully! You will receive a confirmation email shortly.",
      data: {
        id: requestId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error creating custom jewelry request:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to submit your custom jewelry request at this time. Please try again later or contact support if the issue persists.",
    });
  }
};

// Get all custom jewelry requests (admin)
const getAllCustomJewelryRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Validate and convert parameters to integers
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "";
    let params = [];

    if (status) {
      whereClause += " WHERE status = ?";
      params.push(status);
    }

    if (search) {
      const searchClause = status ? " AND" : " WHERE";
      whereClause += `${searchClause} (jewelry_type LIKE ? OR metal_type LIKE ? OR design_description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM custom_jewelry_requests${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    // Get requests with pagination - use template literals for LIMIT/OFFSET
    const query = `
            SELECT 
                cjr.*,
                u.name as user_name,
                COALESCE(u.email, cjr.email) as user_email,
                COALESCE(u.phone, cjr.contact_number) as contact_number
            FROM custom_jewelry_requests cjr
            LEFT JOIN user u ON cjr.user_id = u.id
            ${whereClause}
            ORDER BY cjr.created_at DESC
            LIMIT ${limitNum} OFFSET ${offset}
        `;

    const [requests] = await db.execute(query, params);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching custom jewelry requests:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve custom jewelry requests at this time. Please try again later.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Get custom jewelry request by ID
const getCustomJewelryRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
            SELECT 
                cjr.*,
                u.name as user_name,
                COALESCE(u.email, cjr.email) as user_email,
                COALESCE(u.phone, cjr.contact_number) as contact_number
            FROM custom_jewelry_requests cjr
            LEFT JOIN user u ON cjr.user_id = u.id
            WHERE cjr.id = ?
        `;

    const [requests] = await db.execute(query, [id]);

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "The requested custom jewelry order could not be found. Please check the order ID and try again.",
      });
    }

    res.json({
      success: true,
      data: requests[0],
    });
  } catch (error) {
    console.error("Error fetching custom jewelry request:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve the custom jewelry order details at this time. Please try again later.",
    });
  }
};

// Update custom jewelry request status (admin)
const updateCustomJewelryRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, estimatedPrice, estimatedDeliveryDate } =
      req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "pending",
      "approved",
      "in_progress",
      "completed",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const query = `
            UPDATE custom_jewelry_requests 
            SET status = ?, admin_notes = ?, estimated_price = ?, estimated_delivery_date = ?, updated_at = NOW()
            WHERE id = ?
        `;

    await db.execute(query, [
      status,
      adminNotes || null,
      estimatedPrice || null,
      estimatedDeliveryDate || null,
      id,
    ]);

    // Get request details for email notification
    const getRequestQuery = `
            SELECT cjr.*, u.email as user_email, u.name as user_name
            FROM custom_jewelry_requests cjr
            LEFT JOIN user u ON cjr.user_id = u.id
            WHERE cjr.id = ?
        `;

    const [requests] = await db.execute(getRequestQuery, [id]);
    const request = requests[0];

    if (request && request.user_email) {
      // Send email notification to user
      const emailSubject = `Custom Jewelry Request Update - ${status.toUpperCase()}`;
      let emailBody = `
                <h2>Your Custom Jewelry Request Update</h2>
                <p>Dear ${request.user_name || "Valued Customer"},</p>
                <p>Your custom jewelry request has been updated to: <strong>${status.toUpperCase()}</strong></p>
                <p><strong>Request Details:</strong></p>
                <ul>
                    <li>Jewelry Type: ${request.jewelry_type}</li>
                    <li>Metal Type: ${request.metal_type}</li>
                    <li>Weight: ${request.weight}</li>
                    <li>Budget: ₹${request.budget}</li>
                </ul>
            `;

      if (adminNotes) {
        emailBody += `<p><strong>Admin Notes:</strong> ${adminNotes}</p>`;
      }

      if (estimatedPrice) {
        emailBody += `<p><strong>Estimated Price:</strong> ₹${estimatedPrice}</p>`;
      }

      if (estimatedDeliveryDate) {
        emailBody += `<p><strong>Estimated Delivery Date:</strong> ${estimatedDeliveryDate}</p>`;
      }

      emailBody += `
                <p>We will keep you updated on the progress of your custom jewelry.</p>
                <p>Thank you for choosing PVJ!</p>
            `;

      await sendEmail(request.user_email, emailSubject, emailBody);
    }

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@pvj.com";
    const adminEmailSubject = `Custom Jewelry Request Status Updated - ${status.toUpperCase()}`;
    let adminEmailBody = `
            <h2>Custom Jewelry Request Status Update</h2>
            <p>A custom jewelry request status has been updated.</p>
            <p><strong>Request Details:</strong></p>
            <ul>
                <li>Request ID: ${id}</li>
                <li>Customer: ${request?.user_name || "N/A"}</li>
                <li>Customer Email: ${request?.user_email || "N/A"}</li>
                <li>Jewelry Type: ${request?.jewelry_type || "N/A"}</li>
                <li>Metal Type: ${request?.metal_type || "N/A"}</li>
                <li>Weight: ${request?.weight || "N/A"}</li>
                <li>Budget: ₹${request?.budget || "N/A"}</li>
                <li>New Status: ${status.toUpperCase()}</li>
            </ul>
        `;

    if (adminNotes) {
      adminEmailBody += `<p><strong>Admin Notes:</strong> ${adminNotes}</p>`;
    }

    if (estimatedPrice) {
      adminEmailBody += `<p><strong>Estimated Price:</strong> ₹${estimatedPrice}</p>`;
    }

    if (estimatedDeliveryDate) {
      adminEmailBody += `<p><strong>Estimated Delivery Date:</strong> ${estimatedDeliveryDate}</p>`;
    }

    adminEmailBody += `
            <p>This is an automated notification for your records.</p>
        `;

    await sendEmail(adminEmail, adminEmailSubject, adminEmailBody);

    res.json({
      success: true,
      message: "Custom jewelry request status updated successfully",
    });
  } catch (error) {
    console.error("Error updating custom jewelry request status:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to update the custom jewelry order status at this time. Please try again later.",
    });
  }
};

// Get user's custom jewelry requests
const getUserCustomJewelryRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate and convert parameters to integers
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countQuery =
      "SELECT COUNT(*) as total FROM custom_jewelry_requests WHERE user_id = ?";
    const [countResult] = await db.execute(countQuery, [userId]);
    const total = countResult[0].total;

    // Get user's requests
    const query = `
            SELECT * FROM custom_jewelry_requests 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ${limitNum} OFFSET ${offset}
        `;

    const [requests] = await db.execute(query, [userId]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching user custom jewelry requests:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your custom jewelry requests at this time. Please try again later.",
    });
  }
};

// Get user's custom jewelry requests using token
const getUserCustomJewelryRequestsFromToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Validate and convert parameters to integers
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const countQuery =
      "SELECT COUNT(*) as total FROM custom_jewelry_requests WHERE user_id = ?";
    const [countResult] = await db.execute(countQuery, [userId]);
    const total = countResult[0].total;

    // Get user's requests
    const query = `
            SELECT * FROM custom_jewelry_requests 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ${limitNum} OFFSET ${offset}
        `;

    const [requests] = await db.execute(query, [userId]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching user custom jewelry requests:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your custom jewelry requests at this time. Please try again later or contact support if the issue persists.",
    });
  }
};

// Get custom jewelry statistics (admin)
const getCustomJewelryStats = async (req, res) => {
  try {
    // Total requests
    const [totalResult] = await db.execute(
      "SELECT COUNT(*) as total FROM custom_jewelry_requests"
    );

    // Requests by status
    const [statusResult] = await db.execute(`
            SELECT status, COUNT(*) as count 
            FROM custom_jewelry_requests 
            GROUP BY status
        `);

    // Monthly requests
    const [monthlyResult] = await db.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM custom_jewelry_requests 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month DESC
        `);

    // Average budget
    const [avgBudgetResult] = await db.execute(
      "SELECT AVG(budget) as avg_budget FROM custom_jewelry_requests"
    );

    res.json({
      success: true,
      data: {
        totalRequests: totalResult[0].total,
        statusBreakdown: statusResult,
        monthlyTrend: monthlyResult,
        averageBudget: avgBudgetResult[0].avg_budget || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching custom jewelry statistics:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve custom jewelry statistics at this time. Please try again later.",
    });
  }
};

// Delete custom jewelry request (user can delete their own requests)
const deleteCustomJewelryRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if request exists and belongs to the user
    const [requests] = await db.execute(
      "SELECT * FROM custom_jewelry_requests WHERE id = ?",
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const request = requests[0];

    // Verify the request belongs to the user
    if (request.user_id && request.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this request",
      });
    }

    // Delete reference images if they exist
    if (request.reference_images) {
      try {
        let images = null;
        try {
          images =
            typeof request.reference_images === "string"
              ? JSON.parse(request.reference_images)
              : request.reference_images;
        } catch (parseError) {
          console.error("Error parsing reference_images:", parseError);
          images = null;
        }

        if (images && Array.isArray(images) && images.length > 0) {
          images.forEach((image) => {
            try {
              let imagePath = null;

              // Handle different image formats
              if (typeof image === "string") {
                // If it's a string, it might be a URL or path
                imagePath = image.startsWith("/") ? image : `/${image}`;
              } else if (image && typeof image === "object") {
                // If it's an object, get url or path property
                imagePath = image.url || image.path || image.filename;
              }

              if (imagePath) {
                // Remove leading slash if present and construct full path
                const cleanPath = imagePath.startsWith("/")
                  ? imagePath.substring(1)
                  : imagePath;

                // Try different possible paths
                const possiblePaths = [
                  path.join("public", cleanPath),
                  path.join(
                    "public",
                    "custom-jewelry",
                    path.basename(cleanPath)
                  ),
                  path.join(__dirname, "..", "public", cleanPath),
                  path.join(
                    __dirname,
                    "..",
                    "public",
                    "custom-jewelry",
                    path.basename(cleanPath)
                  ),
                ];

                let deleted = false;
                for (const fullPath of possiblePaths) {
                  if (fs.existsSync(fullPath)) {
                    try {
                      fs.unlinkSync(fullPath);
                      deleted = true;
                      break;
                    } catch (unlinkError) {
                      console.error(
                        `Error deleting image at ${fullPath}:`,
                        unlinkError
                      );
                    }
                  }
                }

                if (!deleted) {
                  console.warn(`Image not found for deletion: ${imagePath}`);
                }
              }
            } catch (imageError) {
              console.error("Error processing image for deletion:", imageError);
              // Continue with next image
            }
          });
        }
      } catch (error) {
        console.error("Error deleting reference images:", error);
        // Continue with request deletion even if image deletion fails
      }
    }

    // Delete the request
    await db.execute("DELETE FROM custom_jewelry_requests WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Custom jewelry request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom jewelry request:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting custom jewelry request",
    });
  }
};

// Delete custom jewelry request (admin - can delete any request)
const deleteCustomJewelryRequestAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if request exists
    const [requests] = await db.execute(
      "SELECT * FROM custom_jewelry_requests WHERE id = ?",
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const request = requests[0];

    // Delete reference images if they exist
    if (request.reference_images) {
      try {
        let images = null;
        try {
          images =
            typeof request.reference_images === "string"
              ? JSON.parse(request.reference_images)
              : request.reference_images;
        } catch (parseError) {
          console.error("Error parsing reference_images:", parseError);
          images = null;
        }

        if (images && Array.isArray(images) && images.length > 0) {
          images.forEach((image) => {
            try {
              let imagePath = null;

              // Handle different image formats
              if (typeof image === "string") {
                imagePath = image.startsWith("/") ? image : `/${image}`;
              } else if (image && typeof image === "object") {
                imagePath = image.url || image.path || image.filename;
              }

              if (imagePath) {
                const cleanPath = imagePath.startsWith("/")
                  ? imagePath.substring(1)
                  : imagePath;

                const possiblePaths = [
                  path.join("public", cleanPath),
                  path.join(
                    "public",
                    "custom-jewelry",
                    path.basename(cleanPath)
                  ),
                  path.join(__dirname, "..", "public", cleanPath),
                  path.join(
                    __dirname,
                    "..",
                    "public",
                    "custom-jewelry",
                    path.basename(cleanPath)
                  ),
                ];

                let deleted = false;
                for (const fullPath of possiblePaths) {
                  if (fs.existsSync(fullPath)) {
                    try {
                      fs.unlinkSync(fullPath);
                      deleted = true;
                      break;
                    } catch (unlinkError) {
                      console.error(
                        `Error deleting image at ${fullPath}:`,
                        unlinkError
                      );
                    }
                  }
                }

                if (!deleted) {
                  console.warn(`Image not found for deletion: ${imagePath}`);
                }
              }
            } catch (imageError) {
              console.error("Error processing image for deletion:", imageError);
            }
          });
        }
      } catch (error) {
        console.error("Error deleting reference images:", error);
      }
    }

    // Delete the request
    await db.execute("DELETE FROM custom_jewelry_requests WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Custom jewelry request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom jewelry request:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting custom jewelry request",
    });
  }
};

module.exports = {
  createCustomJewelryRequest,
  getAllCustomJewelryRequests,
  getCustomJewelryRequestById,
  updateCustomJewelryRequestStatus,
  getUserCustomJewelryRequests,
  getUserCustomJewelryRequestsFromToken,
  getCustomJewelryStats,
  deleteCustomJewelryRequest,
  deleteCustomJewelryRequestAdmin,
};
