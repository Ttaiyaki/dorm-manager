const express = require("express");
const path = require("path");
const port = 3000;
const sqlite = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')

// creating the Express server
const app = express();

// connect to SQLite database
// let db = new sqlite.Database('dormitory.db', (err) =>{
//   if (err) {
//     return console.error(err.message);
//   };
//   console.log('Connected to the SQLite database.');
// });

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

app.post('/login', require('./controllers/authController').loginUser);

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});