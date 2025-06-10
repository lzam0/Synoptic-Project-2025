-- Extension to generate unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS river (
    river_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station VARCHAR(255),
    location VARCHAR(255),
    year INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    level DECIMAL(10, 3),   
    flow DECIMAL(10, 3), 
);

CREATE TABLE IF NOT EXISTS dams (
    dams_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dam_name VARCHAR(255) NOT NULL,
    capacity DECIMAL(10, 2),
    outflow DECIMAL(10, 2)
);


CREATE TABLE IF NOT EXISTS precipitation (
    precipitation_ida UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cumulitive_monthly_rainfall DECIMAL(10, 2),
    daily_rainfall DECIMAL(10, 2)
);

-- Insert admin account
INSERT INTO "users" (
    user_id,
    email,
    username,
    password_hash 
)
VALUES (
    uuid_generate_v4(),
    'parkflow113@gmail.com',
    'dataflow',
    '$2b$10$vMw5XNphBJDUy1avQJbjeO8vCIi4/KlRRJ/pfretvAXkU2AQyIaYy' -- pass 123
);
