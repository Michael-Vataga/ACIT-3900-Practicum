const formidable = require('formidable');
const express = require("express");
const fs = require("fs");
const uuidv4 = require('uuid/v4');

const db = require("./database.js");

const router = express.Router();

// adds carousel image
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

// deletes carousel image
// used in admin/webcontent/home
const deleteFile = async (request, response) => {
    let file_path = await request.body.path;
    
    fs.unlink(file_path, (err) => {
        if (err) console.log(err);
        
        console.log(`${file_path} was deleted`);
    });

    response.redirect('/admin/webcontent/home');
};

// adds sponsors
// used in admin/webcontent/home
const uploadSponsor = (request, response) => {
    let form = new formidable.IncomingForm();
    let path = './public/images/index/sponsors/';
    let value_array = [];
    let sponsor_id = uuidv4();
    let file_id = uuidv4();
    let filename = '';

    form.parse(request);

    form.on('field', (name, field) => {
        value_array.push(field);
    });

    form.on('fileBegin', (name, file) => {
        let name_split = (file.name).split(".");
        filename = file_id + "." + name_split[name_split.length - 1];
        file.path = path + filename;
    });

    form.on('end', () => {
        let con = db.getDb();
        let sql = "INSERT INTO sponsors (sponsorID, imageName, tier, sponsorName) VALUES(?, ?, ?, ?)";
        let values = [sponsor_id, filename, value_array[1], value_array[0]];

        con.query(sql, values, (err, result) => {
            if (err) console.log("unable to insert sponsor into DB");

            console.log("Successfully added sponsor to DB");
        });
    });

    return response.redirect("/admin/webcontent/home#sponsorTitle");
};

const editSponsor = (request, response) => {
    let form = new formidable.IncomingForm(),
        value_array = [];
    let uuid = uuidv4();
    let path = './public/images/index/sponsors/';
    let filename = '';

    form.parse(request);

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
        // if no new image is uploaded
        if (filename == '') {
            console.log('keep old img, no change necessary');
            filename = value_array[3];
        } 
        // else if there is a new image
        else {
            console.log('delete old img, swap in new');

            // removes image from folder
            let file_path = path + value_array[3];
            fs.unlink(file_path, (err) => {
                if (err) console.log(`Could not delete ${file_path}`);

                console.log(`${file_path} was deleted`);
            });
        }

        let con = db.getDb();
        let sql = "UPDATE sponsors SET imageName=?, tier=?, sponsorName=? WHERE sponsorID=?";
        let values = [filename, value_array[1], value_array[0], value_array[2]];

        con.query(sql, values, (err, result) => {
            if (err) throw (err);
        });
    });

    response.redirect('/admin/webcontent/home#sponsorTitle');
};

const deleteSponsor = async (request, response) => {
    let sponsorID = await request.body.sponsor_id;
    let imageName = await request.body.image_name;

    let con = db.getDb();
    let sql = "DELETE FROM sponsors WHERE sponsorID=?";
    con.query(sql, sponsorID, (err, result) => {
        if (err) {
            throw err;
        }

        console.log(`Sponsor ${sponsorID} deleted by admin`);
    });

    let file_path = `./public/images/index/sponsors/${imageName}`;
    fs.unlink(file_path, (err) => {
        if(err) console.log(`Could not remove ${file_path}`);

        console.log(`${file_path} was successfully deleted`);
    });

    return response.redirect('admin/webcontent/home#sponsorTable');
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

    let gmaps = request.body.aboutGmaps;

    if (gmaps != '' && gmaps != undefined) {
        let regex = /https:[^"]*/;
        let array = regex.exec(gmaps);

        if (array != null){
            let link = array[0];
            sql = "UPDATE about_event SET googleMaps=?";
            con.query(sql, link, (err, result) => {
                if (err) throw (err);

                console.log("Successfully changed Google Maps iFrame");
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

// updates calendar iFrame
// used in admin/webcontent/calendar

const updateCalendar = async (request, response) => {
    let con = db.getDb();

    let iFrame = request.body.calendariFrame;
    let regex = /https[^"]*/;
    let array = regex.exec(iFrame);

    let sql = "Update calendar SET link=?";

    con.query(sql, array[0], (err, result) => {
        if (err) throw (err);

        console.log("Successfully changed calendar iFrame");
    });
    response.redirect('/admin/webcontent/calendar');
};

router.post("/upload", upload);
router.post("/deleteFile", deleteFile);
router.post("/uploadSponsor", uploadSponsor);
router.post("/editSponsor", editSponsor);
router.post("/deleteSponsor", deleteSponsor);
router.post("/updateAbout", updateAbout);
router.post("/updateCalendar", updateCalendar);

module.exports = router;
