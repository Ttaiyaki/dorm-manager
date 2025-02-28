CREATE TABLE accounts (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT,
    user_password TEXT,
    user_type INTEGER
)

INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('hello', '1234', 1);
INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('how', '1234', 1);
INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('hey', '1234', 1);

INSERT INTO accounts (user_name, user_password, user_type)
VALUES ('admin', '1234', 2);