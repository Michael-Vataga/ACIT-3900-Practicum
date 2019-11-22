const db = require("./database.js");
const express = require("express");
const router = express.Router();

const editProfile = async (request, response) => {
    let email = await request.body.email;
    let current_user_email = await request.user.email;

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

    let user_uuid = request.user.account_uuid;

    let con = db.getDb();

    let sql = "SELECT * FROM accounts WHERE email=?";
    con.query(sql, email, (err, result) => {
        if (err) console.log(err);
        if (current_user_email == email){
            console.log('Current user email. Will not change.');
            sql = "UPDATE accounts SET title=?, firstName=?, lastName=?, companyName=?, plantClassification=?, fieldPosition=?, businessPhone=?, homePhone=?, cellPhone=?, addressL1=?, addressL2=?, country=?, city=?, province_state=?, pc_zip=? WHERE account_uuid=?";
            let values = [title, firstName, lastName, companyName, plantClassification, fieldPosition, businessPhone, homePhone, cellPhone, addressL1, addressL2, country, city, province_state, pc_zip, user_uuid];
            
            con.query(sql, values, (err, result) => {
                if (err) throw (err);
                console.log("Successfully updated. Email was not changed.");
            });
        }
        else if (result.length > 0){
            console.log(result);
            if (result[0].email == email){
                console.log('Email is already assigned to another user.');
            }
        }
        else {
            sql = "UPDATE accounts SET email=?, title=?, firstName=?, lastName=?, companyName=?, plantClassification=?, fieldPosition=?, businessPhone=?, homePhone=?, cellPhone=?, addressL1=?, addressL2=?, country=?, city=?, province_state=?, pc_zip=? WHERE account_uuid=?";
            values = [email, title, firstName, lastName, companyName, plantClassification, fieldPosition, businessPhone, homePhone, cellPhone, addressL1, addressL2, country, city, province_state, pc_zip, user_uuid];

            con.query(sql, values, (err, result) => {
                if (err) {
                    throw err;
                }
                console.log("Successfully updated");
            });
        }
    });

    return response.redirect(`/profile/${user_uuid}`);
};

router.post("/editProfile", editProfile);

module.exports = router;
