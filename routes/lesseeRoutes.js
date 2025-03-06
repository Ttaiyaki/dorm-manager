
const express = require('express');
const router = express.Router();
const lesseeService = require('../services/lesseeService')

router.get('/', (req, res) => {
    console.log(req.cookies.user);
    if (!req.cookies.user) {
        res.clearCookie('user');
        req.session.popup = "not login"
        return res.redirect('/log-in');
    }
    if (req.cookies.user.user_status != "Verify") {return res.send("User's not verified.");}
    lesseeService.getUserByID(req.cookies.user.user_id, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        return res.render('lessee/clientHome');
    })
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

router.get('/profile/edit', (req, res) => {
    if (!req.cookies.user) {return res.redirect('/log-in');}
    res.render('lessee/profile-edit');
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