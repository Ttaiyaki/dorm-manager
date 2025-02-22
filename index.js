const express = require("express");
const path = require("path");
const port = 3000;
const sqlite = require('sqlite3').verbose();

// creating the Express server
const app = express();

// connect to SQLite database
// let db = new sqlite.Database('file.db', (err) =>{
//   if (err) {
//     return console.error(err.message);
//   };
//   console.log('Connected to the SQLite database.');
// });

// static folder
app.use(express.static("public"));

// ejs template
app.set('view engine', 'ejs');


//routing path
app.get("/", (req, res) => {
  res.render('landingPage');
});

app.get('/log-in', (req, res) => {
  res.render('log_in_page');
})

app.get('/register', (req, res) => {
  res.render('register_page');
})

app.get('/home', (req, res) => {
  res.render('clientHome');
});

app.get('/profile', (req, res) => {
  res.render('profile');
})

app.get('/profile/edit', (req, res) => {
  res.render('profile-edit');
})

app.get('/rooms', (req, res) => {
  res.render('roomList');
})
app.get('/rooms/:id', (req, res) => {
  res.render('roomDetail');
})
app.get('/verify-payment', (req, res) => {
  res.render('verifyPayment');
})

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});