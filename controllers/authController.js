const loginService = require('../services/loginService');
const bcrypt = require('bcrypt')

// ฟังก์ชันจัดการการเข้าสู่ระบบ
const loginUser = (req, res) => {
    const { user_name, user_password } = req.body;

    const getUser = `SELECT * FROM accounts WHERE user_name = ?`;
    // ใช้ service เพื่อตรวจสอบข้อมูลผู้ใช้
    loginService.getData(getUser, [user_name], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        console.log(user)
        bcrypt.compare(user_password, user[0].user_password, (err, match) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!match) {
                console.log(match)
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // ตั้งค่า ID ใน cookie หลังจาก login สำเร็จ
            res.cookie('user_id', user[0].user_id, { httpOnly: true, maxAge: 3600000 });  // ตั้งค่า cookie user_id
            if (user[0].user_type === 1) {return res.redirect('/lessee');}
            return res.redirect('/lesser/rooms');
        });
    });
};

const createUser = (userData, res) => {
    const insertAccounts = `INSERT INTO accounts (user_name, user_password, user_type) VALUES (?, ?, 1); `
    loginService.updateData(insertAccounts, [userData.uname, userData.pwd], (err) => {
        if (err) {
          if (err.code == 'SQLITE_CONSTRAINT') {
            return res.send(`Username : ${userData.uname} is already exist.`);
          }

          return console.log(err.message);
        };
        console.log(`${userData.uname} has been inserted to accounts DB.`);
    });

    const getUserID = ` SELECT user_id FROM accounts WHERE user_name = ?; `
    loginService.getData(getUserID, [userData.uname], (err, rows) => {
      if (err) {return console.log(err.message);}

      console.log(rows[0].user_id)

      const insertUsersInfo = ` INSERT INTO users_info (user_id, first_name, last_name, email, phone, room_number, date_sign) VALUES (?, ?, ?, ?, ?, ?, ?); `;
      loginService.updateData(insertUsersInfo, [rows[0].user_id, userData.fn, userData.ln, userData.email, userData.phone, userData.room, userData.checkIn], (err) => {
        if (err) {return console.log(err.message);}

        console.log(`${userData.uname} has been inserted to users_info DB.`)
        res.redirect('/log-in');
      });
    })
};

module.exports = { loginUser, createUser };
