const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('dormitory.db');

// ฟังก์ชันในการค้นหาผู้ใช้จากฐานข้อมูล
const getUserByID = (id, callback) => {
    db.get(`SELECT printf('%03d', user_id) AS user_id, user_name, first_name, last_name, email, phone, room_id, date_start, date_end, user_img FROM accounts
            INNER JOIN users USING (user_id)
            WHERE user_id = ?;`, [id], callback);
};

const savePaymentSlip = (billID, fileBuffer, callback) => {
    const paymentStatus = 'pending';
    const paymentDate = new Date().toISOString();
    const query = `INSERT INTO payments (bill_id, payment_slip, payment_status, payment_date) 
                   VALUES (?, ?, ?, ?)`;

    db.run(query, [billID, fileBuffer, paymentStatus, paymentDate], function (err) {
        if (err) {
            console.log('Error saving payment slip to database:', err);
            return callback(err);
        }
        callback(null, { lastID: this.lastID });
    });
};

const getData = (query, data, callback) => {
  db.all(query, data, callback);
};

const updateData = (query, data, callback) => {
  db.run(query, data, callback);
};

const updateUserProfile = (userId, firstName, lastName, userImg, email, phone, userName, callback) => {
  const updateUserQuery = `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ? ${userImg ? ', user_img = ?' : ''} WHERE user_id = ?`;
  const updateAccountQuery = `UPDATE accounts SET user_name = ? WHERE user_id = ?`;

  let userParams = userImg ? [firstName, lastName, email, phone, userImg, userId] : [firstName, lastName, email, phone, userId];
  let accountParams = [userName, userId];

  db.serialize(() => {
      db.run(updateUserQuery, userParams, (err) => {
          if (err) return callback(err);

          db.run(updateAccountQuery, accountParams, (err) => {
              if (err) return callback(err);
              
              callback(null);
          });
      });
  });
};

module.exports = { getUserByID, savePaymentSlip, getData, updateData, updateUserProfile };
