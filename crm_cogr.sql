-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 24, 2026 at 07:51 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crm_cogr`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `log_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `user_id` int(11) NOT NULL,
  `action` enum('Login','Add','Update','Delete','Approval') NOT NULL,
  `module` varchar(100) NOT NULL,
  `record_id` int(11) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`log_id`, `tenant_id`, `user_id`, `action`, `module`, `record_id`, `timestamp`) VALUES
(1, 1, 1, 'Login', 'Auth', 1, '2026-06-14 04:30:00'),
(2, 1, 2, 'Update', 'Opportunities', 2, '2026-06-14 06:00:00'),
(3, 1, 3, 'Add', 'Orders', 2, '2026-06-14 07:15:00'),
(4, 1, 1, 'Login', 'Auth', 1, '2026-06-24 04:27:29'),
(5, 1, 1, 'Login', 'Auth', 1, '2026-06-24 04:34:43'),
(6, 1, 1, 'Login', 'Auth', 1, '2026-06-24 04:35:52'),
(7, 1, 2, 'Login', 'Auth', 2, '2026-06-24 04:36:03'),
(8, 1, 3, 'Login', 'Auth', 3, '2026-06-24 04:36:21'),
(9, 1, 2, 'Login', 'Auth', 2, '2026-06-24 04:36:35'),
(10, 1, 1, 'Login', 'Auth', 1, '2026-06-24 05:39:10'),
(11, 1, 2, 'Login', 'Auth', 2, '2026-06-24 05:41:39'),
(12, 1, 1, 'Login', 'Auth', 1, '2026-06-24 05:43:46');

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

CREATE TABLE `contracts` (
  `contract_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `customer_id` int(11) NOT NULL,
  `contract_number` varchar(100) NOT NULL,
  `contract_value` decimal(15,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Draft','Pending Approval','Active','Expired','Cancelled') NOT NULL DEFAULT 'Draft',
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`contract_id`, `tenant_id`, `customer_id`, `contract_number`, `contract_value`, `start_date`, `end_date`, `status`, `approved_by`, `created_at`) VALUES
(1, 1, 1, 'CON-2026-001', 6200000.00, '2026-01-01', '2026-12-31', 'Active', NULL, '2026-06-24 04:24:17'),
(2, 1, 2, 'CON-2026-002', 12000000.00, '2026-03-01', '2027-02-28', 'Active', NULL, '2026-06-24 04:24:17'),
(3, 1, 4, 'CON-2026-003', 58000000.00, '2026-06-15', '2026-09-15', 'Draft', NULL, '2026-06-24 04:24:17');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `company_name` varchar(150) NOT NULL,
  `contact_person` varchar(100) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `email` varchar(100) NOT NULL,
  `gst_number` varchar(15) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(50) NOT NULL,
  `state` varchar(50) NOT NULL,
  `country` varchar(50) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`customer_id`, `tenant_id`, `company_name`, `contact_person`, `phone`, `email`, `gst_number`, `address`, `city`, `state`, `country`, `status`, `created_at`) VALUES
(1, 1, 'Reliance Industries Ltd', 'Mukesh Patel', '+91-9876543210', 'mukesh.patel@ril.com', '27AAACR1234A1Z1', 'RIL Headquarters, Maker Chambers IV, Nariman Point', 'Mumbai', 'Maharashtra', 'India', 1, '2026-06-24 04:24:17'),
(2, 1, 'Indian Oil Corporation', 'Sanjay Kumar', '+91-9876543211', 'sanjay.k@indianoil.in', '07AAACI5566B1ZX', 'Scope Complex, Core-2, 7 Institutional Area, Lodhi Road', 'New Delhi', 'Delhi', 'India', 1, '2026-06-24 04:24:17'),
(3, 1, 'Bharat Petroleum', 'Amit Sharma', '+91-9876543212', 'amit.sharma@bharatpetroleum.in', '27AAACB3344C2Z5', 'BPCL Office, Ballard Estate', 'Mumbai', 'Maharashtra', 'India', 1, '2026-06-24 04:24:17'),
(4, 1, 'Singapore Petroleum Co', 'John Tan', '+65-6888-9999', 'john.tan@spc.com.sg', NULL, '1 Temasek Avenue, Millenia Tower', 'Singapore', 'Singapore', 'Singapore', 1, '2026-06-24 04:24:17'),
(5, 2, 'BP plc', '', '+44-20-7496-4000', 'procurement@bp.com', NULL, '1 St James\'s Square', 'London', 'England', 'United Kingdom', 0, '2026-06-24 05:44:23');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `invoice_number` varchar(100) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_status` enum('Unpaid','Partial','Paid') NOT NULL DEFAULT 'Unpaid',
  `invoice_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`invoice_id`, `tenant_id`, `invoice_number`, `customer_id`, `order_id`, `amount`, `tax_amount`, `total_amount`, `payment_status`, `invoice_date`, `created_at`) VALUES
(1, 1, 'INV-2026-2001', 4, 1, 58000000.00, 2900000.00, 60900000.00, 'Partial', '2026-06-10', '2026-06-24 04:24:18'),
(2, 1, 'INV-2026-2002', 1, 2, 12400000.00, 620000.00, 13020000.00, 'Unpaid', '2026-06-12', '2026-06-24 04:24:18');

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `lead_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `customer_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `source` enum('Website','Referral','Trade Fair','Call','Email') NOT NULL,
  `status` enum('New','Contacted','Qualified','Proposal Sent','Won','Lost') NOT NULL DEFAULT 'New',
  `assigned_to` int(11) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`lead_id`, `tenant_id`, `customer_id`, `title`, `source`, `status`, `assigned_to`, `remarks`, `created_at`) VALUES
(1, 1, 1, 'Inquiry for Brent Crude Q3', 'Website', 'Qualified', 3, 'Interested in 10,000 barrels of Brent Crude for Q3 delivery.', '2026-06-24 04:24:17'),
(2, 1, 2, 'Refinery Supply Contract Renewal', 'Email', 'Contacted', 3, 'Renewal negotiation for Indian Oil refinery pipeline supplies.', '2026-06-24 04:24:17'),
(3, 1, 3, 'Heavy Sour Oil Bulk Order Inquiry', 'Call', 'New', 3, 'Customer called about inventory availability for Heavy Sour Crude.', '2026-06-24 04:24:17'),
(4, 1, 4, 'WTI Crude import query', 'Referral', 'Won', 2, 'SPC Singapore looking to import WTI crude via tanker shipping.', '2026-06-24 04:24:17');

-- --------------------------------------------------------

--
-- Table structure for table `logistics`
--

CREATE TABLE `logistics` (
  `logistics_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `order_id` int(11) NOT NULL,
  `transporter_name` varchar(150) NOT NULL,
  `vehicle_number` varchar(50) NOT NULL,
  `tracking_number` varchar(100) NOT NULL,
  `dispatch_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `status` enum('Pending','In Transit','Delivered') NOT NULL DEFAULT 'Pending',
  `current_latitude` decimal(10,8) DEFAULT 0.00000000,
  `current_longitude` decimal(11,8) DEFAULT 0.00000000,
  `progress` decimal(5,2) DEFAULT 0.00,
  `route_coordinates` text DEFAULT NULL,
  `eta` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `logistics`
--

INSERT INTO `logistics` (`logistics_id`, `tenant_id`, `order_id`, `transporter_name`, `vehicle_number`, `tracking_number`, `dispatch_date`, `delivery_date`, `status`, `current_latitude`, `current_longitude`, `progress`, `route_coordinates`, `eta`, `created_at`) VALUES
(1, 1, 1, 'Ocean Tankers Ltd', 'IMO-9812736 (Tanker)', 'TRK-SPC-WTIO1', '2026-06-12', NULL, 'In Transit', 0.00000000, 0.00000000, 0.00, NULL, NULL, '2026-06-24 04:24:18');

-- --------------------------------------------------------

--
-- Table structure for table `oil_benchmarks`
--

CREATE TABLE `oil_benchmarks` (
  `benchmark_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `current_price` decimal(15,2) NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `oil_benchmarks`
--

INSERT INTO `oil_benchmarks` (`benchmark_id`, `name`, `current_price`, `last_updated`) VALUES
(1, 'Brent Crude', 6200.00, '2026-06-24 05:28:53'),
(2, 'West Texas Intermediate (WTI)', 5800.00, '2026-06-24 05:28:53'),
(3, 'Dubai Crude', 6000.00, '2026-06-24 05:28:53');

-- --------------------------------------------------------

--
-- Table structure for table `opportunities`
--

CREATE TABLE `opportunities` (
  `opportunity_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `customer_id` int(11) NOT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `expected_value` decimal(15,2) NOT NULL,
  `probability` int(11) NOT NULL DEFAULT 0,
  `stage` enum('Prospecting','Qualification','Proposal','Negotiation','Closed Won','Closed Lost') NOT NULL DEFAULT 'Prospecting',
  `expected_close_date` date NOT NULL,
  `assigned_to` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `opportunities`
--

INSERT INTO `opportunities` (`opportunity_id`, `tenant_id`, `customer_id`, `lead_id`, `title`, `description`, `expected_value`, `probability`, `stage`, `expected_close_date`, `assigned_to`, `created_at`) VALUES
(1, 1, 1, 1, 'Reliance Brent Q3 Supply', 'Supply of 10,000 barrels of Brent Crude Oil for Q3.', 62000000.00, 80, 'Negotiation', '2026-07-15', 3, '2026-06-24 04:24:17'),
(2, 1, 4, 4, 'SPC WTI Import Deal', 'Bulk sale of WTI Crude to Singapore Petroleum Co.', 58000000.00, 100, 'Closed Won', '2026-06-30', 2, '2026-06-24 04:24:17'),
(3, 1, 2, 2, 'IOCL Pipeline Supply renewal', 'Pipeline supply renewal project for Noida Refinery.', 120000000.00, 40, 'Qualification', '2026-09-01', 3, '2026-06-24 04:24:17');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `customer_id` int(11) NOT NULL,
  `opportunity_id` int(11) DEFAULT NULL,
  `order_number` varchar(100) NOT NULL,
  `order_date` date NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('Pending Approval','Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending Approval',
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `tenant_id`, `customer_id`, `opportunity_id`, `order_number`, `order_date`, `total_amount`, `status`, `approved_by`, `created_at`) VALUES
(1, 1, 4, 2, 'ORD-2026-1001', '2026-06-10', 58000000.00, 'Processing', NULL, '2026-06-24 04:24:17'),
(2, 1, 1, 1, 'ORD-2026-1002', '2026-06-12', 12400000.00, '', NULL, '2026-06-24 04:24:17');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(15,2) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `price`, `total`) VALUES
(1, 1, 2, 10000.00, 5800.00, 58000000.00),
(2, 2, 1, 2000.00, 6200.00, 12400000.00);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `invoice_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_mode` enum('Cash','Bank Transfer','Cheque','UPI','Credit Card') NOT NULL,
  `transaction_reference` varchar(100) NOT NULL,
  `payment_date` date NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `tenant_id`, `invoice_id`, `amount`, `payment_mode`, `transaction_reference`, `payment_date`, `remarks`, `created_at`) VALUES
(1, 1, 1, 30000000.00, 'Bank Transfer', 'TXN-SPC-998877', '2026-06-11', 'Advance payment for WTI shipment.', '2026-06-24 04:24:18');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL DEFAULT 1,
  `product_name` varchar(150) NOT NULL,
  `product_code` varchar(50) NOT NULL,
  `category` varchar(100) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `linked_benchmark_id` int(11) DEFAULT NULL,
  `margin_offset` decimal(15,2) DEFAULT 0.00,
  `stock_quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `tenant_id`, `product_name`, `product_code`, `category`, `unit_price`, `linked_benchmark_id`, `margin_offset`, `stock_quantity`, `description`, `status`, `created_at`) VALUES
(1, 1, 'Brent Crude Oil', 'CR-BRENT', 'Crude Oil', 6200.00, NULL, 0.00, 50000.00, 'Brent Crude is a major trading classification of sweet light crude oil that serves as a major benchmark price for purchases of oil worldwide.', 1, '2026-06-24 04:24:17'),
(2, 1, 'West Texas Intermediate (WTI)', 'CR-WTI', 'Crude Oil', 5800.00, NULL, 0.00, 35000.00, 'WTI is a grade of crude oil described as light sweet crude oil, used as a benchmark in oil pricing.', 1, '2026-06-24 04:24:17'),
(3, 1, 'Dubai Crude Oil', 'CR-DUBAI', 'Crude Oil', 6000.00, NULL, 0.00, 12000.00, 'Dubai Crude is a light sour crude oil produced in Dubai, used as a benchmark for Middle East crude export to Asia.', 1, '2026-06-24 04:24:17'),
(4, 1, 'Heavy Sour Crude Oil', 'CR-HEAVY', 'Crude Oil', 4500.00, NULL, 0.00, 2000.00, 'Heavy crude oil that contains a high concentration of sulfur, requiring additional refining.', 1, '2026-06-24 04:24:17');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `tenant_id` int(11) NOT NULL,
  `company_name` varchar(150) NOT NULL,
  `subdomain` varchar(50) DEFAULT NULL,
  `owner_email` varchar(100) NOT NULL,
  `status` enum('Active','Suspended','Trial') NOT NULL DEFAULT 'Trial',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`tenant_id`, `company_name`, `subdomain`, `owner_email`, `status`, `created_at`) VALUES
(1, 'Demo Oil Co.', NULL, 'admin@crm.com', 'Active', '2026-06-24 05:28:53'),
(2, 'Chevron Corp', 'chevron', 'owner@chevron.com', 'Active', '2026-06-24 05:44:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('SuperAdmin','CompanyAdmin','Manager','Employee','Client') NOT NULL DEFAULT 'Employee',
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `tenant_id`, `customer_id`, `name`, `email`, `password`, `role`, `status`, `created_at`) VALUES
(1, 1, NULL, 'System Administrator', 'admin@crm.com', '$2a$10$Lvu8op3XOS6gH4CZnFnS1u7Du2lVBX.Lll.4lOO2u.Xtf4Lt18H.6', 'CompanyAdmin', 1, '2026-06-24 04:24:17'),
(2, 1, NULL, 'Sales Manager', 'manager@crm.com', '$2a$10$EzX2DIxpmE754fj8wFqHJeJfPUbx5td8umfIMdrVVDK2UFQJuJgQq', 'Manager', 1, '2026-06-24 04:24:17'),
(3, 1, NULL, 'Sales Representative', 'employee@crm.com', '$2a$10$JdBw7r0ATHhPuO9jI1V2i.uiWntksdIGgjT63wmkKkA2HI/IusuNi', 'Employee', 1, '2026-06-24 04:24:17'),
(4, NULL, NULL, 'Global Super Admin', 'superadmin@platform.com', '$2a$10$UBkhFIeNOp8zU.RX6kks2ecG8ri2hmebuE1anJmzWu2jOnLgr3YLq', 'SuperAdmin', 1, '2026-06-24 05:44:02'),
(5, 1, 1, 'Reliance Client Rep', 'client@reliance.com', '$2a$10$UB7g8d2lQ.kCwxLonAaVr.Bbk475UZQL1h.wvndPmodS2AFslKhi.', 'Client', 1, '2026-06-24 05:44:02'),
(6, 2, NULL, 'Chevron Administrator', 'owner@chevron.com', '$2a$10$mswi8SFwN1O9VWFXF8RYc.Jn6UBpk/mce6SqHh8vPNq7/F785hcBa', 'CompanyAdmin', 1, '2026-06-24 05:44:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_act_tenant` (`tenant_id`);

--
-- Indexes for table `contracts`
--
ALTER TABLE `contracts`
  ADD PRIMARY KEY (`contract_id`),
  ADD UNIQUE KEY `contract_number` (`contract_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `fk_contr_tenant` (`tenant_id`),
  ADD KEY `fk_contr_approved_by` (`approved_by`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`customer_id`),
  ADD KEY `fk_cust_tenant` (`tenant_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`invoice_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `fk_inv_tenant` (`tenant_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`lead_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `fk_lead_tenant` (`tenant_id`);

--
-- Indexes for table `logistics`
--
ALTER TABLE `logistics`
  ADD PRIMARY KEY (`logistics_id`),
  ADD UNIQUE KEY `tracking_number` (`tracking_number`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `fk_log_tenant` (`tenant_id`);

--
-- Indexes for table `oil_benchmarks`
--
ALTER TABLE `oil_benchmarks`
  ADD PRIMARY KEY (`benchmark_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `opportunities`
--
ALTER TABLE `opportunities`
  ADD PRIMARY KEY (`opportunity_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `lead_id` (`lead_id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `fk_opp_tenant` (`tenant_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `opportunity_id` (`opportunity_id`),
  ADD KEY `fk_ord_tenant` (`tenant_id`),
  ADD KEY `fk_ord_approved_by` (`approved_by`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `fk_pay_tenant` (`tenant_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `product_code` (`product_code`),
  ADD KEY `fk_prod_tenant` (`tenant_id`),
  ADD KEY `fk_prod_benchmark` (`linked_benchmark_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`tenant_id`),
  ADD UNIQUE KEY `company_name` (`company_name`),
  ADD UNIQUE KEY `subdomain` (`subdomain`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_tenant` (`tenant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `contracts`
--
ALTER TABLE `contracts`
  MODIFY `contract_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `invoice_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `lead_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `logistics`
--
ALTER TABLE `logistics`
  MODIFY `logistics_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `oil_benchmarks`
--
ALTER TABLE `oil_benchmarks`
  MODIFY `benchmark_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `opportunities`
--
ALTER TABLE `opportunities`
  MODIFY `opportunity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `tenant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_act_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

--
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_contr_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_contr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `fk_cust_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_inv_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `fk_lead_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `logistics`
--
ALTER TABLE `logistics`
  ADD CONSTRAINT `fk_log_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `logistics_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `opportunities`
--
ALTER TABLE `opportunities`
  ADD CONSTRAINT `fk_opp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `opportunities_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `opportunities_ibfk_2` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`lead_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `opportunities_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_ord_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ord_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`opportunity_id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_pay_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_prod_benchmark` FOREIGN KEY (`linked_benchmark_id`) REFERENCES `oil_benchmarks` (`benchmark_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_prod_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`tenant_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
