
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('test.db', (err) =>{
    if (err) {
      return console.error(err.message);
    };
  });

router.get('/', (req, res) => {
  res.render('lesser/lesserHome');
});

router.get('/rooms', (req, res) => {
    const query = ` SELECT  room_id, room_number, user_id,
                            COUNT(CASE WHEN bill_status = 'unpaid' THEN 1 END) AS unpaid_bills,
                            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending_payments
                    FROM rooms
                    LEFT JOIN users
                    USING (room_id)
                    LEFT JOIN bills
                    USING (user_id)
                    LEFT JOIN payments
                    USING (bill_id)
                    GROUP BY rooms.room_id
                    ORDER BY rooms.room_number;`;
    db.all(query, (err, rows) => {
      if (err) {
        console.log(err.message);
      }
      const rooms = rows.map(room => ({
          ...room,
          status: getRoomStatus(room)
      }));
      res.render('lesser/roomList', { rooms : rooms });
    });
    
});

router.get('/rooms/:id', (req, res) => {
    const statusQuery = ` SELECT user_id,
                            COUNT(CASE WHEN bill_status = 'unpaid' THEN 1 END) AS unpaid_bills,
                            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending_payments
                          FROM rooms
                          LEFT JOIN users
                          USING (room_id)
                          LEFT JOIN bills
                          USING (user_id)
                          LEFT JOIN payments
                          USING (bill_id)
                          WHERE room_id = ${req.params.id}
                          GROUP BY rooms.room_id
                    `;
    const infoQuery = ` SELECT *
                        FROM rooms
                        LEFT JOIN room_facilities 
                        USING (room_id)
                        LEFT JOIN facilities 
                        USING (facility_id)
                        LEFT JOIN users 
                        USING (room_id)
                        LEFT JOIN (
                            SELECT *
                            FROM meters
                            WHERE room_id = ${req.params.id}
                            ORDER BY meter_month DESC LIMIT 1
                        ) AS latest_meter 
                        USING (room_id)
                        WHERE rooms.room_id = ${req.params.id};`
    db.get(statusQuery, (err, statusRow) => {
      if (err) {
        console.log(err.message);
      }
      db.all(infoQuery, (err, infos) => {
        if (err) {
          console.log(err.message);
        }
        const room = {
          ...infos[0],
          status: getRoomStatus(statusRow),
          facilities: [...new Set(infos.map(info => info.name))],
        };
        console.log({ room : room});
        res.render('lesser/roomDetail', {room : room});
      });
    });
});

router.get('/get-meter', (req, res) => {
  const query = ` SELECT room_id, meter_id, meter_water, meter_elect, meter_month, updated_at
                  FROM rooms
                  LEFT JOIN meters
                  USING (room_id)
                  WHERE room_id = ${req.query.room_id} AND meter_month <= '${req.query.month}'
                  ORDER BY meter_month DESC LIMIT 2;`;
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    let result = [];

    rows.forEach(row => {
      result.push({
        meter_elect: row.meter_elect,
        meter_water: row.meter_water,
        meter_month: row.meter_month
      });
    });

    res.json(result);
  });
  
});

router.get('/rooms/:id/pay-history', (req, res) => {
  const query = ` SELECT room_id, room_number, first_name, last_name, bill_status, month, bills.rent, water_bill, elect_bill, due_date, payment_status, payment_date
                  FROM rooms
                  LEFT JOIN users
                  USING (room_id)
                  LEFT JOIN bills
                  USING (user_id)
                  LEFT JOIN payments
                  USING (bill_id)
                  WHERE room_id = ${req.params.id};`;
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    res.render('lesser/payHistory', { histories : rows });
  });
});

router.get('/verify-payment', (req, res) => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const month = req.query.month || date.toISOString().slice(0, 7);
  const query = ` SELECT month, room_number, room_id, first_name, last_name, bills.rent, elect_bill, water_bill, payment_status, payment_date, payment_slip, bill_id
                  FROM payments
                  LEFT JOIN bills
                  USING (bill_id)
                  LEFT JOIN users
                  USING (user_id)
                  LEFT JOIN rooms
                  USING (room_id)
                  WHERE month = '${month}'
                  ORDER BY room_number;`;
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    if (rows.length === 0) {
      return res.render('lesser/verifyPayment', { payments: [{month: month, notFound: true}] });
    }
    rows.forEach(row => {
      if (row.payment_slip) {
        row.payment_slip = `data:image/png;base64,${row.payment_slip.toString('base64')}`;
      }
    });
    res.render('lesser/verifyPayment', { payments : rows });
  });
});


router.get('/lessee-info', (req, res) => {
  res.render('lesser/customer-info');
});



router.get('/user_img/:id', (req, res) => {
  const query = ` SELECT user_img
                  FROM users
                  WHERE user_id = ${req.params.id};
                  `;
  db.get(query, (err, row) => {
    if (err) {
      console.log(err.message);
    }
    res.set('Content-Type', 'image/jpg');
    res.send(row.user_img);
  });
});



const getRoomStatus = (room) => {
  let status;
  if (!room.user_id) {
      status = 'ห้องว่าง';
  } else {
      if (room.pending_payments) {
          status = 'รอตรวจสอบการชำระ';
      } else if (room.unpaid_bills) {
          status = 'ค้างชำระ';
      } else {
          status = 'มีผู้เช่า';
      }
  }
  return status;
};

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