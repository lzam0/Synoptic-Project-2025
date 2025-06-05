--Extension to generate unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "users" (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO "users" (
    user_id,
    username,
    password_hash 
)
VALUES
-- admin account
(
    uuid_generate_v4(),  
    "dataflow-admin",
    ""
);