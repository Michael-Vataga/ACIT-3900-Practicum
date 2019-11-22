const formidable = require('formidable');
const express = require("express");
const fs = require("fs");

const db = require("./database.js");

const router = express.Router();

// adds file
// used in admin/webcontent/home
const upload = (request, response) => {
    let form = new formidable.IncomingForm();
    let path = '';
    form.parse(request);

    form.on('field', (name, field) => {
        path = field;
    });

    form.on('fileBegin', (name, file) => {
        let name_split = (file.name).split(/[ ,]+/);
        let file_name = name_split.join('_');

        file.path = path + file_name;
    });

    form.on('file', (name, file) => {
        console.log('Uploaded ' + file.name);
    });

    response.redirect('/admin/webcontent/home');
};

// deletes file
// used in admin/webcontent/home
const deleteFile = async (request, response) => {
    let file_path = await request.body.path;
    
    fs.unlink(file_path, (err) => {
        //TODO: add error
        if (err) console.log(err);
        
        console.log(`${file_path} was deleted`);
    });

    response.redirect('/admin/webcontent/home');
};

// updates about event page
// used in admin/webcontent/about
const updateAbout = async (request, response) => {
    let con = db.getDb();
    let sql = '';

    let title = request.body.aboutTitle;
    let date = request.body.aboutDate;
    let timeStart = request.body.about_hr1;
    let timeEnd = request.body.about_hr2;
    let desc = request.body.about_desc;

    //TODO: add if (gmaps is empty), check syntax if not
    let gmaps = request.body.aboutGmaps;


    if (gmaps != '' && gmaps != undefined) {
        //TDOO: check regex
        let regex = /https:[^"]*/;
        let array = regex.exec(gmaps);

        if (array != null){
            let link = array[0];
            sql = "UPDATE about_event SET googleMaps=?";
            con.query(sql, link, (err, result) => {
                if (err) throw (err);

                console.log("Successfully changed Google Maps iframe");
            });
        }
    }

    
    sql = "UPDATE about_event SET title=?, date=?, startTime=?, endTime=?, description=?";
    let values = [title, date, timeStart, timeEnd, desc];
    con.query(sql, values, (err, result) => {
        if (err) throw(err);

        console.log("Successfully updated About Event page details");
    });

    response.redirect('/admin/webcontent/about');
};

router.post("/upload", upload);
router.post("/deleteFile", deleteFile);
router.post("/updateAbout", updateAbout);

module.exports = router;
