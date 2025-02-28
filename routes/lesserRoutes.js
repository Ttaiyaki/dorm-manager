
const express = require('express');
const router = express.Router();

router.get('/rooms', (req, res) => {
    res.render('lesser/roomList');
});

router.get('/rooms/:id', (req, res) => {
    res.render('lesser/roomDetail');
});

router.get('/verify-payment', (req, res) => {
    res.render('lesser/verifyPayment');
});

module.exports = router;

// app.get('/rooms', (req, res) => {
//     res.render('roomList');
//   })

// app.get('/rooms/:id', (req, res) => {
//     res.render('roomDetail');
// })

// app.get('/verify-payment', (req, res) => {
//     res.render('verifyPayment');
// })