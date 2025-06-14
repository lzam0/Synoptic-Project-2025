-- Enable extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    station_id UUID,
    place VARCHAR(255)
);

-- Create river table
CREATE TABLE IF NOT EXISTS river (
    river_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station VARCHAR(255),
    location VARCHAR(255),
    year INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    level DECIMAL(10, 3),   
    flow DECIMAL(10, 3)
);

-- Create dams table
CREATE TABLE IF NOT EXISTS dams (
    dams_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dam_name VARCHAR(255) NOT NULL,
    capacity DECIMAL(10, 2),
    outflow DECIMAL(10, 2)
);

-- Create precipitation table
CREATE TABLE IF NOT EXISTS precipitation (
    precipitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cumulative_monthly_rainfall DECIMAL(10, 2),
    daily_rainfall DECIMAL(10, 2)
);

-- Insert admin account
INSERT INTO users (
    user_id,
    username,
    password_hash,
    station_id,
    place
)
VALUES (
    uuid_generate_v4(),
    'dataflow',
    '$2b$10$vMw5XNphBJDUy1avQJbjeO8vCIi4/KlRRJ/pfretvAXkU2AQyIaYy', -- pass: 123
    uuid_generate_v4(), -- generate a UUID instead of using 'UEA'
    'Norwich'
);
