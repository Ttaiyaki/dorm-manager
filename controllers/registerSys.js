const sqlite = require('sqlite3').verbose();

// connect to SQLite database
let db = new sqlite.Database('userAccount.db', (err) =>{
  if (err) {
    return console.error(err.message);
  };
  console.log('Connected to the userAccount database.');
});


export function create_account(userData){
    let sql = `INSERT INTO users(fist_name, last_name, citizen_id, phone_number) VALUES ('${userData.fn}', '${userData.ln}', '${userData.citizenid}', '${userData.phone}');`;
    console.log(sql);
    conn.query(sql, function(err, result){
        if (err) throw err;

    });
};