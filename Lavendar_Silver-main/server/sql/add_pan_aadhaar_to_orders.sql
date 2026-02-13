-- Migration: Add PAN and Aadhaar Number columns to orders table
-- For legal compliance: Required for orders above ₹2,00,000

ALTER TABLE `orders` 
ADD COLUMN `pan_number` VARCHAR(10) DEFAULT NULL AFTER `discount_amount`,
ADD COLUMN `aadhaar_number` VARCHAR(12) DEFAULT NULL AFTER `pan_number`;

-- Add index for faster queries if needed
-- CREATE INDEX `idx_pan_number` ON `orders` (`pan_number`);
-- CREATE INDEX `idx_aadhaar_number` ON `orders` (`aadhaar_number`);

