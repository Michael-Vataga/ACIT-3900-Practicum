const nodemailer = require('nodemailer');
const mailGun = require('nodemailer-mailgun-transport');
const api_key = require('./api_key.js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./database.js');

const auth = api_key.auth;

const saltRounds = 10;



// const auth = {auth: {
//     api_key: process.env.API_KEY,
//     domain: process.env.DOMAIN
//     }}

// const token = crypto.randomBytes(20).toString('hex');
// console.log(token);


var baseToken = "";
// crypto.randomBytes(20, function(err, buffer) {
//     const token = buffer.toString('hex');
//     console.log(token);
//   });

/**
 * This function randomly generates a 20 hex character token and is appended to reset password emails as a unique link
 *
 * 
 */

const generateToken = () => {
    crypto.randomBytes(20, function (err, buf) {
        baseToken = buf.toString('hex');
        // console.log(token);
    });
    // realToken = baseToken
    return baseToken
}

// exports.realToken = generateToken();


/**
 * This function checks if the email exists in the database. If it does, return a message that the user has been found
 * and the email has been sent
 *
 * @param {*} email
 * @param {*} token
 */
const checkEmail = (email, token) => {


    let con = db.getDb();
    let sql = `select * from accounts where email like "${email}"`

    con.query(sql, (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            console.log("User was found. The e-mail will be sent.");
        } else {
            console.log("Email was not found. Re-type your email.")
        }

        // email.resetPasswordToken = token;
        // email.resetPasswordExpires = Date.now() + 3600000; // 1 hour


        return ({ token: token, email: email });

    });
};



/**
 *  Updates the password associated with the email and the token generated from the reset password e-mail link
 *
 * @param {*} email
 * @param {*} password
 * @returns
 */
const changepassword =   (email, password) => {
    return new Promise(async (resolve, reject) => {
        let hashed_password = await bcrypt.hash(password, saltRounds);
        let con = db.getDb();
        let sql = `update accounts set password = "${hashed_password}" where email like "${email}"`

        con.query(sql, (err, result) => {
            if (err)
                reject(err);
            else {
                resolve(result);       
            }

        })

    });
};





const transporter = nodemailer.createTransport(mailGun(auth));

/**
 * This function sends an email to the user when they request a reset password link, that will generate a link with a token
 *
 *
 * @param {*} token
 * @param {*} email
 * 
 */
const sendMail = (email, realToken) => {
    console.log(email);

    let mailOptions = {
        from: "postmaster@mail.victorguan.com",
        to: email,
        subject: 'Password Reset Link',
        text: "You requested a link to reset your password.\n\n" +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            `http://localhost:8080/resetpassword/${realToken}\n\n` +
            // `https://ipeevent.commons.bcit.ca/resetpassword/${realToken}\n\n` +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
    };


    transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
            console.log('There is an error');

            console.log(err)
        } else {
            console.log('Link has been sent.');
        }

    });

};




// module.exports = generateToken;
// module.exports = checkEmail;


module.exports = {
    generateToken,
    checkEmail,
    sendMail,
    changepassword,
}
// {/* <script src="/static/js/api_key.js"></script> */ }