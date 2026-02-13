-- PVJ Database Schema Export
-- Generated on: 2025-11-18T06:20:53.974Z
-- Total Tables: 89
SET
  FOREIGN_KEY_CHECKS = 0;

SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

SET
  AUTOCOMMIT = 0;

START TRANSACTION;

SET
  time_zone = "+00:00";

-- Table: about_us_section
DROP TABLE IF EXISTS `about_us_section`;

CREATE TABLE
  `about_us_section` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `section_title` varchar(255) DEFAULT NULL,
    `subheading` varchar(255) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `button_text` varchar(100) DEFAULT NULL,
    `image_url` text DEFAULT NULL,
    `badge_text` varchar(50) DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: admins
DROP TABLE IF EXISTS `admins`;

CREATE TABLE
  `admins` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `photo` varchar(255) DEFAULT NULL,
    `is_verified` tinyint (1) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: blogs
DROP TABLE IF EXISTS `blogs`;

CREATE TABLE
  `blogs` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(200) NOT NULL,
    `slug` varchar(150) NOT NULL,
    `content` text NOT NULL,
    `thumbnail_url` varchar(255) DEFAULT NULL,
    `author` varchar(100) DEFAULT NULL,
    `tags` varchar(255) DEFAULT NULL,
    `status` enum ('published', 'draft') DEFAULT 'draft',
    `published_at` datetime DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: cart_items
DROP TABLE IF EXISTS `cart_items`;

CREATE TABLE
  `cart_items` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `product_id` int (11) NOT NULL,
    `quantity` int (11) NOT NULL DEFAULT 1,
    `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `product_option_id` int (11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 24 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: categories
DROP TABLE IF EXISTS `categories`;

CREATE TABLE
  `categories` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `slug` varchar(100) NOT NULL,
    `description` text DEFAULT NULL,
    `image_url` varchar(255) DEFAULT NULL,
    `status` enum ('active', 'inactive') DEFAULT 'active',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 22 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: chatbot_questions
DROP TABLE IF EXISTS `chatbot_questions`;

CREATE TABLE
  `chatbot_questions` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `parent_id` int (11) DEFAULT NULL,
    `question` varchar(500) NOT NULL,
    `answer` text NOT NULL,
    `order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `parent_id` (`parent_id`),
    CONSTRAINT `chatbot_questions_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `chatbot_questions` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: client_diary_images
DROP TABLE IF EXISTS `client_diary_images`;

CREATE TABLE
  `client_diary_images` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `image_url` varchar(255) NOT NULL,
    `alt_text` varchar(255) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: contact_us
DROP TABLE IF EXISTS `contact_us`;

CREATE TABLE
  `contact_us` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `phone` varchar(15) NOT NULL,
    `subject` varchar(255) NOT NULL,
    `message` text NOT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: craftsmanship_quality
DROP TABLE IF EXISTS `craftsmanship_quality`;

CREATE TABLE
  `craftsmanship_quality` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `heading_title` varchar(255) DEFAULT NULL,
    `subheading` text DEFAULT NULL,
    `card1_icon_url` text DEFAULT NULL,
    `card1_title` varchar(100) DEFAULT NULL,
    `card1_description` text DEFAULT NULL,
    `card2_icon_url` text DEFAULT NULL,
    `card2_title` varchar(100) DEFAULT NULL,
    `card2_description` text DEFAULT NULL,
    `card3_icon_url` text DEFAULT NULL,
    `card3_title` varchar(100) DEFAULT NULL,
    `card3_description` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: custom_jewelry_requests
DROP TABLE IF EXISTS `custom_jewelry_requests`;

CREATE TABLE
  `custom_jewelry_requests` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) DEFAULT NULL,
    `jewelry_type` varchar(100) NOT NULL,
    `metal_type` varchar(50) NOT NULL,
    `weight` decimal(10, 2) NOT NULL,
    `design_description` text NOT NULL,
    `budget` decimal(12, 2) NOT NULL,
    `delivery_date` date DEFAULT NULL,
    `contact_number` varchar(20) NOT NULL,
    `email` varchar(100) NOT NULL,
    `address` text DEFAULT NULL,
    `special_requirements` text DEFAULT NULL,
    `reference_images` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      `status` enum (
        'pending',
        'approved',
        'in_progress',
        'completed',
        'rejected'
      ) DEFAULT 'pending',
      `admin_notes` text DEFAULT NULL,
      `estimated_price` decimal(12, 2) DEFAULT NULL,
      `estimated_delivery_date` date DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `idx_custom_jewelry_user_id` (`user_id`),
      KEY `idx_custom_jewelry_status` (`status`),
      KEY `idx_custom_jewelry_created_at` (`created_at`),
      KEY `idx_custom_jewelry_email` (`email`),
      CONSTRAINT `custom_jewelry_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: digital_gold_transactions
DROP TABLE IF EXISTS `digital_gold_transactions`;

CREATE TABLE
  `digital_gold_transactions` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `transaction_type` enum ('buy', 'sell') NOT NULL,
    `gold_grams` decimal(10, 4) NOT NULL,
    `rate_per_gram` decimal(10, 2) NOT NULL,
    `total_amount` decimal(12, 2) NOT NULL,
    `metal_type` varchar(50) DEFAULT 'Gold',
    `metal_purity` varchar(20) DEFAULT '24K',
    `making_charges` decimal(10, 2) DEFAULT 0.00,
    `transaction_status` enum (
      'pending',
      'confirmed',
      'processing',
      'success',
      'failed',
      'cancelled'
    ) DEFAULT 'pending',
    `payment_method` enum ('online', 'upi', 'wallet', 'bank_transfer') DEFAULT 'online',
    `payment_id` varchar(255) DEFAULT NULL,
    `transaction_reference` varchar(100) DEFAULT NULL,
    `admin_notes` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `transaction_reference` (`transaction_reference`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `digital_gold_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: digital_gold_users
DROP TABLE IF EXISTS `digital_gold_users`;

CREATE TABLE
  `digital_gold_users` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `total_gold_grams` decimal(10, 4) DEFAULT 0.0000,
    `total_investment` decimal(12, 2) DEFAULT 0.00,
    `total_profit_loss` decimal(12, 2) DEFAULT 0.00,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `digital_gold_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: elite_members
DROP TABLE IF EXISTS `elite_members`;

CREATE TABLE
  `elite_members` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `email` varchar(150) NOT NULL,
    `gender` enum ('Male', 'Female', 'Other') DEFAULT NULL,
    `subscribed_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 11 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: email_automation_logs
DROP TABLE IF EXISTS `email_automation_logs`;

CREATE TABLE
  `email_automation_logs` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `campaign_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `user_email` varchar(255) NOT NULL,
    `email_sent` tinyint (1) DEFAULT 0,
    `sent_at` timestamp NULL DEFAULT NULL,
    `opened` tinyint (1) DEFAULT 0,
    `opened_at` timestamp NULL DEFAULT NULL,
    `clicked` tinyint (1) DEFAULT 0,
    `clicked_at` timestamp NULL DEFAULT NULL,
    `error_message` text DEFAULT NULL,
    `status` enum ('Pending', 'Sent', 'Failed', 'Opened', 'Clicked') DEFAULT 'Pending',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `campaign_id` (`campaign_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `email_automation_logs_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `email_campaigns` (`id`) ON DELETE CASCADE,
    CONSTRAINT `email_automation_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 56 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: email_automation_settings
DROP TABLE IF EXISTS `email_automation_settings`;

CREATE TABLE
  `email_automation_settings` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `setting_key` varchar(100) NOT NULL,
    `setting_value` text DEFAULT NULL,
    `description` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `setting_key` (`setting_key`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: email_campaigns
DROP TABLE IF EXISTS `email_campaigns`;

CREATE TABLE
  `email_campaigns` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `type` enum (
      'Transactional',
      'Promotional',
      'Abandoned Cart',
      'Welcome Series',
      'Order Confirmation',
      'Product Launch'
    ) NOT NULL,
    `subject` varchar(255) NOT NULL,
    `template_id` int (11) DEFAULT NULL,
    `audience_type` enum (
      'All Users',
      'New Signups',
      'Active Users',
      'Cart Abandoners',
      'Recent Purchasers',
      'Specific Segment'
    ) NOT NULL,
    `status` enum ('Active', 'Paused', 'Draft') DEFAULT 'Draft',
    `trigger_type` enum ('Immediate', 'Scheduled', 'Event-based') NOT NULL,
    `trigger_event` varchar(100) DEFAULT NULL,
    `delay_minutes` int (11) DEFAULT 0,
    `conditions` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: email_subscribers
DROP TABLE IF EXISTS `email_subscribers`;

CREATE TABLE
  `email_subscribers` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) DEFAULT NULL,
    `email` varchar(255) NOT NULL,
    `name` varchar(255) DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `subscription_date` timestamp NOT NULL DEFAULT current_timestamp(),
    `unsubscription_date` timestamp NULL DEFAULT NULL,
    `preferences` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      PRIMARY KEY (`id`),
      UNIQUE KEY `email` (`email`),
      KEY `user_id` (`user_id`),
      CONSTRAINT `email_subscribers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB AUTO_INCREMENT = 11 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: email_templates
DROP TABLE IF EXISTS `email_templates`;

CREATE TABLE
  `email_templates` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `subject` varchar(255) NOT NULL,
    `html_content` longtext NOT NULL,
    `text_content` text DEFAULT NULL,
    `variables` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      `category` enum (
        'Welcome',
        'Abandoned Cart',
        'Order Confirmation',
        'Promotional',
        'Product Launch',
        'General'
      ) NOT NULL,
      `is_active` tinyint (1) DEFAULT 1,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: facebook_pixel_config
DROP TABLE IF EXISTS `facebook_pixel_config`;

CREATE TABLE
  `facebook_pixel_config` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `pixel_id` varchar(100) NOT NULL,
    `access_token` varchar(255) DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `tracking_status` enum ('active', 'paused', 'disabled') DEFAULT 'active',
    `event_tracking` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      `created_by` int (11) DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `created_by` (`created_by`),
      CONSTRAINT `facebook_pixel_config_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: featured_categories
DROP TABLE IF EXISTS `featured_categories`;

CREATE TABLE
  `featured_categories` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) DEFAULT NULL,
    `alt_text` varchar(255) DEFAULT NULL,
    `image_url` varchar(255) NOT NULL,
    `category_id` int (11) DEFAULT NULL,
    `position` int (11) DEFAULT 1,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `category_id` (`category_id`),
    CONSTRAINT `featured_categories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB AUTO_INCREMENT = 10 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: gallery
DROP TABLE IF EXISTS `gallery`;

CREATE TABLE
  `gallery` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `category_id` int (11) NOT NULL,
    `device_type` enum ('desktop', 'mobile') NOT NULL DEFAULT 'desktop',
    `image_url` varchar(500) NOT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `position` int (11) NOT NULL DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_position_device` (`position`, `device_type`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_is_active` (`is_active`),
    KEY `idx_position` (`position`),
    CONSTRAINT `gallery_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: gemstone_catalog
DROP TABLE IF EXISTS `gemstone_catalog`;

CREATE TABLE
  `gemstone_catalog` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `type` enum ('diamond', 'stone') NOT NULL,
    `description` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 50 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: gemstones
DROP TABLE IF EXISTS `gemstones`;

CREATE TABLE
  `gemstones` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `type` enum (
      'diamond',
      'ruby',
      'emerald',
      'sapphire',
      'pearl',
      'other'
    ) NOT NULL,
    `description` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: general_enquiry
DROP TABLE IF EXISTS `general_enquiry`;

CREATE TABLE
  `general_enquiry` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `heading` varchar(100) DEFAULT 'GENERAL_ENQUIRY',
    `question` text NOT NULL,
    `answer` text DEFAULT NULL,
    `status` enum ('expanded', 'collapsed') DEFAULT 'collapsed',
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: goldmine_early_redemption
DROP TABLE IF EXISTS `goldmine_early_redemption`;

CREATE TABLE
  `goldmine_early_redemption` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `subscription_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `redemption_month` int (11) NOT NULL,
    `redemption_amount` decimal(10, 2) NOT NULL,
    `is_available` tinyint (1) DEFAULT 1,
    `redeemed_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `subscription_id` (`subscription_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `goldmine_early_redemption_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `goldmine_subscriptions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `goldmine_early_redemption_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: goldmine_monthly_payments
DROP TABLE IF EXISTS `goldmine_monthly_payments`;

CREATE TABLE
  `goldmine_monthly_payments` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `subscription_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `month_number` int (11) NOT NULL,
    `amount` decimal(10, 2) NOT NULL,
    `payment_status` enum ('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    `razorpay_payment_id` varchar(100) DEFAULT NULL,
    `payment_date` date DEFAULT NULL,
    `due_date` date NOT NULL,
    `is_discount_month` tinyint (1) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `idx_goldmine_monthly_payments_subscription_id` (`subscription_id`),
    KEY `idx_goldmine_monthly_payments_status` (`payment_status`),
    KEY `idx_goldmine_monthly_payments_due_date` (`due_date`),
    CONSTRAINT `goldmine_monthly_payments_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `goldmine_subscriptions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `goldmine_monthly_payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: goldmine_nominee_details
DROP TABLE IF EXISTS `goldmine_nominee_details`;

CREATE TABLE
  `goldmine_nominee_details` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `subscription_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `nominee_full_name` varchar(100) NOT NULL,
    `relationship` enum (
      'Father',
      'Mother',
      'Son',
      'Daughter',
      'Spouse',
      'Brother',
      'Sister',
      'Other'
    ) NOT NULL,
    `nationality` varchar(50) NOT NULL DEFAULT 'Indian',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `subscription_id` (`subscription_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `goldmine_nominee_details_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `goldmine_subscriptions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `goldmine_nominee_details_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: goldmine_payment_details
DROP TABLE IF EXISTS `goldmine_payment_details`;

CREATE TABLE
  `goldmine_payment_details` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `subscription_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `payment_method` enum ('cards', 'net_banking', 'upi') NOT NULL,
    `razorpay_subscription_id` varchar(100) DEFAULT NULL,
    `razorpay_customer_id` varchar(100) DEFAULT NULL,
    `auto_debit_enabled` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `subscription_id` (`subscription_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `goldmine_payment_details_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `goldmine_subscriptions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `goldmine_payment_details_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: goldmine_personal_details
DROP TABLE IF EXISTS `goldmine_personal_details`;

CREATE TABLE
  `goldmine_personal_details` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `subscription_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `full_name` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `mobile_number` varchar(20) NOT NULL,
    `apartment_house_flat` varchar(255) NOT NULL,
    `pincode` varchar(10) NOT NULL,
    `locality_town` varchar(100) NOT NULL,
    `street_colony_area` varchar(255) NOT NULL,
    `city_district` varchar(100) NOT NULL,
    `landmark` varchar(255) DEFAULT NULL,
    `state` varchar(100) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `subscription_id` (`subscription_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `goldmine_personal_details_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `goldmine_subscriptions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `goldmine_personal_details_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: goldmine_subscription_history
DROP TABLE IF EXISTS `goldmine_subscription_history`;

CREATE TABLE
  `goldmine_subscription_history` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `subscription_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `status` enum (
      'created',
      'personal_details_added',
      'nominee_details_added',
      'payment_completed',
      'active',
      'paused',
      'cancelled',
      'completed'
    ) NOT NULL,
    `description` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `subscription_id` (`subscription_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `goldmine_subscription_history_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `goldmine_subscriptions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `goldmine_subscription_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: goldmine_subscriptions
DROP TABLE IF EXISTS `goldmine_subscriptions`;

CREATE TABLE
  `goldmine_subscriptions` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `subscription_number` varchar(50) NOT NULL,
    `monthly_amount` decimal(10, 2) NOT NULL,
    `total_amount` decimal(10, 2) NOT NULL,
    `discount_amount` decimal(10, 2) NOT NULL,
    `final_jewellery_value` decimal(10, 2) NOT NULL,
    `status` enum ('active', 'paused', 'cancelled', 'completed') DEFAULT 'active',
    `start_date` date NOT NULL,
    `end_date` date NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `subscription_number` (`subscription_number`),
    KEY `idx_goldmine_subscriptions_user_id` (`user_id`),
    KEY `idx_goldmine_subscriptions_status` (`status`),
    CONSTRAINT `goldmine_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: home_banners
DROP TABLE IF EXISTS `home_banners`;

CREATE TABLE
  `home_banners` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) DEFAULT NULL,
    `alt_text` varchar(255) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `image_url` varchar(255) NOT NULL,
    `position` int (11) DEFAULT 1,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `device_type` enum ('desktop', 'mobile') NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_position_per_device` (`position`, `device_type`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: insta_images
DROP TABLE IF EXISTS `insta_images`;

CREATE TABLE
  `insta_images` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `alt_text` varchar(255) DEFAULT NULL,
    `image_url` varchar(255) NOT NULL,
    `link` varchar(255) DEFAULT NULL,
    `position` int (11) DEFAULT 1,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 7 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: journey_timeline
DROP TABLE IF EXISTS `journey_timeline`;

CREATE TABLE
  `journey_timeline` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `heading_title` varchar(100) DEFAULT NULL,
    `year` varchar(10) NOT NULL,
    `description` text DEFAULT NULL,
    `image_url` text DEFAULT NULL,
    `sort_order` int (11) DEFAULT 0,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: labour_details
DROP TABLE IF EXISTS `labour_details`;

CREATE TABLE
  `labour_details` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `labour_flat` decimal(10, 2) DEFAULT 0.00,
    `labour_percent` decimal(5, 2) DEFAULT 0.00,
    `labour_weight` decimal(10, 5) DEFAULT 0.00000,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`),
    CONSTRAINT `labour_details_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: maintenance
DROP TABLE IF EXISTS `maintenance`;

CREATE TABLE
  `maintenance` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `heading` varchar(100) DEFAULT 'MAINTENANCE',
    `question` text NOT NULL,
    `answer` text DEFAULT NULL,
    `status` enum ('expanded', 'collapsed') DEFAULT 'collapsed',
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: metal_purities
DROP TABLE IF EXISTS `metal_purities`;

CREATE TABLE
  `metal_purities` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `metal_type_id` int (11) NOT NULL,
    `purity_name` varchar(50) NOT NULL,
    `purity_value` decimal(5, 2) NOT NULL,
    `tunch_value` decimal(5, 2) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `metal_type_id` (`metal_type_id`),
    CONSTRAINT `metal_purities_ibfk_1` FOREIGN KEY (`metal_type_id`) REFERENCES `metal_types` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: metal_rates
DROP TABLE IF EXISTS `metal_rates`;

CREATE TABLE
  `metal_rates` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `metal_type_id` int (11) NOT NULL,
    `purity_id` int (11) NOT NULL,
    `rate_per_gram` decimal(10, 2) NOT NULL,
    `rate_per_10g` decimal(10, 2) NOT NULL,
    `source` enum ('manual', 'api') DEFAULT 'manual',
    `updated_by` varchar(100) NOT NULL,
    `is_live` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `metal_type_id` (`metal_type_id`),
    KEY `purity_id` (`purity_id`),
    CONSTRAINT `metal_rates_ibfk_1` FOREIGN KEY (`metal_type_id`) REFERENCES `metal_types` (`id`) ON DELETE CASCADE,
    CONSTRAINT `metal_rates_ibfk_2` FOREIGN KEY (`purity_id`) REFERENCES `metal_purities` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 38 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: metal_rates_history
DROP TABLE IF EXISTS `metal_rates_history`;

CREATE TABLE
  `metal_rates_history` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `metal_type_id` int (11) NOT NULL,
    `purity_id` int (11) NOT NULL,
    `old_rate_per_gram` decimal(10, 2) DEFAULT NULL,
    `new_rate_per_gram` decimal(10, 2) NOT NULL,
    `old_rate_per_10g` decimal(10, 2) DEFAULT NULL,
    `new_rate_per_10g` decimal(10, 2) NOT NULL,
    `change_percentage` decimal(5, 2) DEFAULT NULL,
    `source` enum ('manual', 'api') DEFAULT 'manual',
    `updated_by` varchar(100) NOT NULL,
    `change_reason` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `metal_type_id` (`metal_type_id`),
    KEY `purity_id` (`purity_id`),
    CONSTRAINT `metal_rates_history_ibfk_1` FOREIGN KEY (`metal_type_id`) REFERENCES `metal_types` (`id`) ON DELETE CASCADE,
    CONSTRAINT `metal_rates_history_ibfk_2` FOREIGN KEY (`purity_id`) REFERENCES `metal_purities` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 42 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: metal_types
DROP TABLE IF EXISTS `metal_types`;

CREATE TABLE
  `metal_types` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `symbol` varchar(10) NOT NULL,
    `description` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 11 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: metal_predictions
DROP TABLE IF EXISTS `metal_predictions`;

CREATE TABLE
  `metal_predictions` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `metal_type` enum ('Gold', 'Silver') NOT NULL,
    `current_price` decimal(10, 2) NOT NULL,
    `predicted_price` decimal(10, 2) NOT NULL,
    `price_change` decimal(5, 2) DEFAULT 0.00,
    `market_confidence` int (11) DEFAULT 65,
    `forecast_period` varchar(100) DEFAULT '24 hours',
    `market_analysis` text DEFAULT NULL,
    `recommend_buy` TEXT NULL DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_metal_type` (`metal_type`),
    KEY `idx_is_active` (`is_active`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: mission_vision_section
DROP TABLE IF EXISTS `mission_vision_section`;

CREATE TABLE
  `mission_vision_section` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `type` enum ('mission', 'vision') NOT NULL,
    `title` varchar(100) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `icon_url` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: notifications
DROP TABLE IF EXISTS `notifications`;

CREATE TABLE
  `notifications` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `type` enum ('info', 'success', 'warning', 'error', 'system') DEFAULT 'info',
    `message` text NOT NULL,
    `is_read` tinyint (1) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: offer_carousel
DROP TABLE IF EXISTS `offer_carousel`;

CREATE TABLE
  `offer_carousel` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `image_url` varchar(500) NOT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_is_active` (`is_active`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: offers
DROP TABLE IF EXISTS `offers`;

CREATE TABLE
  `offers` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `code` varchar(50) NOT NULL,
    `title` varchar(100) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `discount_type` enum ('percentage', 'fixed') DEFAULT 'percentage',
    `discount_value` decimal(10, 2) NOT NULL,
    `start_date` date DEFAULT NULL,
    `end_date` date DEFAULT NULL,
    `minimum_order_amount` decimal(10, 2) DEFAULT NULL,
    `max_discount_amount` decimal(10, 2) DEFAULT NULL,
    `show_on_frontend` tinyint (1) DEFAULT 1,
    `send_in_email` tinyint (1) DEFAULT 0,
    `is_hidden` tinyint (1) DEFAULT 0,
    `status` enum ('active', 'inactive') DEFAULT 'active',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `code` (`code`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: order_items
DROP TABLE IF EXISTS `order_items`;

CREATE TABLE
  `order_items` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `order_id` int (11) NOT NULL,
    `product_id` int (11) NOT NULL,
    `product_option_id` int (11) DEFAULT NULL,
    `quantity` int (11) NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    `item_name` varchar(255) DEFAULT NULL,
    `rate` decimal(10, 2) DEFAULT 0.00,
    `labour` decimal(10, 2) DEFAULT 0.00,
    `labour_on` varchar(50) DEFAULT 'Wt',
    `less_weight_item_name` varchar(255) DEFAULT NULL,
    `less_weight_weight` decimal(10, 3) DEFAULT 0.000,
    `less_weight_sale_value` decimal(10, 2) DEFAULT 0.00,
    `discount` decimal(5, 2) DEFAULT 0.00,
    `tunch` decimal(5, 2) DEFAULT 100.00,
    `additional_weight` decimal(10, 3) DEFAULT 0.000,
    `wastage_percentage` decimal(5, 2) DEFAULT 0.00,
    `diamond_weight` decimal(10, 3) DEFAULT 0.000,
    `stone_weight` decimal(10, 3) DEFAULT 0.000,
    `other` decimal(10, 2) DEFAULT 0.00,
    `size` varchar(100) DEFAULT NULL,
    `weight` varchar(100) DEFAULT NULL,
    `metal_type` varchar(100) DEFAULT NULL,
    `custom_price` decimal(10, 2) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `order_id` (`order_id`),
    KEY `product_id` (`product_id`),
    KEY `product_option_id` (`product_option_id`),
    CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`product_option_id`) REFERENCES `product_options` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB AUTO_INCREMENT = 23 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: orders
DROP TABLE IF EXISTS `orders`;

CREATE TABLE
  `orders` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `order_number` varchar(100) NOT NULL,
    `total_amount` decimal(10, 2) NOT NULL,
    `payment_status` enum ('pending', 'paid', 'failed') DEFAULT 'pending',
    `order_status` enum ('processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'processing',
    `payment_method` enum ('cod', 'online', 'upi', 'wallet') DEFAULT 'cod',
    `payment_id` varchar(100) DEFAULT NULL,
    `shipping_city` varchar(100) NOT NULL,
    `shipping_state` varchar(100) NOT NULL,
    `shipping_country` varchar(100) NOT NULL,
    `shipping_postal_code` varchar(20) NOT NULL,
    `shipping_address` text NOT NULL,
    `cod_charge` decimal(10, 2) DEFAULT 0.00,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `order_number` (`order_number`),
    UNIQUE KEY `payment_id` (`payment_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 27 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: placing_an_order
DROP TABLE IF EXISTS `placing_an_order`;

CREATE TABLE
  `placing_an_order` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `heading` varchar(100) DEFAULT 'PLACING_AN_ORDER',
    `question` text NOT NULL,
    `answer` text DEFAULT NULL,
    `status` enum ('expanded', 'collapsed') DEFAULT 'collapsed',
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: privacy_policy
DROP TABLE IF EXISTS `privacy_policy`;

CREATE TABLE
  `privacy_policy` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `section_number` varchar(10) DEFAULT NULL,
    `section_title` varchar(255) DEFAULT NULL,
    `content` text DEFAULT NULL,
    `parent_section_number` varchar(10) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: privacy_policy_header
DROP TABLE IF EXISTS `privacy_policy_header`;

CREATE TABLE
  `privacy_policy_header` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `page_title` varchar(255) NOT NULL,
    `last_updated` date DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_banner
DROP TABLE IF EXISTS `product_banner`;

CREATE TABLE
  `product_banner` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `subtitle` text DEFAULT NULL,
    `background_image` varchar(255) DEFAULT NULL,
    `device_type` enum ('desktop', 'mobile') NOT NULL DEFAULT 'desktop',
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_device_type` (`device_type`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_category_map
DROP TABLE IF EXISTS `product_category_map`;

CREATE TABLE
  `product_category_map` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `category_id` int (11) DEFAULT NULL,
    `subcategory_id` int (11) DEFAULT NULL,
    `sub_subcategory_id` int (11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `product_id` (`product_id`),
    KEY `category_id` (`category_id`),
    KEY `subcategory_id` (`subcategory_id`),
    KEY `sub_subcategory_id` (`sub_subcategory_id`),
    CONSTRAINT `product_category_map_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    CONSTRAINT `product_category_map_ibfk_10` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_11` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_12` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_13` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_14` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_3` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_4` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_5` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_6` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_7` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_8` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `product_category_map_ibfk_9` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB AUTO_INCREMENT = 36 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_certificate_files
DROP TABLE IF EXISTS `product_certificate_files`;

CREATE TABLE
  `product_certificate_files` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `certificate_id` int (11) NOT NULL,
    `file_url` varchar(255) NOT NULL,
    `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `certificate_id` (`certificate_id`),
    CONSTRAINT `product_certificate_files_ibfk_1` FOREIGN KEY (`certificate_id`) REFERENCES `product_certificates` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_certificates
DROP TABLE IF EXISTS `product_certificates`;

CREATE TABLE
  `product_certificates` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `certificate_url` varchar(500) NOT NULL,
    `certificate_name` varchar(255) DEFAULT NULL,
    `certificate_type` varchar(255) DEFAULT NULL,
    `issue_date` date DEFAULT NULL,
    `expiry_date` date DEFAULT NULL,
    `original_name` varchar(255) DEFAULT NULL,
    `file_size` int (11) DEFAULT NULL,
    `mime_type` varchar(100) DEFAULT NULL,
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_sort_order` (`sort_order`),
    CONSTRAINT `product_certificates_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_features
DROP TABLE IF EXISTS `product_features`;

CREATE TABLE
  `product_features` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `feature_points` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 1102 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_images
DROP TABLE IF EXISTS `product_images`;

CREATE TABLE
  `product_images` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `image_name` varchar(255) DEFAULT NULL,
    `original_name` varchar(255) DEFAULT NULL,
    `image_url` varchar(255) NOT NULL,
    `thumbnail_url` varchar(255) DEFAULT NULL,
    `alt_text` varchar(150) DEFAULT NULL,
    `file_size` int (11) DEFAULT NULL,
    `mime_type` varchar(100) DEFAULT NULL,
    `dimensions` varchar(50) DEFAULT NULL,
    `is_thumbnail` tinyint (1) DEFAULT 0,
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 89 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_less_weight
DROP TABLE IF EXISTS `product_less_weight`;

CREATE TABLE
  `product_less_weight` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `item` varchar(255) DEFAULT NULL,
    `stamp` varchar(100) DEFAULT NULL,
    `clarity` varchar(100) DEFAULT NULL,
    `color` varchar(100) DEFAULT NULL,
    `cuts` varchar(100) DEFAULT NULL,
    `shapes` varchar(100) DEFAULT NULL,
    `remarks` text DEFAULT NULL,
    `pieces` int (11) DEFAULT 1,
    `weight` decimal(10, 3) DEFAULT 0.000,
    `units` varchar(50) DEFAULT 'carat',
    `tunch` decimal(5, 2) DEFAULT 0.00,
    `purchase_rate` decimal(10, 2) DEFAULT 0.00,
    `sale_rate` decimal(10, 2) DEFAULT 0.00,
    `total_profit` decimal(10, 2) DEFAULT 0.00,
    `purchase_value` decimal(10, 2) DEFAULT 0.00,
    `sale_value` decimal(10, 2) DEFAULT 0.00,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `product_less_weight_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 421 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_options
DROP TABLE IF EXISTS `product_options`;

CREATE TABLE
  `product_options` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `size` varchar(100) DEFAULT NULL,
    `weight` varchar(100) DEFAULT NULL,
    `metal_color` varchar(100) DEFAULT NULL,
    `value` decimal(10, 2) DEFAULT 0.00,
    `sell_price` decimal(10, 2) DEFAULT 0.00,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `dimensions` varchar(100) DEFAULT NULL,
    `gender` varchar(50) DEFAULT NULL,
    `occasion` varchar(100) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `product_options_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 432 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_reviews
DROP TABLE IF EXISTS `product_reviews`;

CREATE TABLE
  `product_reviews` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `user_id` int (11) NOT NULL,
    `rating` int (11) DEFAULT NULL,
    `review_text` text DEFAULT NULL,
    `admin_message` text DEFAULT NULL,
    `is_flagged` tinyint (1) DEFAULT 0,
    `status` enum ('pending', 'published', 'rejected') DEFAULT 'published',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `product_id` (`product_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
    CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_reviews_images
DROP TABLE IF EXISTS `product_reviews_images`;

CREATE TABLE
  `product_reviews_images` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `review_id` int (11) NOT NULL,
    `image_url` varchar(255) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `review_id` (`review_id`),
    CONSTRAINT `product_reviews_images_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_sections
DROP TABLE IF EXISTS `product_sections`;

CREATE TABLE
  `product_sections` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `section_name` enum (
      'latest_luxury',
      'similar_products',
      'you_may_also_like',
      'signature_pieces'
    ) NOT NULL,
    `sort_order` int (11) DEFAULT 0,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_product_section` (`product_id`, `section_name`),
    CONSTRAINT `product_sections_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 18 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_stones
DROP TABLE IF EXISTS `product_stones`;

CREATE TABLE
  `product_stones` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `stone_type` varchar(100) NOT NULL,
    `stone_name` varchar(100) NOT NULL,
    `stone_weight` decimal(8, 3) DEFAULT 0.000,
    `stone_count` int (11) DEFAULT 1,
    `stone_quality` varchar(100) DEFAULT NULL,
    `stone_color` varchar(100) DEFAULT NULL,
    `stone_clarity` varchar(100) DEFAULT NULL,
    `stone_cut` varchar(100) DEFAULT NULL,
    `stone_value` decimal(10, 2) DEFAULT 0.00,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_product_stones_product_id` (`product_id`),
    CONSTRAINT `product_stones_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_videos
DROP TABLE IF EXISTS `product_videos`;

CREATE TABLE
  `product_videos` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `video_url` varchar(500) NOT NULL,
    `video_name` varchar(255) DEFAULT NULL,
    `original_name` varchar(255) DEFAULT NULL,
    `file_size` int (11) DEFAULT NULL,
    `mime_type` varchar(100) DEFAULT NULL,
    `duration` int (11) DEFAULT NULL,
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `product_videos_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: product_weight_details
DROP TABLE IF EXISTS `product_weight_details`;

CREATE TABLE
  `product_weight_details` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `product_id` int (11) NOT NULL,
    `gross_weight` decimal(8, 3) DEFAULT 0.000,
    `less_weight` decimal(8, 3) DEFAULT 0.000,
    `stone_weight` decimal(8, 3) DEFAULT 0.000,
    `stone_pieces` int (11) DEFAULT 0,
    `stone_value` decimal(10, 2) DEFAULT 0.00,
    `purchase_price` decimal(10, 2) DEFAULT 0.00,
    `purchase_sell` decimal(10, 2) DEFAULT 0.00,
    `actual_sell` decimal(10, 2) DEFAULT 0.00,
    `sell_price` decimal(10, 2) DEFAULT 0.00,
    `net_weight` decimal(8, 3) DEFAULT 0.000,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_product_weight_details_product_id` (`product_id`),
    CONSTRAINT `product_weight_details_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: products
DROP TABLE IF EXISTS `products`;

CREATE TABLE
  `products` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `sku` varchar(100) NOT NULL,
    `slug` varchar(255) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `discount` decimal(5, 2) DEFAULT 0.00,
    `status` enum ('active', 'inactive') DEFAULT 'active',
    `tag_number` varchar(100) DEFAULT NULL,
    `batch` varchar(100) DEFAULT NULL,
    `item_name` varchar(255) DEFAULT NULL,
    `stamp` varchar(100) DEFAULT NULL,
    `remark` varchar(255) DEFAULT NULL,
    `unit` varchar(50) DEFAULT 'Gm',
    `pieces` int (11) DEFAULT 1,
    `gross_weight` decimal(10, 3) DEFAULT 0.000,
    `less_weight` decimal(10, 3) DEFAULT 0.000,
    `net_weight` decimal(10, 3) DEFAULT 0.000,
    `additional_weight` decimal(10, 3) DEFAULT 0.000,
    `tunch` decimal(5, 2) DEFAULT 100.00,
    `wastage_percentage` decimal(5, 2) DEFAULT 0.00,
    `rate` decimal(10, 2) DEFAULT 0.00,
    `diamond_weight` decimal(10, 3) DEFAULT 0.000,
    `stone_weight` decimal(10, 3) DEFAULT 0.000,
    `labour` decimal(10, 2) DEFAULT 0.00,
    `labour_on` varchar(50) DEFAULT 'Wt',
    `other` decimal(10, 2) DEFAULT 0.00,
    `total_fine_weight` decimal(10, 3) DEFAULT 0.000,
    `total_rs` decimal(10, 2) DEFAULT 0.00,
    `design_type` varchar(100) DEFAULT NULL,
    `manufacturing` varchar(100) DEFAULT NULL,
    `customizable` tinyint (1) DEFAULT 0,
    `engraving` tinyint (1) DEFAULT 0,
    `hallmark` tinyint (1) DEFAULT 0,
    `certificate_number` varchar(100) DEFAULT NULL,
    `category_id` int (11) DEFAULT NULL,
    `subcategory_id` int (11) DEFAULT NULL,
    `sub_subcategory_id` int (11) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `metal_id` int (11) DEFAULT NULL,
    `metal_purity_id` int (11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `sku` (`sku`),
    UNIQUE KEY `slug` (`slug`),
    UNIQUE KEY `uk_products_item_name` (`item_name`),
    KEY `category_id` (`category_id`),
    KEY `subcategory_id` (`subcategory_id`),
    KEY `sub_subcategory_id` (`sub_subcategory_id`),
    KEY `fk_products_metal_id` (`metal_id`),
    KEY `fk_products_metal_purity_id` (`metal_purity_id`),
    CONSTRAINT `fk_products_metal_id` FOREIGN KEY (`metal_id`) REFERENCES `metal_types` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_products_metal_purity_id` FOREIGN KEY (`metal_purity_id`) REFERENCES `metal_purities` (`id`) ON DELETE SET NULL,
    CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `products_ibfk_2` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `products_ibfk_3` FOREIGN KEY (`sub_subcategory_id`) REFERENCES `sub_subcategories` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB AUTO_INCREMENT = 439 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: promo_banner
DROP TABLE IF EXISTS `promo_banner`;

CREATE TABLE
  `promo_banner` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `alt_text` varchar(255) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `image_url` varchar(255) NOT NULL,
    `position` int (11) DEFAULT 1,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: return_cancellation_header
DROP TABLE IF EXISTS `return_cancellation_header`;

CREATE TABLE
  `return_cancellation_header` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `page_title` varchar(255) NOT NULL,
    `last_updated` date DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: return_cancellation_policy
DROP TABLE IF EXISTS `return_cancellation_policy`;

CREATE TABLE
  `return_cancellation_policy` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `section_number` varchar(10) DEFAULT NULL,
    `section_title` varchar(255) DEFAULT NULL,
    `content` text DEFAULT NULL,
    `parent_section_number` varchar(10) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: second_feature_cat
DROP TABLE IF EXISTS `second_feature_cat`;

CREATE TABLE
  `second_feature_cat` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `alt_text` varchar(255) DEFAULT NULL,
    `image_url` varchar(255) NOT NULL,
    `category_id` int (11) DEFAULT NULL,
    `subcategory_id` int (11) DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `title` (`title`),
    KEY `category_id` (`category_id`),
    KEY `subcategory_id` (`subcategory_id`),
    CONSTRAINT `second_feature_cat_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
    CONSTRAINT `second_feature_cat_ibfk_2` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: shipping
DROP TABLE IF EXISTS `shipping`;

CREATE TABLE
  `shipping` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `heading` varchar(100) DEFAULT 'SHIPPING',
    `question` text NOT NULL,
    `answer` text DEFAULT NULL,
    `status` enum ('expanded', 'collapsed') DEFAULT 'collapsed',
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: shipping_policy
DROP TABLE IF EXISTS `shipping_policy`;

CREATE TABLE
  `shipping_policy` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `section_number` varchar(10) DEFAULT NULL,
    `section_title` varchar(255) DEFAULT NULL,
    `content` text DEFAULT NULL,
    `parent_section_number` varchar(10) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: shipping_policy_header
DROP TABLE IF EXISTS `shipping_policy_header`;

CREATE TABLE
  `shipping_policy_header` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `page_title` varchar(255) NOT NULL,
    `last_updated` date DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: shop_banners
DROP TABLE IF EXISTS `shop_banners`;

CREATE TABLE
  `shop_banners` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `first_banner_image` varchar(255) DEFAULT NULL,
    `first_banner_alt` varchar(255) DEFAULT NULL,
    `second_banner_image` varchar(255) DEFAULT NULL,
    `second_banner_alt` varchar(255) DEFAULT NULL,
    `third_banner_image` varchar(255) DEFAULT NULL,
    `third_banner_alt` varchar(255) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: social_links
DROP TABLE IF EXISTS `social_links`;

CREATE TABLE
  `social_links` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `platform` varchar(255) DEFAULT NULL,
    `link` varchar(255) DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `click` int (11) DEFAULT 0,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: social_logins
DROP TABLE IF EXISTS `social_logins`;

CREATE TABLE
  `social_logins` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) DEFAULT NULL,
    `provider` enum ('google', 'facebook') DEFAULT NULL,
    `provider_id` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `social_logins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: sub_subcategories
DROP TABLE IF EXISTS `sub_subcategories`;

CREATE TABLE
  `sub_subcategories` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `subcategory_id` int (11) NOT NULL,
    `name` varchar(100) NOT NULL,
    `slug` varchar(100) NOT NULL,
    `description` text DEFAULT NULL,
    `image_url` varchar(255) DEFAULT NULL,
    `status` enum ('active', 'inactive') DEFAULT 'active',
    `sort_order` int (11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`),
    KEY `idx_sub_subcategories_subcategory_id` (`subcategory_id`),
    CONSTRAINT `sub_subcategories_ibfk_1` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 130 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: subcategories
DROP TABLE IF EXISTS `subcategories`;

CREATE TABLE
  `subcategories` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `category_id` int (11) NOT NULL,
    `name` varchar(100) NOT NULL,
    `slug` varchar(100) NOT NULL,
    `description` text DEFAULT NULL,
    `image_url` varchar(255) DEFAULT NULL,
    `status` enum ('active', 'inactive') DEFAULT 'active',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `slug` (`slug`),
    KEY `category_id` (`category_id`),
    CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 57 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: support_messages
DROP TABLE IF EXISTS `support_messages`;

CREATE TABLE
  `support_messages` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `sender` enum ('user', 'admin') NOT NULL,
    `message` text NOT NULL,
    `admin_message` text DEFAULT NULL,
    `is_read` tinyint (1) DEFAULT 0,
    `ticket_id` varchar(20) DEFAULT NULL,
    `subject` varchar(255) DEFAULT NULL,
    `tag` varchar(100) DEFAULT NULL,
    `assigned_to` varchar(100) DEFAULT NULL,
    `priority` enum ('High', 'Medium', 'Low') DEFAULT 'Low',
    `status` enum ('Open', 'In progress', 'Closed', 'Resolved') DEFAULT 'Open',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `support_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: terms_conditions
DROP TABLE IF EXISTS `terms_conditions`;

CREATE TABLE
  `terms_conditions` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `section_number` varchar(10) DEFAULT NULL,
    `section_title` varchar(255) DEFAULT NULL,
    `content` text DEFAULT NULL,
    `parent_section_number` varchar(10) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: terms_conditions_header
DROP TABLE IF EXISTS `terms_conditions_header`;

CREATE TABLE
  `terms_conditions_header` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `page_title` varchar(255) NOT NULL,
    `last_updated` date DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: user
DROP TABLE IF EXISTS `user`;

CREATE TABLE
  `user` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `photo` varchar(255) DEFAULT NULL,
    `dob` date DEFAULT NULL,
    `phone` varchar(20) DEFAULT NULL,
    `anniversary` date DEFAULT NULL,
    `address` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      `address_country` varchar(100) DEFAULT NULL,
      `address_state` varchar(100) DEFAULT NULL,
      `address_city` varchar(100) DEFAULT NULL,
      `address_place` text DEFAULT NULL,
      `address_pincode` varchar(10) DEFAULT NULL,
      `is_verified` tinyint (1) DEFAULT 0,
      `status` enum ('Active', 'Inactive', 'Blocked') DEFAULT 'Active',
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (`id`),
      UNIQUE KEY `email` (`email`),
      UNIQUE KEY `photo` (`photo`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: user_activity_logs
DROP TABLE IF EXISTS `user_activity_logs`;

CREATE TABLE
  `user_activity_logs` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `activity_type` enum (
      'signup',
      'login',
      'add_to_cart',
      'remove_from_cart',
      'purchase',
      'view_product',
      'abandon_cart'
    ) NOT NULL,
    `activity_data` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`),
      KEY `user_id` (`user_id`),
      CONSTRAINT `user_activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 26 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: user_coupons
DROP TABLE IF EXISTS `user_coupons`;

CREATE TABLE
  `user_coupons` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `coupon_code` varchar(100) NOT NULL,
    `discount_id` int (11) NOT NULL,
    `status` enum ('active', 'used', 'expired') DEFAULT 'active',
    `used_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `discount_id` (`discount_id`),
    CONSTRAINT `user_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_coupons_ibfk_2` FOREIGN KEY (`discount_id`) REFERENCES `offers` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: video_cart_items
DROP TABLE IF EXISTS `video_cart_items`;

CREATE TABLE
  `video_cart_items` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `product_id` int (11) NOT NULL,
    `quantity` int (11) NOT NULL DEFAULT 1,
    `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `product_option_id` int (11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `video_cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `video_cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 13 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: video_consultation_requests
DROP TABLE IF EXISTS `video_consultation_requests`;

CREATE TABLE
  `video_consultation_requests` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) DEFAULT NULL,
    `anonymous_id` varchar(100) DEFAULT NULL,
    `name` varchar(100) NOT NULL,
    `email` varchar(100) NOT NULL,
    `whatsapp_number` varchar(20) NOT NULL,
    `otp_verified` tinyint (1) DEFAULT 0,
    `cart_snapshot` longtext CHARACTER
    SET
      utf8mb4 COLLATE utf8mb4_bin NOT NULL,
      `consultation_date` date DEFAULT NULL,
      `consultation_time` time DEFAULT NULL,
      `consultation_duration` int (11) DEFAULT 15,
      `status` enum (
        'requested',
        'otp_verified',
        'confirmed',
        'completed',
        'cancelled'
      ) DEFAULT 'requested',
      `admin_notes` text DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      `video_booking_status` enum ('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
      PRIMARY KEY (`id`),
      KEY `user_id` (`user_id`),
      CONSTRAINT `video_consultation_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
  ) ENGINE = InnoDB AUTO_INCREMENT = 27 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: what_makes_us
DROP TABLE IF EXISTS `what_makes_us`;

CREATE TABLE
  `what_makes_us` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `section_heading` varchar(255) DEFAULT NULL,
    `background_image` text DEFAULT NULL,
    `side_image` text DEFAULT NULL,
    `point1_title` varchar(255) DEFAULT NULL,
    `point1_subtitle` text DEFAULT NULL,
    `point2_title` varchar(255) DEFAULT NULL,
    `point2_subtitle` text DEFAULT NULL,
    `point3_title` varchar(255) DEFAULT NULL,
    `point3_subtitle` text DEFAULT NULL,
    `point4_title` varchar(255) DEFAULT NULL,
    `point4_subtitle` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: who_we_are
DROP TABLE IF EXISTS `who_we_are`;

CREATE TABLE
  `who_we_are` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `heading_title` varchar(255) DEFAULT NULL,
    `subheading_title` varchar(255) DEFAULT NULL,
    `content_paragraph` text DEFAULT NULL,
    `bold_text` text DEFAULT NULL,
    `image_url` text DEFAULT NULL,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: wishlist_items
DROP TABLE IF EXISTS `wishlist_items`;

CREATE TABLE
  `wishlist_items` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `user_id` int (11) NOT NULL,
    `product_id` int (11) NOT NULL,
    `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `product_option_id` int (11) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `user_id` (`user_id`),
    KEY `product_id` (`product_id`),
    CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 29 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: wrapped_with_love
DROP TABLE IF EXISTS `wrapped_with_love`;

CREATE TABLE
  `wrapped_with_love` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) DEFAULT NULL,
    `alt_text` varchar(255) DEFAULT NULL,
    `description` text DEFAULT NULL,
    `image_url` varchar(255) NOT NULL,
    `category_id` int (11) NOT NULL,
    `position` int (11) DEFAULT 1,
    `is_active` tinyint (1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `fk_wrapped_with_love_category` (`category_id`),
    CONSTRAINT `fk_wrapped_with_love_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
  ) ENGINE = InnoDB AUTO_INCREMENT = 7 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table: pincodes
DROP TABLE IF EXISTS `pincodes`;

CREATE TABLE
  `pincodes` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `pincode` varchar(10) NOT NULL,
    `city` varchar(100) NOT NULL,
    `state` varchar(100) NOT NULL,
    `district` varchar(100) DEFAULT NULL,
    `zone` enum ('Metro', 'Tier1', 'Tier2', 'Tier3', 'Remote') DEFAULT 'Tier2',
    `delivery_available` tinyint (1) DEFAULT 1,
    `cod_available` tinyint (1) DEFAULT 1,
    `estimated_delivery_days` int (11) DEFAULT 3,
    `status` enum ('active', 'inactive') DEFAULT 'active',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `pincode` (`pincode`),
    KEY `idx_city` (`city`),
    KEY `idx_state` (`state`),
    KEY `idx_status` (`status`)
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

SET
  FOREIGN_KEY_CHECKS = 1;

COMMIT;