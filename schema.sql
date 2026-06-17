-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS `crm_cogr` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `crm_cogr`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Admin', 'Manager', 'Employee') NOT NULL DEFAULT 'Employee',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `gst_number` VARCHAR(15),
  `address` TEXT NOT NULL,
  `city` VARCHAR(50) NOT NULL,
  `state` VARCHAR(50) NOT NULL,
  `country` VARCHAR(50) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS `products` (
  `product_id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_name` VARCHAR(150) NOT NULL,
  `product_code` VARCHAR(50) UNIQUE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `stock_quantity` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `description` TEXT,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. LEADS TABLE
CREATE TABLE IF NOT EXISTS `leads` (
  `lead_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `source` ENUM('Website', 'Referral', 'Trade Fair', 'Call', 'Email') NOT NULL,
  `status` ENUM('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost') NOT NULL DEFAULT 'New',
  `assigned_to` INT NOT NULL,
  `remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS `opportunities` (
  `opportunity_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `lead_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `expected_value` DECIMAL(15,2) NOT NULL,
  `probability` INT NOT NULL DEFAULT 0,
  `stage` ENUM('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost') NOT NULL DEFAULT 'Prospecting',
  `expected_close_date` DATE NOT NULL,
  `assigned_to` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  FOREIGN KEY (`lead_id`) REFERENCES `leads` (`lead_id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS `contracts` (
  `contract_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `contract_number` VARCHAR(100) UNIQUE NOT NULL,
  `contract_value` DECIMAL(15,2) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('Draft', 'Active', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `opportunity_id` INT NULL,
  `order_number` VARCHAR(100) UNIQUE NOT NULL,
  `order_date` DATE NOT NULL,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`opportunity_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS `order_items` (
  `order_item_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL,
  `price` DECIMAL(15,2) NOT NULL,
  `total` DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. LOGISTICS TABLE
CREATE TABLE IF NOT EXISTS `logistics` (
  `logistics_id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `transporter_name` VARCHAR(150) NOT NULL,
  `vehicle_number` VARCHAR(50) NOT NULL,
  `tracking_number` VARCHAR(100) UNIQUE NOT NULL,
  `dispatch_date` DATE NOT NULL,
  `delivery_date` DATE NULL,
  `status` ENUM('Pending', 'In Transit', 'Delivered') NOT NULL DEFAULT 'Pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. INVOICES TABLE
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoice_id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(100) UNIQUE NOT NULL,
  `customer_id` INT NOT NULL,
  `order_id` INT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `tax_amount` DECIMAL(15,2) NOT NULL,
  `total_amount` DECIMAL(15,2) NOT NULL,
  `payment_status` ENUM('Unpaid', 'Partial', 'Paid') NOT NULL DEFAULT 'Unpaid',
  `invoice_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `payment_mode` ENUM('Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card') NOT NULL,
  `transaction_reference` VARCHAR(100) NOT NULL,
  `payment_date` DATE NOT NULL,
  `remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. ACTIVITY_LOGS TABLE
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `action` ENUM('Login', 'Add', 'Update', 'Delete', 'Approval') NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `record_id` INT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed Users (Passwords are bcrypt hashed value of: 'admin123', 'manager123', 'employee123')
-- Bcrypt Hash generated for 'admin123': $2a$10$Lvu8op3XOS6gH4CZnFnS1u7Du2lVBX.Lll.4lOO2u.Xtf4Lt18H.6
-- Bcrypt Hash generated for 'manager123': $2a$10$EzX2DIxpmE754fj8wFqHJeJfPUbx5td8umfIMdrVVDK2UFQJuJgQq
-- Bcrypt Hash generated for 'employee123': $2a$10$JdBw7r0ATHhPuO9jI1V2i.uiWntksdIGgjT63wmkKkA2HI/IusuNi
INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `status`) VALUES
(1, 'System Administrator', 'admin@crm.com', '$2a$10$Lvu8op3XOS6gH4CZnFnS1u7Du2lVBX.Lll.4lOO2u.Xtf4Lt18H.6', 'Admin', 1),
(2, 'Sales Manager', 'manager@crm.com', '$2a$10$EzX2DIxpmE754fj8wFqHJeJfPUbx5td8umfIMdrVVDK2UFQJuJgQq', 'Manager', 1),
(3, 'Sales Representative', 'employee@crm.com', '$2a$10$JdBw7r0ATHhPuO9jI1V2i.uiWntksdIGgjT63wmkKkA2HI/IusuNi', 'Employee', 1);

-- Seed Customers
INSERT INTO `customers` (`customer_id`, `company_name`, `contact_person`, `phone`, `email`, `gst_number`, `address`, `city`, `state`, `country`, `status`) VALUES
(1, 'Reliance Industries Ltd', 'Mukesh Patel', '+91-9876543210', 'mukesh.patel@ril.com', '27AAACR1234A1Z1', 'RIL Headquarters, Maker Chambers IV, Nariman Point', 'Mumbai', 'Maharashtra', 'India', 1),
(2, 'Indian Oil Corporation', 'Sanjay Kumar', '+91-9876543211', 'sanjay.k@indianoil.in', '07AAACI5566B1ZX', 'Scope Complex, Core-2, 7 Institutional Area, Lodhi Road', 'New Delhi', 'Delhi', 'India', 1),
(3, 'Bharat Petroleum', 'Amit Sharma', '+91-9876543212', 'amit.sharma@bharatpetroleum.in', '27AAACB3344C2Z5', 'BPCL Office, Ballard Estate', 'Mumbai', 'Maharashtra', 'India', 1),
(4, 'Singapore Petroleum Co', 'John Tan', '+65-6888-9999', 'john.tan@spc.com.sg', NULL, '1 Temasek Avenue, Millenia Tower', 'Singapore', 'Singapore', 'Singapore', 1);

-- Seed Products
INSERT INTO `products` (`product_id`, `product_name`, `product_code`, `category`, `unit_price`, `stock_quantity`, `description`, `status`) VALUES
(1, 'Brent Crude Oil', 'CR-BRENT', 'Crude Oil', 6200.00, 50000.00, 'Brent Crude is a major trading classification of sweet light crude oil that serves as a major benchmark price for purchases of oil worldwide.', 1),
(2, 'West Texas Intermediate (WTI)', 'CR-WTI', 'Crude Oil', 5800.00, 35000.00, 'WTI is a grade of crude oil described as light sweet crude oil, used as a benchmark in oil pricing.', 1),
(3, 'Dubai Crude Oil', 'CR-DUBAI', 'Crude Oil', 6000.00, 12000.00, 'Dubai Crude is a light sour crude oil produced in Dubai, used as a benchmark for Middle East crude export to Asia.', 1),
(4, 'Heavy Sour Crude Oil', 'CR-HEAVY', 'Crude Oil', 4500.00, 2000.00, 'Heavy crude oil that contains a high concentration of sulfur, requiring additional refining.', 1);

-- Seed Leads
INSERT INTO `leads` (`lead_id`, `customer_id`, `title`, `source`, `status`, `assigned_to`, `remarks`) VALUES
(1, 1, 'Inquiry for Brent Crude Q3', 'Website', 'Qualified', 3, 'Interested in 10,000 barrels of Brent Crude for Q3 delivery.'),
(2, 2, 'Refinery Supply Contract Renewal', 'Email', 'Contacted', 3, 'Renewal negotiation for Indian Oil refinery pipeline supplies.'),
(3, 3, 'Heavy Sour Oil Bulk Order Inquiry', 'Call', 'New', 3, 'Customer called about inventory availability for Heavy Sour Crude.'),
(4, 4, 'WTI Crude import query', 'Referral', 'Won', 2, 'SPC Singapore looking to import WTI crude via tanker shipping.');

-- Seed Opportunities
INSERT INTO `opportunities` (`opportunity_id`, `customer_id`, `lead_id`, `title`, `description`, `expected_value`, `probability`, `stage`, `expected_close_date`, `assigned_to`) VALUES
(1, 1, 1, 'Reliance Brent Q3 Supply', 'Supply of 10,000 barrels of Brent Crude Oil for Q3.', 62000000.00, 80, 'Negotiation', '2026-07-15', 3),
(2, 4, 4, 'SPC WTI Import Deal', 'Bulk sale of WTI Crude to Singapore Petroleum Co.', 58000000.00, 100, 'Closed Won', '2026-06-30', 2),
(3, 2, 2, 'IOCL Pipeline Supply renewal', 'Pipeline supply renewal project for Noida Refinery.', 120000000.00, 40, 'Qualification', '2026-09-01', 3);

-- Seed Contracts
INSERT INTO `contracts` (`contract_id`, `customer_id`, `contract_number`, `contract_value`, `start_date`, `end_date`, `status`) VALUES
(1, 1, 'CON-2026-001', 6200000.00, '2026-01-01', '2026-12-31', 'Active'),
(2, 2, 'CON-2026-002', 12000000.00, '2026-03-01', '2027-02-28', 'Active'),
(3, 4, 'CON-2026-003', 58000000.00, '2026-06-15', '2026-09-15', 'Draft');

-- Seed Orders
INSERT INTO `orders` (`order_id`, `customer_id`, `opportunity_id`, `order_number`, `order_date`, `total_amount`, `status`) VALUES
(1, 4, 2, 'ORD-2026-1001', '2026-06-10', 58000000.00, 'Processing'),
(2, 1, 1, 'ORD-2026-1002', '2026-06-12', 12400000.00, 'Pending');

-- Seed Order Items
INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `price`, `total`) VALUES
(1, 1, 2, 10000.00, 5800.00, 58000000.00),
(2, 2, 1, 2000.00, 6200.00, 12400000.00);

-- Seed Logistics
INSERT INTO `logistics` (`logistics_id`, `order_id`, `transporter_name`, `vehicle_number`, `tracking_number`, `dispatch_date`, `delivery_date`, `status`) VALUES
(1, 1, 'Ocean Tankers Ltd', 'IMO-9812736 (Tanker)', 'TRK-SPC-WTIO1', '2026-06-12', NULL, 'In Transit');

-- Seed Invoices
INSERT INTO `invoices` (`invoice_id`, `invoice_number`, `customer_id`, `order_id`, `amount`, `tax_amount`, `total_amount`, `payment_status`, `invoice_date`) VALUES
(1, 'INV-2026-2001', 4, 1, 58000000.00, 2900000.00, 60900000.00, 'Partial', '2026-06-10'),
(2, 'INV-2026-2002', 1, 2, 12400000.00, 620000.00, 13020000.00, 'Unpaid', '2026-06-12');

-- Seed Payments
INSERT INTO `payments` (`payment_id`, `invoice_id`, `amount`, `payment_mode`, `transaction_reference`, `payment_date`, `remarks`) VALUES
(1, 1, 30000000.00, 'Bank Transfer', 'TXN-SPC-998877', '2026-06-11', 'Advance payment for WTI shipment.');

-- Seed Activity Logs
INSERT INTO `activity_logs` (`log_id`, `user_id`, `action`, `module`, `record_id`, `timestamp`) VALUES
(1, 1, 'Login', 'Auth', 1, '2026-06-14 10:00:00'),
(2, 2, 'Update', 'Opportunities', 2, '2026-06-14 11:30:00'),
(3, 3, 'Add', 'Orders', 2, '2026-06-14 12:45:00');
