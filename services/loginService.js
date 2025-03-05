const sqlite = require('sqlite3').verbose();

// connect to SQLite database
let db = new sqlite.Database('dormitory.db', (err) =>{
  if (err) {
    return console.error(err.message);
  };
  console.log('Connected to the userAccount database.');
});

const getData = (query, data, callback) => {
  db.all(query, data, callback);
};

const updateData = (query, data, callback) => {
  db.run(query, data, callback);
};

module.exports = { getData, updateData };