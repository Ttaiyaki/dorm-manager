const express = require("express");
const path = require("path");
const port = 3000;
const sqlite = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { create_account } = require("./controllers/registerSys");
const { createDiffieHellmanGroup } = require("crypto");

// creating the Express server
const app = express();

// ตั้งค่า middleware สำหรับ parsing ข้อมูล body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static folder
app.use(express.static("public"));
app.use('/lessee', require('./routes/lesseeRoutes'));
app.use('/lesser', require('./routes/lesserRoutes'));

// ejs template
app.set('view engine', 'ejs');

// cookie - parser
app.use(cookieParser());


//routing path
app.get("/", (req, res) => {
  res.render('login/landingPage');
});

app.get('/log-in', (req, res) => {
  res.render('login/log_in_page');
})

app.get('/register', (req, res) => {
  res.render('login/register_page');
})

app.post('/create_acc', (req, res) => {
  let userData = {
    fn: req.body.firstName,
    ln: req.body.lastName,
    citizenid: req.body.citizen,
    phone: req.body.phone,
    email: req.body.email,
    room: req.body.roomNum,
    checkIn: req.body.checkInDate,
    type: req.body.rent,
    uname: req.body.username,
    pwd: req.body.cpwd,
  };
  console.log(userData);
  create_account(userData);
  res.redirect('/');
});

app.post('/login', require('./controllers/authController').loginUser);

app.listen(3000, () => {
  console.log(`Server running at http://localhost:${port}`);
});