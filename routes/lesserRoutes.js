
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('dormitory.db', (err) =>{
    if (err) {
      return console.error(err.message);
    };
  });

  router.get('/', (req, res) => {
    const roomCount = ` SELECT count(rooms.room_id) as room_num, count(accounts.user_id) as room_lessee_num
                        FROM rooms
                        LEFT JOIN users
                        ON rooms.room_id = users.room_id
                        LEFT JOIN accounts
                        ON users.user_id = accounts.user_id AND accounts.user_status = 'Verify'`;
    const paymentCount = ` SELECT  COUNT(CASE WHEN bill_status = 'unpaid' THEN 1 END) AS unpaid_bills,
                                COUNT(CASE WHEN bill_status = 'unsend' THEN 1 END) AS unsend_bills,
                                COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending_payments
                            FROM bills
                            LEFT JOIN payments
                            USING (bill_id);`;
    const lesseeCount = ` SELECT count(users.user_id) as user_num, count(user_status) as user_verify_num
                          FROM users
                          LEFT JOIN accounts
                          ON users.user_id = accounts.user_id AND user_status = 'Verify';`;
    db.each(roomCount, (err, roomData) => {
        if (err) {
          console.log(err.message);
        }
        db.each(paymentCount, (err, paymentData) => {
          if (err) {
            console.log(err.message);
          }
          db.each(lesseeCount, (err, lesseeData) => {
            if (err) {
              console.log(err.message);
            }
            console.log({
              roomData: roomData,
              paymentData: paymentData,
              lesseeData: lesseeData,
            })
            res.render('lesser/lesserHome', {
              roomData: roomData,
              paymentData: paymentData,
              lesseeData: lesseeData,
            });
        });
      });
    });
  });

router.get('/rooms', (req, res) => {
    const query = ` SELECT  room_id, room_number, user_id, user_status,
                            COUNT(CASE WHEN bill_status = 'unpaid' THEN 1 END) AS unpaid_bills,
                            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending_payments
                    FROM rooms
                    LEFT JOIN users
                    USING (room_id)
                    LEFT JOIN accounts
                    USING (user_id)
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
    const statusQuery = ` SELECT user_id, user_status,
                            COUNT(CASE WHEN bill_status = 'unpaid' THEN 1 END) AS unpaid_bills,
                            COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) AS pending_payments
                          FROM rooms
                          LEFT JOIN users
                          USING (room_id)
                          LEFT JOIN accounts
                          USING (user_id)
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
        res.render('lesser/roomDetail', {room : room});
      });
    });
});

router.post('/update-room/:id', (req, res) => {
  const room_id = req.params.id;
  const { room_number, building, level, room_type, room_size, rent, elect_unit, water_unit} = req.body;
  let facilities = req.body.facilities || [];
  if (!Array.isArray(facilities)) {
      facilities = [facilities];
  }
  const facilities_id = facilities.map(facility =>{
    switch(facility){
      case "air-conditioner":
        return 1;
      case "fan":
        return 2;
      case "water-heater":
        return 3;
      case "balcony":
        return 4;
      case "internet":
        return 5;
    }
  })

  const updateRoom = `UPDATE rooms
                      SET room_number = '${room_number}', building = '${building}', floor = ${level}, type = '${room_type}',
                          size = ${room_size}, rent = ${rent}, elect_per_unit = ${elect_unit}, water_per_unit = ${water_unit}
                      WHERE room_id = ${room_id};`;
  const deleteFacilities = `DELETE FROM room_facilities
                            WHERE room_id = ${room_id};`;
  let insertFacilities = `INSERT INTO room_facilities (room_id, facility_id) 
                          VALUES`;

  db.run(updateRoom, function(err) {
      if (err) {
        console.log(err.message);
      }
      db.run(deleteFacilities, function(err) {
        if (err) {
          console.log(err.message);
        }
        if(facilities_id.length>0){
          for(let i=0; i<facilities_id.length-1; i++){
            insertFacilities+=`(${room_id}, ${facilities_id[i]}), `
          }
          insertFacilities+=`(${room_id}, ${facilities_id[facilities_id.length-1]}); `
          
          db.run(insertFacilities, function(err) {
            if (err) {
              console.log(err.message);
            }
            res.redirect(`/lesser/rooms/${room_id}`);
          });
        }else{
          res.redirect(`/lesser/rooms/${room_id}`);
        }
    });
  });
});

router.post('/save-bill', (req, res) => {
  const { user_id, month, due_date, rent, elect_bill, water_bill } = req.body;

  const insertBill = `INSERT INTO bills (user_id, month, bill_status, rent, elect_bill, water_bill, due_date)
                      VALUES (${user_id}, '${month}', 'unsend', ${rent}, ${elect_bill}, ${water_bill}, '${due_date}');`;

  db.run(insertBill, function(err) {
      if (err) {
        console.log(err.message);
        return res.json({ success: false, message: err.message});
      }
      res.json({ success: true });
  });
});

router.post('/save-meter', (req, res) => {
  const { room_id, elect, water, meterMonth } = req.body;
  const insertMeter = `INSERT INTO meters (room_id, meter_water, meter_elect, meter_month, updated_at)
                      VALUES (${room_id}, ${water}, ${elect}, '${meterMonth}', CURRENT_TIMESTAMP);`;
  db.run(insertMeter, function(err) {
      if (err) {
          return res.json({ success: false, message: err.message});
      }
      res.json({ success: true });
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

router.put('/remove-renter', (req, res) => {
  const { user_id } = req.body;

  const updateUser = `UPDATE users
                      SET room_id = null
                      WHERE user_id = ${user_id}`;

  db.run(updateUser, function(err) {
      if (err) {
        console.log(err.message);
        return res.json({ success: false, message: err.message});
      }
      res.json({ success: true });
  });
});

router.get('/verify-payment', (req, res) => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const month = req.query.month || date.toISOString().slice(0, 7);
  const query = ` SELECT month, room_number, room_id, first_name, last_name, bills.rent, elect_bill, water_bill, payment_status, payment_date, payment_slip, bill_id, payment_id
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

router.put('/update-payment', (req, res) => {
  const { payment_id, bill_id, approved } = req.body;
  let payment_status, bill_status;
  if (approved){
    payment_status = "verified";
  }else{
    payment_status = "rejected";
    bill_status = "unpaid";
  }
  
  const updatePayment = `UPDATE payments
                      SET payment_status = '${payment_status}'
                      WHERE payment_id = ${payment_id};`;
  const updateBill = `UPDATE bills
                      SET bill_status = '${bill_status}'
                      WHERE bill_id = ${bill_id};`;
  db.run(updatePayment, function(err) {
      if (err) {
        console.log("updatePayment: "+err.message);
        return res.json({ success: false, message: err.message});
      }
      if (!approved){
        db.run(updateBill, function(err) {
          if (err) {
            console.log("updateBill: "+err.message);
            return res.json({ success: false, message: err.message});
          }
          res.json({ success: true, message: "ปฏิเสธใบเสร็จเรียบร้อย!" });
        });
      }else{
        res.json({ success: true, message: "อนุมัติใบเสร็จเรียบร้อย!" });
      }
  });
});

router.get('/bills', (req, res) => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  let month = req.query.month || date.toISOString().slice(0, 7);

  const next = new Date(month); 
  next.setMonth(next.getMonth() + 1);
  let nextMonth = next.toISOString().slice(0, 7);
  const query = ` SELECT *
                  FROM users
                  LEFT JOIN bills
                  ON users.user_id = bills.user_id AND bills.month = '${month}'
                  LEFT JOIN accounts
                  USING (user_id)
                  LEFT JOIN rooms
                  USING (room_id)
                  WHERE date_start < '${nextMonth}' AND user_status = 'Verify'
                  ORDER BY bill_status desc, bill_id;`;
  db.all(query, (err, rows) => {
    if (err) {
      console.log(err.message);
    }
    console.log({ bills : rows })
    if (rows.length === 0) {
      return res.render('lesser/showBills', { bills: [{notFound: true}], billMonth: `${month}`});
    }
    res.render('lesser/showBills', { bills : rows, billMonth: `${month}`});
  });
});


router.post('/sendBills', (req, res) => {
  const month = req.body.month;
  let bill_ids = req.body.bill_ids;
  if (!Array.isArray(bill_ids)) {
    bill_ids = [bill_ids];
  }
  const updateBills = `UPDATE bills
                      SET bill_status = 'unpaid'
                      WHERE bill_id IN (${bill_ids.join(',')});`;
  db.run(updateBills, function(err) {
    if (err) {
      console.log(err.message);
    }
    res.redirect(`/lesser/bills?month=${month}`);
  });
});

/*room_id, room_number, user_id, first_name, last_name, phone, date_end, user_status*/
router.get('/lessee-info', (req, res) => {
  const query = ` SELECT * 
                  FROM users
                  LEFT JOIN rooms
                  USING (room_id)
                  LEFT JOIN accounts
                  USING (user_id)
                  ORDER BY room_number`
  db.all(query, (err, rows) => {
      if (err) {
          return res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
      }
      res.render('lesser/customer-info', { customers: rows });
  });
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
  if (!room.user_id || room.user_status != "Verify") {
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
