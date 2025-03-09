
const express = require('express');
const router = express.Router();
const lesseeService = require('../services/lesseeService')

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const checkAuthen = (req, res, next) => {
    if (typeof(req.cookies.user)=="undefined") {
        req.session.popup = "not login";
        return res.redirect('/log-in');
    }
    else if (req.cookies.user.user_type != 1) {
        req.session.popup = "not lessee";
        return res.redirect('/log-in');
    }
    else if (req.cookies.user.user_status != "Verify") {
        req.session.popup = "user not verify";
        return res.redirect('/log-in');
    }

    next();
}

router.get('/', checkAuthen, (req, res) => {

    const getUserRoom = ` SELECT room_id FROM users WHERE user_id = ?; `;
    lesseeService.getData(getUserRoom, [req.cookies.user.user_id], (err, room_id) => {
        if (err) {return console.log(err.message);}
        if (room_id.length === 0) {
            return 
        }
        res.cookie('room_id', room_id[0].room_id, { httpOnly: true, maxAge: 3600000 });
        
        const getRoom = ` SELECT * FROM rooms r
                      INNER JOIN room_facilities rf USING (room_id)
                      INNER JOIN facilities f USING (facility_id)
                      WHERE room_id = ?; `;
        lesseeService.getData(getRoom, [room_id[0].room_id], (err, room) => {
            if (err) {return console.log(err.message);}
            if (room.length === 0) {console.log('no room')}

            const getBill = ` SELECT * FROM bills WHERE user_id = ? AND bill_status = 'unpaid' ORDER BY bill_id DESC `;
            lesseeService.getData(getBill, [req.cookies.user.user_id], (err, bill) => {
                if (err) {return console.log(err.message);}
                if (bill.length === 0) {console.log('no bill')}
                else {
                    const date = new Date(bill[0].month);
                    const monthName = date.toLocaleDateString('th-Th', { month: 'long' }); // แปลงเดือนเป็นชื่อเดือนไทย
                    bill[0].month = monthName;

                    bill[0].current = bill[0].rent + bill[0].elect_bill + bill[0].water_bill // รวมค่าน้ำค่าไฟ
                    bill[0].due_date = new Date(bill[0].due_date).toLocaleDateString('th-Th', { day: "numeric", month: "long", year: "numeric" });
                    req.session.payment = bill[0].current;
                    req.session.billID = bill[0].bill_id;
                }

                const getMeter = `SELECT * FROM meters WHERE room_id = ? ORDER BY meter_id DESC LIMIT 1`;
                lesseeService.getData(getMeter, [room_id[0].room_id], (err, meter) => {
                    if (err) {return console.log(err);}
                    if (meter.length === 0) {console.log('no meter')}

                    const popup = req.session.popup;
                    delete req.session.popup;
                    console.log(`User ${req.cookies.user.user_id} has connected to system.`);
                    return res.render('lessee/clientHome', {room : room, bills : bill, meter : meter, popup : popup});
                })
            })
        })
    })
});

router.get('/profile', checkAuthen, (req, res) => {

    lesseeService.getUserByID(req.cookies.user.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.length === 0) {console.log('no user')}

        if (user.user_img) {
            user.user_img = `data:image/png;base64,${user.user_img.toString('base64')}`;
        } else {
            user.user_img = '/image/defaultProfile.jpg';
        }
        
        const getRoom = `SELECT * FROM rooms WHERE room_id = ?;`;
        lesseeService.getData(getRoom, [user.room_id], (err, room) => {
            if (err) {return console.log(err.message)}
            if (room.length === 0) {console.log('no room');}

            const popup = req.session.popup;
            delete req.session.popup;
            return res.render('lessee/profile', { user : user, room : room[0], popup : popup });
        })
        
    })
});

router.get('/payment-history', checkAuthen, (req, res) => {

    const getBill = `SELECT * FROM bills
                     WHERE user_id = ? AND bill_status != 'unsend'
                     ORDER BY bill_id`;
    lesseeService.getData(getBill, [req.cookies.user.user_id], (err, bills) => {
        if (err) {return console.log(err.message);}
        if (bills.length === 0) {console.log('no bills');}
        
        let billID = []
        bills.forEach(bill => {
            billID.push(bill.bill_id);

            if (bill.bill_status == "unpaid") {
                bill.bill_status = "ยังไม่จ่าย"
            } else if (bill.bill_status == "paid") {
                bill.bill_status = "จ่ายแล้ว"
            }
        })

        const getPayment = `SELECT * FROM payments WHERE bill_id IN (${billID.map(() => '?').join(', ')});`;
        lesseeService.getData(getPayment, billID, (err, payments) => {
            if (err) {return console.log(err.message);}
            if (payments) {
                payments.forEach(payment => {
                    if (payment.payment_slip) {
                        payment.payment_slip = `data:image/png;base64,${payment.payment_slip.toString('base64')}`;
                    }
                })
            }

            const getRoom = `SELECT * FROM rooms WHERE room_id = ?;`;
            lesseeService.getData(getRoom, [req.cookies.room_id], (err, rooms) => {
                if (err) {return console.log(err.message);}

                const getMeter = `SELECT * FROM meters WHERE room_id = ?;`;
                lesseeService.getData(getMeter, [req.cookies.room_id], (err, meters) => {
                    if (err) {return console.log(err.message);}
                    bills.forEach(bill => {
                        payments.forEach(payment => {
                            if (bill.bill_id == payment.bill_id) {
                                bill.payment = payment;
                            }
                        })
                        bill.room = rooms[0];

                        meters.forEach(meter => {
                            if (meter.meter_month == bill.month) {
                                bill.meter = meter
                            }
                        })
                        const date = new Date(bill.month);
                        bill.month = date.toLocaleDateString('th-TH', { month: 'long' });
                        bill.year = date.getFullYear();
                    })

                    const year = req.query.year || new Date().getFullYear();
                    return res.render('lessee/payment-history-page', { bills : bills, payments : payments, year : year });
                })
            })
        })
    })
});

router.get('/profile/edit', checkAuthen, (req, res) => {
    lesseeService.getUserByID(req.cookies.user.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user.length === 0) {console.log('no user')}

        if (user.user_img) {
            user.user_img = `data:image/png;base64,${user.user_img.toString('base64')}`;
        } else {
            user.user_img = '/image/defaultProfile.jpg';
        }
        
        const getRoom = `SELECT * FROM rooms WHERE room_id = ?;`;
        lesseeService.getData(getRoom, [user.room_id], (err, room) => {
            if (err) {return console.log(err.message)}
            if (room.length === 0) {console.log('no room');}

            return res.render('lessee/profile-edit', { user : user, room : room[0] });
        })
        
    })
});

router.get('/uploadConfirmation', checkAuthen, (req, res) => {
    const payment = req.session.payment;
    res.render('lessee/uploadConfirmation', { payment : payment });
});

router.post('/upload', checkAuthen, upload.single('payment_slip'), (req, res) => {
    const billId = req.session.billID;
    const fileBuffer = req.file.buffer;

    lesseeService.savePaymentSlip(billId, fileBuffer, (err, result) => {
        if (err) {return console.log(err.message);}

        const setPaid = `UPDATE bills SET bill_status = 'paid' WHERE bill_id = ?`;
        lesseeService.updateData(setPaid, [billId], (err) => {
            if (err) {return console.log(err.message);}

            req.session.popup = "payment success";
            console.log(`User ${req.cookies.user.user_id}'s payment successful.`);
            return res.redirect('/lessee');
            // return res.redirect(`/lessee/uploadConfirmation?status=success&id=${result.lastID}`);
        })
    });
});

router.post('/profile/update', checkAuthen, upload.single('user_img'), (req, res) => {

    const userId = req.cookies.user.user_id;
    const { first_name, last_name, email, phone, user_name } = req.body;
    const userImg = req.file ? req.file.buffer : null;

    lesseeService.updateUserProfile(userId, first_name, last_name, userImg, email, phone, user_name, (err) => {
        if (err) {
            console.log('Error updating user profile:', err);
        }
        req.session.popup = "update profile success";
        console.log(`User ${req.cookies.user.user_id} has updated profile successfully.`);
        res.redirect('/lessee/profile');
    });
});

router.post('/set-payment', checkAuthen, (req, res) => {
    req.session.payment = req.body.money;
    req.session.billID = req.body.billID;

    res.json({
        success: true,
        message: "Payment saved to session successfully!"
    });
})

module.exports = router;