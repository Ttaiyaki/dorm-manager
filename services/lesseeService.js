const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('dormitory.db');

// ฟังก์ชันในการค้นหาผู้ใช้จากฐานข้อมูล
const getUserByID = (id, callback) => {
    db.get(`SELECT printf('%03d', user_id) AS user_id, user_name, first_name, last_name, email, phone, room_number, date_sign FROM accounts
            INNER JOIN users_info USING (user_id)
            WHERE user_id = ?;`, [id], callback);
};


module.exports = { getUserByID };
