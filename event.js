const express = require('express');
const uuiv1 = require('uuid/v1');
const _ = require('lodash');

const db = require('./database');

let router = express.Router();

const newEvent = async (request, response) => {
    let uuid = uuiv1();
    let name = await request.body.name;
    let desc = await request.body.desc;
    let date = await request.body.date;

    let con = db.getDb();
    let sql = "INSERT INTO events (event_uuid, eventName, eventDescription, eventDate) VALUES (?, ?, ?, ?)";
    let values = [uuid, name, desc, date];

    con.query(sql, values, (err, result) => {
        if (err) {
            response.send("Unable to create new event");
            return;
        }
        response.redirect("/admin/events");
    });
};

const editEvent = async (request, response) => {
    let name = await request.body.name;
    let date = await request.body.date;
    let desc = await request.body.desc;
    let event_uuid = await request.body.event_uuid;

    let con = db.getDb();
    let sql = "UPDATE events SET eventName=?, eventDate=?, eventDescription=? WHERE event_uuid=?";
    let values = [name, date, desc, event_uuid];

    console.log(sql);
    console.log(values);

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        console.log("Successfully updated event");

        return response.redirect(`/admin/events`);
    });
};

const deleteEvent = async (request, response) => {
    let event_uuid = await request.body.event_uuid;

    let con = db.getDb();
    let sql = "DELETE FROM events WHERE event_uuid=?";

    con.query(sql, event_uuid, (err, result) => {
        if (err) {
            throw err;
        }

        console.log(`Deleted event ${event_uuid}`);

        return response.redirect('/admin/events');
    });
};

const addAttendee = async (request, response) => {
    let email = await request.body.email;
    let event_uuid = await request.body.event_uuid;
    let attendance_uuid = uuiv1();

    let con = db.getDb();
    let sql = "INSERT INTO UserEventStatus (attendance_uuid, event_uuid, account_uuid) VALUES (?, ?, (SELECT account_uuid FROM accounts WHERE email=?))";
    let values = [attendance_uuid, event_uuid, email];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        return response.redirect(`/admin/events/${event_uuid}`);
    });
};

const deleteAttendee = async (request, response) => {
    let account_uuid = await request.body.accountID;
    let event_uuid = await request.body.event_uuid;

    let con = db.getDb();
    let sql = "DELETE FROM UserEventStatus WHERE account_uuid=? AND event_uuid=?";
    let values = [account_uuid, event_uuid];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        return response.redirect(`/admin/events/${event_uuid}`);
    });
};

const eventRSVP = async (request, response) => {
    let rsvps = request.body.event_uuids;

    if (typeof rsvps === "string") {
        rsvps = [rsvps];
    }

    console.log(rsvps);

    let account_uuid = request.body.account_uuid;

    let con = db.getDb();
    let sql = '';
    let values = [];

    for (let i=0; i<rsvps.length; i++){
        sql = "INSERT INTO UserEventStatus (attendance_uuid, event_uuid, account_uuid) VALUES (?, ?, ?)";
        values = [uuiv1(), rsvps[i], account_uuid];

        con.query(sql, values, (err, result) => {
            if (err){
                console.log(err);
            }
            return;
        });
    }
    return response.redirect('/rsvp');
};

const cancelRSVP = async (request, response) => {
    let event_uuid = await request.body.event_uuid;
    let account_uuid = await request.body.account_uuid;

    let con = db.getDb();
    let sql = "DELETE FROM UserEventStatus WHERE event_uuid=? AND account_uuid=?";
    let values = [event_uuid, account_uuid];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        response.redirect('/rsvp');
    })
};

router.post("/newEvent", newEvent);
router.post('/editEvent', editEvent);
router.post('/deleteEvent', deleteEvent);
router.post('/addAttendee', addAttendee);
router.post('/deleteAttendee', deleteAttendee);
router.post("/eventRSVP", eventRSVP);
router.post('/cancelRSVP', cancelRSVP);

module.exports = router;