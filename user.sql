
CREATE TABLE accounts (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT,
    user_password TEXT,
    user_type INTEGER
);

CREATE TABLE users_info (
    user_id INTEGER UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    room_number INT,
    date_sign DATE,
    FOREIGN KEY (user_id) REFERENCES accounts(user_id)
);

// accounts
INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('hello', '1234', 1);
INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('how', '1234', 1);
INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('hey', '1234', 1);

INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('admin', '1234', 2);

// users_info
INSERT INTO users_info (user_id, first_name, last_name, email, phone, room_number, date_sign)
VALUES (1, 'hello', 'itsme', 'hello@example.com', '0123456789', 1, '2025-03-01');