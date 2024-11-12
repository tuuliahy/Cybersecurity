
-- Users Table
CREATE TABLE abc123_users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('reserver', 'administrator')),
    age INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consent_to_data_collection BOOLEAN NOT NULL DEFAULT FALSE
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

-- Triggers and Functions
-- Ensures only users over 15 can book resources
CREATE FUNCTION check_user_age() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_time IS NULL THEN
        RETURN NEW;
    END IF;
    IF (SELECT age FROM abc123_users WHERE user_id = NEW.user_id) < 15 THEN
        RAISE EXCEPTION 'User must be over 15 years old to book resources';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_reservation
BEFORE INSERT ON abc123_reservations
FOR EACH ROW
EXECUTE FUNCTION check_user_age();

-- Triggers for updating timestamp
CREATE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
