
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
        req.session.popup = "not login"
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {return res.send("User's not verified.");}

    
    const getUserRoom = ` SELECT room_id FROM users WHERE user_id = ?; `;
    lesseeService.getData(getUserRoom, [req.cookies.user.user_id], (err, room_id) => {
        if (err) {return console.log(err.message);}
        console.log(room_id[0].room_id);
        
        const getRoom = ` SELECT * FROM rooms r
                      INNER JOIN room_facilities rf USING (room_id)
                      INNER JOIN facilities f USING (facility_id)
                      WHERE room_id = ?; `;
        lesseeService.getData(getRoom, [room_id[0].room_id], (err, room) => {
            if (err) {return console.log(err.message);}
            console.log(room);

            const getBill = ` SELECT * FROM bills WHERE user_id = ? ORDER BY bill_id DESC LIMIT 1 `;
            lesseeService.getData(getBill, [req.cookies.user.user_id], (err, bill) => {
                if (err) {return console.log(err.message);}
                
                console.log(bill);
                return res.render('lessee/clientHome', {room : room, bill : bill})
            })
        })
    })
    // lesseeService.getUserByID(req.cookies.user.user_id, (err, user) => {
    //     if (err) {
    //         return res.status(500).json({ error: err.message });
    //     }

    //     return res.render('lessee/clientHome', {user : req.cookies.user});
    // })
});

router.get('/profile', (req, res) => {
    if (!req.cookies.user) {return res.redirect('/log-in');}
    console.log(req.cookies);
    lesseeService.getUserByID(req.cookies.user.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        console.log(user)
        return res.render('lessee/profile', { data : user });
    })
});

router.get('/payment-history', (req, res) => {
    // if (!req.cookies.user_id) {return res.redirect('/log-in');}
    // res.render('lessee/payment-history-page');
    lesseeService.getUserByID(req.cookies.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        console.log(user)
        
        return res.render('lessee/payment-history-page', { data : user });
    })
});

router.get('/profile/edit', (req, res) => {
    if (!req.cookies.user) {return res.redirect('/log-in');}
    res.render('lessee/profile-edit');
});

router.get('/uploadConfirmation', (req, res) => {
    if (!req.cookies.user.user_id) { return res.redirect('/log-in'); }
    const status = req.cookies.user.user_status;

    res.render('lessee/uploadConfirmation', { status });
});

router.post('/upload', upload.single('payment_slip'), (req, res) => {

    const billId = req.cookies.bill_id;
    const fileBuffer = req.file.buffer;

    lesseeService.savePaymentSlip(billId, fileBuffer, (err, result) => {
        res.redirect(`/lessee/uploadConfirmation?status=success&id=${result.lastID}`);
    });
});



module.exports = router;


// app.get('/', (req, res) => {
//     res.render('clientHome');
//   });
  
// app.get('/profile', (req, res) => {
//     res.render('profile');
// })

// app.get('/profile/edit', (req, res) => {
//     res.render('profile-edit');
// })