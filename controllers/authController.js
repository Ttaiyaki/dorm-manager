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
            req.session.popup = "user not found";
            return res.redirect('/log-in');
        }

        console.log(user)
        bcrypt.compare(user_password, user[0].user_password, (err, match) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!match) {
                req.session.popup = "password not match";
                return res.redirect('/log-in');
            }

            const user_info = {
                user_id: user[0].user_id,
                user_name: user[0].user_name,
                user_type: user[0].user_type,
                user_status: user[0].user_status
            };

            // ตั้งค่า ID ใน cookie หลังจาก login สำเร็จ
            res.cookie('user', user_info, { httpOnly: true, maxAge: 3600000 });  // ตั้งค่า cookie user_id
            if (user[0].user_type === 1) {return res.redirect('/lessee');}
            return res.redirect('/lesser/rooms');
        });
    });
};

const createUser = (userData, req, res) => {
    const insertAccounts = `INSERT INTO accounts (user_name, user_password, user_type) VALUES (?, ?, 1); `
    loginService.updateData(insertAccounts, [userData.uname, userData.pwd], (err) => {
        if (err) {
          if (err.code == 'SQLITE_CONSTRAINT') {
            req.session.popup = "username is already exist";
            req.session.form = userData;
            return res.redirect('/register');
          }

          return console.log(err);
        };
        console.log(`${userData.uname} has been inserted to accounts DB.`);
    });

    const getUserID = ` SELECT user_id FROM accounts WHERE user_name = ?; `
    loginService.getData(getUserID, [userData.uname], (err, rows) => {
      if (err) {return console.log(err.message);}

      console.log(rows[0].user_id)

      const insertUsersInfo = ` INSERT INTO users (user_id, first_name, last_name, email, phone, room_id, date_start, date_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?); `;
      loginService.updateData(insertUsersInfo, [rows[0].user_id, userData.fn, userData.ln, userData.email, userData.phone, userData.room, userData.date_start, userData.date_end], (err) => {
        if (err) {return console.log(err.message);}

        console.log(`${userData.uname} has been inserted to users_info DB.`)
        res.redirect('/log-in');
      });
    })
};

module.exports = { loginUser, createUser };
