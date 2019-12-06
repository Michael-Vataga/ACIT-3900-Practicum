const db = require("./database.js");

const express = require("express");
const router = express.Router();
const uuidv4 = require('uuid/v4');
const fs = require("fs");
const formidable = require('formidable');

/*
ADMIN PANEL - Speaker page.
Adds Speaker
*/
const addSpeaker = async (request, response) => {
    let form = new formidable.IncomingForm();
    let value_array = [];
    let path = './public/images/speakers/';
    let filename = 'default_speaker.png';
    let speaker_id = uuidv4();
    let image_uuid = uuidv4();

    if (speaker_id == image_uuid){console.log("UUID is the same!!");}

    form.parse(request);

    form.on('field', (name, field) => {
        value_array.push(field);
    });

    form.on('fileBegin', (name, file) => {
        if (file.name != '') {
            let name_split = (file.name).split(".");
            filename = image_uuid + "." + name_split[name_split.length - 1];
            file.path = path + filename;
        }
    });

    form.on('end', () => {
        let con = db.getDb();

        let sql = "INSERT INTO speakers (speaker_id, firstName, lastName, biography, topic, time, location, imageName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        let values = [speaker_id, value_array[0], value_array[1], value_array[5], value_array[2], value_array[4], value_array[3], filename];

        con.query(sql, values, (err, result) => {
            if (err) {
                throw err;
            }
            console.log(`Added new speaker: ${value_array[0]} ${value_array[1]}`);
        });

    });

    return response.redirect("/admin/webcontent/speakers");   
};

/*
ADMIN PANEL - Speaker page.
Deletes Speaker 
*/
const deleteSpeaker = async (request, response) => {
    let speaker_uuid = await request.body.speaker_uuid;
    let imageName = await request.body.image_name;

    // removes speaker image
    if (imageName != 'default_speaker.png'){
        let file_path = `./public/images/speakers/${imageName}`;
        fs.unlink(file_path, (err) => {
            if (err) console.log(`Could not delete ${file_path}`);

            console.log(`${file_path} was deleted`);
        });
    }

    // removes row from database
    let con = db.getDb();
    let sql = "DELETE FROM speakers WHERE speaker_id=?";
    con.query(sql, speaker_uuid, (err, result) => {
        if (err) throw (err);
        console.log(`Deleted speaker ${speaker_uuid}`);

    });

    return response.redirect('/admin/webcontent/speakers');
};

/*
ADMIN PANEL - Speaker page.
Updates Speaker Information
used in admin/webcontent/speakers
*/
const uploadSpeaker = (request, response) => {
    let form = new formidable.IncomingForm(),
        value_array = [];
    let uuid = uuidv4();
    let path = './public/images/speakers/';
    let filename = 'default_speaker.png';

    form.parse(request);

    // loops through all fields in form
    // assigns values to value_array variable which can be accessed in the 'end'
    form.on('field', (name, field) => {
        value_array.push(field);
    });

    form.on('fileBegin', (name, file) => {
        if (file.name != '') {
            let name_split = (file.name).split(".");
            filename = uuid + "." + name_split[name_split.length - 1];
            file.path = path + filename;
        }
    });

    form.on('end', () => {
        if (filename != value_array[7] && filename == 'default_speaker.png') {
            console.log('keep old img, no change necessary');
            filename = value_array[7];
        } else if ((filename != value_array[7]) && (value_array[7] != 'default_speaker.png')) {
            console.log('delete old img, swap in new');

            // removes image from folder
            let file_path = path + value_array[7];
            fs.unlink(file_path, (err) => {
                if (err) console.log(`Could not delete ${file_path}`);

                console.log(`${file_path} was deleted`);
            });
        }

        let values = [value_array[1], value_array[0], value_array[2], value_array[4], value_array[3], value_array[5], filename, value_array[6]];
        let con = db.getDb();
        let sql = "UPDATE speakers SET lastName=?, firstName=?, topic=?, time=?, location=?, biography=?, imageName=? WHERE speaker_id=?";

        con.query(sql, values, (err, result) => {
            if (err) throw (err);
        });
    });

    response.redirect('/admin/webcontent/speakers');
};

// removes speaker image
// sets to default image named 'default_speaker.png'
// used in admin/webcontent/speakers
const removeSpeakerImg = (request, response) => {
    let speaker_uuid = request.params.speaker_uuid;
    let file_path = `./public/images/speakers/${request.params.img_name}`;

    // removes database file pointer and sets to default
    let con = db.getDb();
    let sql = "UPDATE speakers SET imageName='default_speaker.png' WHERE speaker_id=?";
    con.query(sql, speaker_uuid, (err, result) => {
        if (err) throw (err);
    });

    // removes image from folder
    fs.unlink(file_path, (err) => {
        if (err) console.log(`Could not delete ${file_path}`);

        console.log(`${file_path} was deleted`);
    });

    response.redirect('/admin/webcontent/speakers');
};

router.post("/addSpeaker", addSpeaker);
router.post('/deleteSpeaker', deleteSpeaker);
router.post("/uploadSpeaker", uploadSpeaker);
router.get("/removeSpeakerImg/:speaker_uuid/:img_name", removeSpeakerImg);

module.exports = router;