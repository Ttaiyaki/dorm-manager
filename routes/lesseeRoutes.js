
const express = require('express');
const router = express.Router();
const lesseeService = require('../services/lesseeService')

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_type != 1) {
        req.cookies.popup = "not lessee";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }

    const getUserRoom = ` SELECT room_id FROM users WHERE user_id = ?; `;
    lesseeService.getData(getUserRoom, [req.cookies.user.user_id], (err, room_id) => {
        if (err) {return console.log(err.message);}
        if (room_id.length === 0) {
            return 
        }
        console.log(room_id[0].room_id);
        
        const getRoom = ` SELECT * FROM rooms r
                      INNER JOIN room_facilities rf USING (room_id)
                      INNER JOIN facilities f USING (facility_id)
                      WHERE room_id = ?; `;
        lesseeService.getData(getRoom, [room_id[0].room_id], (err, room) => {
            if (err) {return console.log(err.message);}
            if (room.length === 0) {console.log('no room')}
            console.log(room);

            const getBill = ` SELECT * FROM bills WHERE user_id = ? AND bill_status = 'unpaid' ORDER BY bill_id DESC `;
            lesseeService.getData(getBill, [req.cookies.user.user_id], (err, bill) => {
                if (err) {return console.log(err.message);}
                if (bill.length === 0) {console.log('no bill')}
                else {
                    console.log(bill);
                    const date = new Date(bill[0].month);
                    console.log(date)
                    const monthName = date.toLocaleDateString('th-Th', { month: 'long' }); // แปลงเดือนเป็นชื่อเดือนไทย
                    bill[0].month = monthName;

                    bill[0].current = bill[0].rent + bill[0].elect_bill + bill[0].water_bill // รวมค่าน้ำค่าไฟ
                    bill[0].total = 0;
                    bill.forEach(billEach => {
                        bill[0].total += billEach.rent + billEach.water_bill + billEach.elect_bill; // bill เก่า
                    });
                    bill[0].old_bill = bill[0].total - bill[0].current; // ลบ bill ล่าสุด
                    bill[0].due_date = new Date(bill[0].due_date).toLocaleDateString('th-Th', { day: "numeric", month: "long", year: "numeric" });
                    res.cookie("total", bill[0].total, { httpOnly: true, maxAge: 3600000 });
                }

                const getMeter = `SELECT * FROM meters WHERE room_id = ? ORDER BY meter_id DESC LIMIT 1`;
                lesseeService.getData(getMeter, [room_id[0].room_id], (err, meter) => {
                    if (err) {return console.log(err);}
                    if (meter.length === 0) {console.log('no meter')}
                    console.log(meter)
                    return res.render('lessee/clientHome', {room : room, bill : bill, meter : meter})
                })
            })
        })
    })
});

router.get('/profile', (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_type != 1) {
        req.cookies.popup = "not lessee";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }
    lesseeService.getUserByID(req.cookies.user.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.length === 0) {console.log('no user')}

        if (user.user_img) {
            user.user_img = `data:image/png;base64,${user.user_img.toString('base64')}`;
        } else {
            user.user_img = '/image/defaultProfile.png';
        }

        console.log(user)
        
        const getRoom = `SELECT * FROM rooms WHERE room_id = ?;`;
        lesseeService.getData(getRoom, [user.room_id], (err, room) => {
            if (err) {return console.log(err.message)}
            if (room.length === 0) {console.log('no room');}

            console.log(room[0])
            return res.render('lessee/profile', { user : user, room : room[0] });
        })
        
    })
});

router.get('/payment-history', (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_type != 1) {
        req.cookies.popup = "not lessee";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }
    lesseeService.getUserByID(req.cookies.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        console.log(user)
        
        return res.render('lessee/payment-history-page', { data : user });
    })
});

router.get('/profile/edit', (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_type != 1) {
        req.cookies.popup = "not lessee";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }
    lesseeService.getUserByID(req.cookies.user.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.length === 0) {console.log('no user')}

        console.log(user)
        
        const getRoom = `SELECT * FROM rooms WHERE room_id = ?;`;
        lesseeService.getData(getRoom, [user.room_id], (err, room) => {
            if (err) {return console.log(err.message)}
            if (room.length === 0) {console.log('no room');}

            console.log(room[0])
            return res.render('lessee/profile-edit', { user : user, room : room[0] });
        })
        
    })
});

router.get('/uploadConfirmation', (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_type != 1) {
        req.cookies.popup = "not lessee";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }
    const status = req.cookies.user.user_status;
    console.log(req.cookies.total)

    res.render('lessee/uploadConfirmation', { status : status, total: req.cookies.total });
});

router.post('/upload', upload.single('payment_slip'), (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_type != 1) {
        req.cookies.popup = "not lessee";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }
    const billId = req.cookies.bill_id;
    const fileBuffer = req.file.buffer;

    lesseeService.savePaymentSlip(billId, fileBuffer, (err, result) => {
        res.redirect(`/lessee/uploadConfirmation?status=success&id=${result.lastID}`);
    });
});

router.post('/profile/update', upload.single('user_img'), (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_type != 1) {
        req.cookies.popup = "not lessee";
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }

    const userId = req.cookies.user.user_id;
    const { first_name, last_name, email, phone, user_name } = req.body;
    const userImg = req.file ? req.file.buffer : null;

    lesseeService.updateUserProfile(userId, first_name, last_name, userImg, email, phone, user_name, (err) => {
        if (err) {
            console.log('Error updating user profile:', err);
        }
        res.redirect('/lessee/profile');
    });

    
});

module.exports = router;