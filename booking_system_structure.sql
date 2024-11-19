-- Users Table
CREATE TABLE abc123_users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(10) CHECK (role IN ('reserver', 'administrator')) NOT NULL, 
    consent_to_data_collection BOOLEAN NOT NULL DEFAULT FALSE -- Poistettu ylimääräinen pilkku
    age INT CHECK (age >= 0) 
);

-- Resources Table
CREATE TABLE abc123_resources (
    resource_id SERIAL PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_control_level INT NOT NULL DEFAULT 1 -- Access control for GDPR compliance
);

-- Reservations Table
CREATE TABLE abc123_reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES abc123_users (user_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES abc123_resources (resource_id) ON DELETE CASCADE
);

-- Poistetaan vanha ikä-tarkistusfunktio ja trigger
DROP FUNCTION IF EXISTS check_user_age;
DROP TRIGGER IF EXISTS before_insert_reservation ON abc123_reservations;

-- Triggers for updating timestamp
CREATE FUNCTION update_timestamp() RETURNS TRIGGER AS $$ 
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp 
BEFORE UPDATE ON abc123_users 
FOR EACH ROW 
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_resources_timestamp 
BEFORE UPDATE ON abc123_resources 
FOR EACH ROW 
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_reservations_timestamp 
BEFORE UPDATE ON abc123_reservations 
FOR EACH ROW 
EXECUTE FUNCTION update_timestamp();
