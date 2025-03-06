const express = require("express");
const path = require("path");
const port = 3000;
const sqlite = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const authController = require('./controllers/authController');

// creating the Express server
const app = express();

// ตั้งค่า middleware สำหรับ parsing ข้อมูล body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ejs template
app.set('view engine', 'ejs');

// cookie - parser
app.use(cookieParser());

// session
app.use(session({
  secret: 'secret',
  resave: true, // บันทึก session ทุกครั้งที่มีการร้องขอ
  saveUninitialized: true, // บันทึก session ทุกครั้งที่มีการร้องขอ โดยไม่คำนึงว่า session จะมีข้อมูลหรือไม่
}));

// static folder
app.use(express.static("public"));
app.use('/lessee', require('./routes/lesseeRoutes'));
app.use('/lesser', require('./routes/lesserRoutes'));

//routing path
app.get("/", (req, res) => {
  res.render('login/landingPage');
});

app.get('/log-in', (req, res) => {
  const popup = req.session.popup;
  delete req.session.popup;
  res.render('login/log_in_page', { popup : popup });
})

app.get('/register', (req, res) => {
  const popup = req.session.popup;
  let form = req.session.form;
  delete req.session.popup;
  delete req.session.form;
  console.log(popup)
  if (!form) {form = {};}
  res.render('login/register_page', { popup : popup, data : form });
})

app.get('/logout', (req, res) => {
  res.clearCookie("user");
  return res.redirect('/log-in');
})

app.post('/create_acc', (req, res) => {
  bcrypt.hash(req.body.pwd1, 10, (err, hash) => {
    if (err) {return console.log(err.message);}
    let userData = {
    fn: req.body.firstName,
    ln: req.body.lastName,
    citizenid: req.body.citizen,
    phone: req.body.phone,
    email: req.body.email,
    room: req.body.roomNum,
    date_start: req.body.date_start,
    date_end: req.body.date_end,
    type: req.body.rent,
    uname: req.body.uname,
    pwd: hash,
    };

    if (req.body.pwd1 != req.body.pwd2) {return res.send('Password not matched');}

    authController.createUser(userData, req, res);
  })
});

app.post('/login', authController.loginUser);

app.listen(3000, () => {
  console.log(`Server running at http://localhost:${port}`);
});