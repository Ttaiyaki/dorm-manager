const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('dormitory.db');

// ฟังก์ชันในการค้นหาผู้ใช้จากฐานข้อมูล
const getUserByID = (id, callback) => {
    db.get(`SELECT * FROM accounts WHERE user_name = ?`, [username], callback);
};


module.exports = {
    getUserByID
};
