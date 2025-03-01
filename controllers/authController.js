const loginService = require('../services/loginService');

// ฟังก์ชันจัดการการเข้าสู่ระบบ
const loginUser = (req, res) => {
    const { user_name, user_password } = req.body;

    // ใช้ service เพื่อตรวจสอบข้อมูลผู้ใช้
    loginService.getUserByUsername(user_name, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // ตรวจสอบรหัสผ่าน
        if (loginService.verifyPassword(user_password, user.user_password)) {
            res.cookie('user_id', user.user_id, { httpOnly: true, maxAge: 3600000 });  // ตั้งค่า cookie user_id
            return res.redirect('/lessee');
        } else {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        // userService.verifyPassword(user_password, user.user_password, (err, match) => {
        //     if (err) {
        //         return res.status(500).json({ error: err.message });
        //     }
        //     if (!match) {
        //         console.log(match)
        //         return res.status(400).json({ message: 'Invalid credentials' });
        //     }

        //     // ตั้งค่า ID ใน cookie หลังจาก login สำเร็จ
        //     res.cookie('user_id', user.user_id, { httpOnly: true, maxAge: 3600000 });  // ตั้งค่า cookie user_id
        //     return res.redirect('/lessee');
        // });
    });
};

module.exports = { loginUser };
