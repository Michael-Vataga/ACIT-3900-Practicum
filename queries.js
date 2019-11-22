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
const getSU = () => {
    return new Promise((resolve, reject) => {
        let suStatus = 1;

        let con = db.getDb();
        let sql = "SELECT account_uuid, firstName, lastName, email, isSU FROM accounts WHERE isSU=?";

        con.query(sql, suStatus, (err, result) => {
            if (err) {
                reject(err);
            }

            resolve(result);
        });
    });
};

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
            console.log(`User ${account_uuid} promoted to Admin`);
        } else {
            console.log(`User ${account_uuid} demoted to User`);
        }

        return response.redirect("/admin/adminaccount");
    });
};

const changeSUStatus = async (request, response) => {
    let account_uuid = await request.body.account_uuid;
    let suStatus = request.body.suStatus;
    let current_user = await request.user.account_uuid;

    let con = db.getDb();
    let sql = "SELECT count(*) as numSU FROM accounts where isSU=1";

    con.query(sql, (err, result) => {
        if (err) throw (err);
        if (result[0].numSU == 1 && suStatus == 0){
            console.log('You must always have at least 1 Super User account');
        }
        else if (current_user == account_uuid){
            console.log('Request Denied: Cannot demote current logged in user');
        }
        else {
            sql = "UPDATE accounts SET isSU=? WHERE account_uuid=?";
            let values = [suStatus, account_uuid];

            con.query(sql, values, (err, result) => {
                if (err) {
                    throw err;
                }

                if (suStatus == 1) {
                    console.log(`User ${account_uuid} promoted to SU`);
                } else {
                    console.log(`User ${account_uuid} demoted to Admin`);
                }
            });
        }
        return response.redirect("/admin/adminaccount");
    });
};

/*
Used in /feedback
Saves feedback form data into db
*/
const sendFeedback = async (request, response) => {
    let content = await request.body.content;
    let speakerQuality = await request.body.speakerQuality;
    let organization = await request.body.organization;
    let format = await request.body.format;
    let overall_rating = await request.body.overall_rating;
    let relevance = await request.body.relevance;
    let comments = await request.body.comments;

    let con = db.getDb();
    let sql = "INSERT INTO feedback (content, speakerQuality, organization, format, overall_rating, relevance, comments) VALUES (?, ?, ?, ?, ?, ?, ?)";
    let values = [content, speakerQuality, organization, format, overall_rating, relevance, comments];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw err;
        }

        return response.redirect("/");
    });
};

/* 
ADMIN PANEL
Deletes a feedback based on feedback_id
*/
const deleteFeedback = async (request, response) => {
    let feedback_id = await request.body.feedback_id;

    let con = db.getDb();
    let sql = "DELETE FROM feedback WHERE feedback_id=?";

    con.query(sql, feedback_id, (err, result) => {
        if (err) {
            throw err;
        }

        return response.redirect("/admin");
    });
};

/*
ADMIN PANEL - landing page.
Shows all feedback form data, retrieved from db.
*/
const getAllFeedback = () => {
    return new Promise((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT * FROM feedback ORDER BY feedback_id DESC";

        con.query(sql, (err, result) => {
            if (err) {
                reject (err);
            }

            resolve(result);
        });
    });
};

/*
ADMIN PANEL - agenda page
Adds new agenda items/times to agenda table
*/
const addAgendaItem = async (request, response) => {
    let agenda_uuid = uuidv4();
    let timeStart = await request.body.timeStart;
    let timeEnd = await request.body.timeEnd;
    let description = await request.body.description;

    let con = db.getDb();
    let sql = "INSERT INTO agenda (agenda_uuid, timeStart, timeEnd, description) VALUES (?, ?, ?, ?)";
    let values = [agenda_uuid, timeStart, timeEnd, description];

    con.query(sql, values, (err, result) => {
        if (err) {
            throw (err);
        }

        console.log(`Agenda item ${agenda_uuid} successfully added`);
        
        return response.redirect("/admin/webcontent/agenda");
    });
};

/*
ADMIN PANEL - agenda page.
Deletes a row of agenda items by agenda id.
*/
const deleteAgendaItem = async (request, response) => {
    let agenda_uuid = await request.body.agenda_uuid;

    let con = db.getDb();
    let sql = "DELETE FROM agenda WHERE agenda_uuid = ?";

    con.query(sql, agenda_uuid, (err, result) => {
        if (err) {
            throw (err);
        }

        console.log(`Agenda item ${agenda_uuid} successfully deleted`);

        return response.redirect("/admin/webcontent/agenda");
    });
};

/*
Retrieves all agenda items, which will be populated to the table.
*/
const getAgendaItems = () => {
    return new Promise ((resolve, reject) => {
        let con = db.getDb();
        let sql = "SELECT * FROM agenda ORDER BY timeStart ASC";

        con.query(sql, (err, result) => {
            if (err) {
                reject (err);
            }

            resolve(result);
        });
    });
};

router.post('/editUser', editUser);
router.post('/deleteUser', deleteUser);
router.post('/changeAdminStatus', changeAdminStatus);
router.post('/changeSUStatus', changeSUStatus);
router.post('/sendFeedback', sendFeedback);
router.post('/deleteFeedback', deleteFeedback);
router.post('/addNewUser', addNewUser);
router.post('/addAgendaItem', addAgendaItem);
router.post('/deleteAgendaItem', deleteAgendaItem);

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
    getSU: getSU,
    getAdmins: getAdmins,
    getNonAdmins: getNonAdmins,
    getAllFeedback: getAllFeedback,
    getAgendaItems: getAgendaItems,
    router: router
};
