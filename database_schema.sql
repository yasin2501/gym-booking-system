-- ========================================================================
-- Gym & Fitness Class Booking System - Database Schema
-- Compatibility target: Older MySQL/InnoDB setups with 767-byte key limit
-- ========================================================================
-- Database: gym_booking_system
-- Version: 1.1-compatible
-- Created: March 2026
-- ========================================================================

CREATE DATABASE IF NOT EXISTS gym_booking_system;
USE gym_booking_system;

-- Optional: recreate tables cleanly
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS trainers;
DROP TABLE IF EXISTS users;

-- ========================================================================
-- TABLE 1: users
-- Purpose: Store all system users (members, trainers, admins)
-- ========================================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    role ENUM('member', 'trainer', 'admin') NOT NULL DEFAULT 'member',
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    membership_status ENUM('active', 'inactive', 'expired') DEFAULT 'inactive',
    membership_expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,

    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- TABLE 2: trainers
-- Purpose: Store trainer-specific information and qualifications
-- ========================================================================
CREATE TABLE trainers (
    trainer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    specializations VARCHAR(500),
    certifications VARCHAR(500),
    hourly_rate DECIMAL(10, 2) NOT NULL,
    availability_status ENUM('available', 'unavailable', 'on_leave') DEFAULT 'available',
    total_classes_taught INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_trainer_status (availability_status),
    INDEX idx_trainer_rating (average_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- TABLE 3: classes
-- Purpose: Store fitness class definitions and schedules
-- ========================================================================
CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    class_name VARCHAR(150) NOT NULL,
    description TEXT,
    class_type ENUM('yoga', 'pilates', 'cardio', 'strength', 'dance', 'CrossFit', 'other') NOT NULL,
    schedule_day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INT NOT NULL,
    current_enrollment INT DEFAULT 0,
    price_per_class DECIMAL(10, 2) NOT NULL,
    skill_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
    location VARCHAR(200),
    class_status ENUM('active', 'cancelled', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (trainer_id) REFERENCES trainers(trainer_id) ON DELETE RESTRICT,
    INDEX idx_class_trainer (trainer_id),
    INDEX idx_class_status (class_status),
    INDEX idx_class_day (schedule_day),
    INDEX idx_class_type (class_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- TABLE 4: bookings
-- Purpose: Store member class bookings and attendance records
-- ========================================================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    class_id INT NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    booking_status ENUM('confirmed', 'cancelled', 'no_show', 'completed') DEFAULT 'confirmed',
    attendance_status ENUM('attended', 'absent', 'pending') DEFAULT 'pending',
    cancellation_date TIMESTAMP NULL,
    cancellation_reason VARCHAR(500),
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    UNIQUE KEY unique_booking (user_id, class_id),
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_class (class_id),
    INDEX idx_booking_status (booking_status),
    INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- TABLE 5: payments
-- Purpose: Store payment transactions and receipts
-- ========================================================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(191) UNIQUE,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP NULL,
    refund_date TIMESTAMP NULL,
    refund_reason VARCHAR(500),
    refund_amount DECIMAL(10, 2),
    receipt_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_payment_user (user_id),
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- Verification Queries (Run after schema creation)
-- ========================================================================
-- SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'gym_booking_system';
-- DESCRIBE users;
-- DESCRIBE trainers;
-- DESCRIBE classes;
-- DESCRIBE bookings;
-- DESCRIBE payments;
