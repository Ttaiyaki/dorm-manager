
CREATE TABLE accounts (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL UNIQUE,
    user_password TEXT NOT NULL,
    user_type INTEGER NOT NULL
);

CREATE TABLE users_info (
    user_id INTEGER UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    room_number INT,
    date_sign DATE,
    FOREIGN KEY (user_id) REFERENCES accounts(user_id)
);

// Lesser ID
INSERT INTO accounts (user_name, user_password, user_)