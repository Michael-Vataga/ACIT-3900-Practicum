const nodemailer = require('nodemailer');
const mailGun = require('nodemailer-mailgun-transport');
const api_key = require('./api_key.js');

const auth = api_key.auth

// const auth = {auth: {
//     api_key: process.env.API_KEY,
//     domain: process.env.DOMAIN
//     }}


const transporter = nodemailer.createTransport(mailGun(auth));

const sendMail = (email, subject, text) => {

    const mailOptions = {
        from: `${email}`,
        to: 'collabevent2020@gmail.com',
        // to: 'collabevent2020@outlook.com',
        subject,
        text
    };

    transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
            console.log('There is an error');
            console.log(err)
        } else {
            console.log('Message Received.');
        }
    });
}

module.exports = sendMail;



{/* <script src="/static/js/api_key.js"></script> */}