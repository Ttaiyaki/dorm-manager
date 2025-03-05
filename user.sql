
CREATE TABLE accounts (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL UNIQUE,
    user_password TEXT NOT NULL,
    user_type INTEGER NOT NULL
);

CREATE TABLE users (
    user_id INTEGER UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    user_img BLOB,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    room_id INT,
    date_start DATE,
    date_end DATE,
    FOREIGN KEY (user_id) REFERENCES accounts(user_id)
);

CREATE TABLE "bills" (
	"bill_id"	INTEGER,
	"user_id"	INTEGER,
	"month"	TEXT,
	"bill_status"	TEXT,
	"rent"	REAL,
	"water_bill"	REAL,
	"elect_bill"	REAL,
	"due_date"	TEXT,
	PRIMARY KEY("bill_id" AUTOINCREMENT),
	FOREIGN KEY("user_id") REFERENCES "accounts"("user_id")
);

CREATE TABLE "facilities" (
	"facility_id"	INTEGER,
	"name"	TEXT,
	PRIMARY KEY("facility_id" AUTOINCREMENT)
);

CREATE TABLE "meters" (
	"meter_id"	INTEGER,
	"room_id"	INTEGER,
	"meter_water"	INTEGER,
	"meter_elect"	INTEGER,
	"meter_month"	TEXT,
	"updated_at"	TEXT,
	PRIMARY KEY("meter_id" AUTOINCREMENT),
	FOREIGN KEY("room_id") REFERENCES "rooms"("room_id")
);

CREATE TABLE "payments" (
	"payment_id"	INTEGER,
	"bill_id"	INTEGER,
	"payment_status"	TEXT,
	"payment_date"	TEXT,
	"payment_slip"	BLOB,
	PRIMARY KEY("payment_id" AUTOINCREMENT),
	FOREIGN KEY("bill_id") REFERENCES "bills"("bill_id")
);

CREATE TABLE "room_facilities" (
	"room_id"	INTEGER,
	"facility_id"	INTEGER,
	PRIMARY KEY("room_id","facility_id"),
	FOREIGN KEY("facility_id") REFERENCES "facilities"("facility_id"),
	FOREIGN KEY("room_id") REFERENCES "rooms"("room_id")
);

CREATE TABLE "rooms" (
	"room_id"	INTEGER,
	"room_number"	TEXT,
	"building"	TEXT,
	"floor"	INTEGER,
	"type"	TEXT,
	"size"	REAL,
	"rent"	REAL,
	"elect_per_unit"	REAL,
	"water_per_unit"	REAL,
	PRIMARY KEY("room_id" AUTOINCREMENT)
);
