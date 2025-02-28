
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('lessee/clientHome');
});

router.get('/profile', (req, res) => {
    res.render('lessee/profile');
});

router.get('/profile/edit', (req, res) => {
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