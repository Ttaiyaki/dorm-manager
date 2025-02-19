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
app.get("/", (req, res) => { // testing server
  res.sendFile(path.join(__dirname, "/public/test.html"));
});

app.get('/home', (req, res) => {
  res.render('clientHome');
})

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});