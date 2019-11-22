const db = require("./database.js");

const express = require("express");
const router = express.Router();
const uuidv4 = require('uuid/v4');

const addSpeaker = async (request, response) => {
    let speaker_id = uuidv4();

    let firstName = await request.body.fname;
    let lastName = await request.body.lname;

    let biography = await request.body.biography;
    let topic = await request.body.topic;
    let time = await request.body.time;
    let location = await request.body.location;
    
    let con = db.getDb();

    let sql = "INSERT INTO speakers (speaker_id, firstName, lastName, biography, topic, time, location) VALUES (?, ?, ?, ?, ?, ?, ?)";
    let values = [speaker_id, firstName, lastName, biography, topic, time, location];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }
        console.log(`Added new speaker: ${firstName} ${lastName}`);
    });

    return response.redirect("/admin/webcontent/speakers");   
};

/*
ADMIN PANEL - Speaker page.
Edits Speaker Information
*/
const editSpeaker = (request, response) => {
    let fName = request.body.fname;
    let lName = request.body.lname;
    let topic = request.body.topic;
    let location = request.body.location;
    let time = request.body.time;
    let bio = request.body.biography;
    let speaker_id = request.body.speaker_id;


    let con = db.getDb();
    let sql = "UPDATE speakers SET lastName=?, firstName=?, topic=?, time=?, location=?, biography=? WHERE speaker_id=?";
    let values = [lName, fName, topic, time, location, bio, speaker_id];

    con.query(sql, values, (err, result) => {
        if (err) throw (err);

        return response.redirect('/admin/webcontent/speakers');
    });
};

/*
ADMIN PANEL - Speaker page.
Deletes Speaker 
*/
const deleteSpeaker = async (request, response) => {
    let speaker_uuid = await request.body.speaker_uuid;

    let con = db.getDb();
    let sql = "DELETE FROM speakers WHERE speaker_id=?";

    con.query(sql, speaker_uuid, (err, result) => {
        if (err) throw (err);
        console.log(`Deleted speaker ${speaker_uuid}`);

        return response.redirect('/admin/webcontent/speakers');
    });
};

router.post("/addSpeaker", addSpeaker);
router.post('/editSpeaker', editSpeaker);
router.post('/deleteSpeaker', deleteSpeaker);

module.exports = router;