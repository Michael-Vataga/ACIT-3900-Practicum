const db = require('./database.js');

const express = require("express");
const router = express.Router();
const uuidv1 = require('uuid/v1');

const bcrypt = require('bcrypt');

const saltRounds = 10;

const registerUser = async (request, response) => {
    let uuid = uuidv1();

    let email = await request.body.email;
    let password = await bcrypt.hash(request.body.password, saltRounds);

    let title = await request.body.title;
    let firstName = await request.body.firstName;
    let lastName = await request.body.lastName;

    let companyName = await request.body.companyName;
    let division = await request.body.division;
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

    let consent = await request.body.consent;

    con = db.getDb();

    // checks that an account does NOT already exist
    let sql = "SELECT * FROM accounts WHERE email=?";
    con.query(sql, email, (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            console.log("Error: email already exists");
            return response.redirect("/registration");
        }
        else {
            // creates a new account
            sql = "INSERT INTO accounts (account_uuid, email, password, title, firstName, lastName, companyName, division, plantClassification, fieldPosition, businessPhone, homePhone, cellPhone, addressL1, addressL2, country, city, province_state, pc_zip, consent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            let values = [uuid, email, password, title, firstName, lastName, companyName, division, plantClassification, fieldPosition, businessPhone, homePhone, cellPhone, addressL1, addressL2, country, city, province_state, pc_zip, consent];

            con.query(sql, values, (err, result) => {
                if (err) throw err;
                console.log("Number of records inserted: " + result.affectedRows);
            });

            return response.redirect("/login");
        }
    });
};

router.post("/registerUser", registerUser);

module.exports = router;
