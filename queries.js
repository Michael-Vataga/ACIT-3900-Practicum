const express = require("express");
const router = express.Router();

const db = require("./database");

const fs = require("fs");

const bcrypt = require('bcrypt');
const saltRounds = 10;

const uuidv4 = require('uuid/v4');

// Populates event table with eventName and date
let eventPromise = () => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT * FROM events ORDER BY eventDate";
        
        con.query(sql, (err, result) => {
            if (err) reject (err);
            resolve(result);
        });
    });
};

// Retrieves speakers
let getSpeakers = () => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT * FROM speakers ORDER BY time";

        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
};

/*
ADMIN PANEL - individual event page.
Retrieves all details, and populates edit form with current details.
*/
let getEvent = param_id => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT * FROM events WHERE event_uuid = ?";
        
        con.query(sql, param_id, (err, result) => {
            if (err) reject (err);
            resolve(result[0]);
        });
    });
};

/*
ADMIN PANEL - individual event page.
Retrieves all attendees of event and populates the table with their
details (name, email, companyName).
*/
const getEventAttendees = (event_uuid) => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT accounts.firstName, accounts.lastName, accounts.email, accounts.companyName, accounts.account_uuid, accounts.plantClassification, accounts.fieldPosition FROM accounts LEFT JOIN UserEventStatus ON accounts.account_uuid = UserEventStatus.account_uuid WHERE UserEventStatus.event_uuid = ?";

        con.query(sql, event_uuid, (err, result) => {
            if (err) {
                reject (err);
            }
            
            resolve(result);
        });
    });
};

let getRSVPS = account_id => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();

        let sql = "SELECT UserEventStatus.event_uuid, events.eventName, events.eventDescription, events.eventDate FROM UserEventStatus LEFT JOIN events ON UserEventStatus.event_uuid = events.event_uuid WHERE UserEventStatus.account_uuid = ? ORDER BY eventDate";

        con.query(sql, account_id, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
};

let getFiles = folder => {
    return new Promise((resolve, reject) => {
        let imgs = [];

        fs.readdir(folder, (err, files) => {
            files.forEach(file => {
                imgs.push(file);
            });
            resolve(imgs);
        });  
    });
};

let getRow = () => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();

        let sql = "SELECT * FROM about_event";

        con.query(sql, (err, result) => {
            if (err) reject(err);
            resolve(result[0]);
        });
    });
};

/*
ADMIN PANEL - user accounts page.
Retrives all currently-registered users.
*/
const getAllUsers = () => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT account_uuid, email, firstName, lastName, companyName, plantClassification, fieldPosition, businessPhone FROM accounts ORDER BY lastName";

        con.query(sql, (err, result) => {
            if (err) {
                reject (err);
            }

            resolve(result);
        });
    });
};

/* 
ADMIN PANEL - edit user page.
Retrieves all details of a user, which is used to populate the form
used for editing user details.
*/
const getUser = (account_uuid) => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT * FROM accounts WHERE account_uuid=?";

        con.query(sql, account_uuid, (err, result) => {
            if (err) {
                reject (err);
            }

            resolve(result[0]);
        });
    });
};

/*
ADMIN PANEL - add new user page.
Enables admins to add a new user. Password is generated on account creation.
*/
const addNewUser = async (request, response) => {
    let account_uuid = uuidv4();

    let email = await request.body.email;

    let title = await request.body.title;
    let firstName = await request.body.firstName;
    let lastName = await request.body.lastName;

    let companyName = await request.body.companyName;
    let plantClassification = await request.body.plantClassification;
    let fieldPosition = await request.body.fieldPosition;

    let businessPhone = await request.body.businessPhone;
    let homePhone = await request.body.homePhone;
    let cellPhone = await request.body.cellPhone;

    let addressL1 = await request.body.addressL1;
    let addressL2 = await request.body.addressL2;

    let country = await request.body.country;
    let city = await request.body.city;
    let province_state = await request.body.province_state;
    let pc_zip = await request.body.pc_zip;

    // Generate password based on name and a uuid
    let firstInitial = firstName.substring(0, 1);
    let randomChars = uuidv4().substring(0,5);
    let temp = firstInitial + lastName + randomChars;
    let password = await bcrypt.hash(temp, saltRounds);

    // FOR TESTING PURPOSES - DELETE AFTER!!
    console.log(firstInitial + lastName + randomChars);

    con = db.getDb();

    let sql = "SELECT * FROM accounts WHERE email=?";

    con.query(sql, email, (err, result) => {
        if (err) {
            throw err;
        }

        if (result.length > 0) {
            console.log("Error: An account with this email already exists");
            return response.redirect("/admin/adduser");
        } else {
            sql = "INSERT INTO accounts (account_uuid, email, password, title, firstName, lastName, companyName, plantClassification, fieldPosition, businessPhone, homePhone, cellPhone, addressL1, addressL2, country, city, province_state, pc_zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            let values = [account_uuid, email, password, title, firstName, lastName, companyName, plantClassification, fieldPosition, businessPhone, homePhone, cellPhone, addressL1, addressL2, country, city, province_state, pc_zip];

            con.query(sql, values, (err, result) => {
                if (err) throw err;
                console.log(`User - ${firstName} ${lastName} - added by admin`);
            });

            return response.redirect("/admin/useraccounts");
        }
    });
};


/*
ADMIN PANEL - individual user page.
Updates user details based on values in the form.
*/
const editUser = async (request, response) => {
    let account_uuid = request.body.account_uuid;
    let title = await request.body.title;
    let firstName = await request.body.firstName;
    let lastName = await request.body.lastName;
    let companyName = await request.body.companyName;
    let plantClassification = await request.body.plantClassification;
    let fieldPosition = await request.body.fieldPosition;
    let businessPhone = await request.body.businessPhone;
    let homePhone = await request.body.homePhone;
    let cellPhone = await request.body.cellPhone;
    let addressL1 = await request.body.addressL1;
    let addressL2 = await request.body.addressL2;
    let country = await request.body.country;
    let city = await request.body.city;
    let province_state = await request.body.province_state;
    let pc_zip = await request.body.pc_zip;

    let con = db.getDb();
    let sql = "UPDATE accounts SET title=?, firstName=?, lastName=?, companyName=?, plantClassification=?, fieldPosition=?, businessPhone=?, homePhone=?, cellPhone=?, addressL1=?, addressL2=?, country=?, city=?, province_state=?, pc_zip=? WHERE account_uuid=?";
    let values = [title, firstName, lastName, companyName, plantClassification, fieldPosition, businessPhone, homePhone, cellPhone, addressL1, addressL2, country, city, province_state, pc_zip, account_uuid];
    
    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        console.log(`User ${account_uuid} successfully updated by admin`);

        return response.redirect("/admin/useraccounts");
    });
};

/*
ADMIN PANEL - user accounts page.
Deletes user based on account_uuid.
*/
const deleteUser = async (request, response) => {
    let account_uuid = await request.body.account_uuid;

    let con = db.getDb();
    let sql = "DELETE FROM accounts WHERE account_uuid=?";

    con.query(sql, account_uuid, (err, result) => {
        if (err) {
            throw err;
        }

        console.log(`User ${account_uuid} successfully deleted by admin`);

        return response.redirect("/admin/useraccounts");
    });
};

/*
ADMIN PANEL - manage admin accounts page.
Retrieves all admin accounts that currently exist.
*/
const getAdmins = () => {
    return new Promise((resolve, reject) => {
        let adminStatus = 1;

        let con = db.getDb();
        let sql = "SELECT account_uuid, firstName, lastName, email, isadmin, isSU FROM accounts WHERE isadmin=?";

        con.query(sql, adminStatus, (err, result) => {
            if (err) {
                reject (err);
            }

            resolve(result);
        });
    });
};

const getNonAdmins = () => {
    return new Promise((resolve, reject) => {
        let adminStatus = 0;

        let con = db.getDb();
        let sql = "SELECT account_uuid, firstName, lastName, email, isadmin FROM accounts WHERE isadmin=?";

        con.query(sql, adminStatus, (err, result) => {
            if (err) {
                reject (err);
            }

            resolve(result);
        });
    });
};

const changeAdminStatus = async (request, response) => {
    let account_uuid = await request.body.account_uuid;
    let adminStatus = request.body.adminStatus;

    let con = db.getDb();
    let sql = "UPDATE accounts SET isadmin=? WHERE account_uuid=?";
    let values = [adminStatus, account_uuid];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        if (adminStatus == 1) {
            console.log(`User ${account_uuid} promoted`);
        } else {
            console.log(`User ${account_uuid} demoted`);
        }

        return response.redirect("/admin/adminaccount");
    });
};

/*
Used in /feedback
Saves feedback form data into db
*/
const sendFeedback = async (request, response) => {
    let feedback_id = uuidv4();
    let content = await request.body.content;
    let length = await request.body.length;
    let organization = await request.body.organization;
    let format = await request.body.format;
    let overall_rating = await request.body.overall_rating;
    let relevance = await request.body.relevance;
    let comments = await request.body.comments;

    let con = db.getDb();
    let sql = "INSERT INTO feedback (feedback_id, content, length, organization, format, overall_rating, relevance, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    let values = [feedback_id, content, length, organization, format, overall_rating, relevance, comments];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        return response.redirect("/");
    });
};

/*
ADMIN PANEL - landing page.
Shows all feedback form data, retrieved from db.
*/
const getAllFeedback = () => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT * from feedback";

        con.query(sql, (err, result) => {
            if (err) {
                reject (err);
            }

            resolve(result);
        });
    });
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

router.post('/editUser', editUser);
router.post('/deleteUser', deleteUser);
router.post('/changeAdminStatus', changeAdminStatus);
router.post('/sendFeedback', sendFeedback);
router.post('/addNewUser', addNewUser);
router.post('/editSpeaker', editSpeaker);

module.exports = {
    eventPromise: eventPromise,
    getEvent: getEvent,
    getSpeakers: getSpeakers,
    getEventAttendees: getEventAttendees,
    getRSVPS: getRSVPS,
    getFiles: getFiles,
    getRow: getRow,
    getAllUsers: getAllUsers,
    getUser: getUser,
    getAdmins: getAdmins,
    getNonAdmins: getNonAdmins,
    getAllFeedback: getAllFeedback,
    router: router
};
