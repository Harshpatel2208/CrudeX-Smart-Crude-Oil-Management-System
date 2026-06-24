-- --------------------------------------------------------
-- DATABASE MIGRATION SCRIPT FOR MULTI-TENANCY & PREMIUM FEATURES
-- --------------------------------------------------------

USE `crm_cogr`;

-- 1. CREATE TENANTS TABLE
CREATE TABLE IF NOT EXISTS `tenants` (
  `tenant_id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(150) UNIQUE NOT NULL,
  `subdomain` VARCHAR(50) UNIQUE NULL,
  `owner_email` VARCHAR(100) NOT NULL,
  `status` ENUM('Active', 'Suspended', 'Trial') NOT NULL DEFAULT 'Trial',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default tenant for existing records
INSERT IGNORE INTO `tenants` (`tenant_id`, `company_name`, `owner_email`, `status`) VALUES
(1, 'Demo Oil Co.', 'admin@crm.com', 'Active');

-- 2. CREATE OIL BENCHMARKS TABLE
CREATE TABLE IF NOT EXISTS `oil_benchmarks` (
  `benchmark_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) UNIQUE NOT NULL, -- Brent Crude, WTI, Dubai Crude
  `current_price` DECIMAL(15,2) NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default benchmarks
INSERT IGNORE INTO `oil_benchmarks` (`benchmark_id`, `name`, `current_price`) VALUES
(1, 'Brent Crude', 6200.00),
(2, 'West Texas Intermediate (WTI)', 5800.00),
(3, 'Dubai Crude', 6000.00);

-- 3. ALTER USERS TABLE FOR MULTI-TENANCY & CLIENT ROLES
ALTER TABLE `users` 
  ADD COLUMN `tenant_id` INT NULL AFTER `user_id`,
  ADD COLUMN `customer_id` INT NULL AFTER `tenant_id`, -- For Client Portal users
  MODIFY COLUMN `role` ENUM('SuperAdmin', 'CompanyAdmin', 'Manager', 'Employee', 'Client') NOT NULL DEFAULT 'Employee',
  ADD CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE SET NULL;

-- Link existing users to Demo Tenant
UPDATE `users` SET `tenant_id` = 1 WHERE `user_id` IN (1, 2, 3);
-- Promote user 1 to CompanyAdmin (SuperAdmin will be created or updated later)
UPDATE `users` SET `role` = 'CompanyAdmin' WHERE `user_id` = 1;

-- 4. ALTER CRM ENTITIES TO ADD TENANT_ID
ALTER TABLE `customers` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `customer_id`,
  ADD CONSTRAINT `fk_cust_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

ALTER TABLE `products` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `product_id`,
  ADD COLUMN `linked_benchmark_id` INT NULL AFTER `unit_price`,
  ADD COLUMN `margin_offset` DECIMAL(15,2) DEFAULT 0.00 AFTER `linked_benchmark_id`,
  ADD CONSTRAINT `fk_prod_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prod_benchmark` FOREIGN KEY (`linked_benchmark_id`) REFERENCES `oil_benchmarks` (`benchmark_id`) ON DELETE SET NULL;

ALTER TABLE `leads` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `lead_id`,
  ADD CONSTRAINT `fk_lead_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

ALTER TABLE `opportunities` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `opportunity_id`,
  ADD CONSTRAINT `fk_opp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

-- ALTER CONTRACTS: Add tenant_id and modify status values
ALTER TABLE `contracts` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `contract_id`,
  MODIFY COLUMN `status` ENUM('Draft', 'Pending Approval', 'Active', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Draft',
  ADD COLUMN `approved_by` INT NULL AFTER `status`,
  ADD CONSTRAINT `fk_contr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_contr_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

-- ALTER ORDERS: Add tenant_id and modify status values
ALTER TABLE `orders` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `order_id`,
  MODIFY COLUMN `status` ENUM('Pending Approval', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending Approval',
  ADD COLUMN `approved_by` INT NULL AFTER `status`,
  ADD CONSTRAINT `fk_ord_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ord_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

-- ALTER LOGISTICS: Add tenant_id, current location coordinates, transit progress and ETA
ALTER TABLE `logistics` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `logistics_id`,
  ADD COLUMN `current_latitude` DECIMAL(10,8) DEFAULT 0.00000000 AFTER `status`,
  ADD COLUMN `current_longitude` DECIMAL(11,8) DEFAULT 0.00000000 AFTER `current_latitude`,
  ADD COLUMN `progress` DECIMAL(5,2) DEFAULT 0.00 AFTER `current_longitude`,
  ADD COLUMN `route_coordinates` TEXT NULL AFTER `progress`,
  ADD COLUMN `eta` DATETIME NULL AFTER `route_coordinates`,
  ADD CONSTRAINT `fk_log_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

ALTER TABLE `invoices` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `invoice_id`,
  ADD CONSTRAINT `fk_inv_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

ALTER TABLE `payments` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `payment_id`,
  ADD CONSTRAINT `fk_pay_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

ALTER TABLE `activity_logs` 
  ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 AFTER `log_id`,
  ADD CONSTRAINT `fk_act_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;
