const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('dormitory.db');

// ฟังก์ชันในการค้นหาผู้ใช้จากฐานข้อมูล
const getUserByUsername = (username, callback) => {
    db.get(`SELECT * FROM accounts WHERE user_name = ?`, [username], callback);
};

// const verifyPassword = (password, hashedPassword) => {
//     return password == hashedPassword;
// };


// ฟังก์ชันในการตรวจสอบรหัสผ่าน โดยเทียบรหัสผ่านที่รับเข้ามา และรหัสที่ผ่านการ hash แล้ว
const verifyPassword = (password, hashedPassword, callback) => {
    // bcrypt.compare(password, hashedPassword, callback);
    return password == hashedPassword;
};

module.exports = {
    getUserByUsername,
    verifyPassword
};
