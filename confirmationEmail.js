const nodemailer = require('nodemailer');
const mailGun = require('nodemailer-mailgun-transport');
const api_key = require('./api_key.js');

const auth = api_key.auth

// const auth = {auth: {
//     api_key: process.env.API_KEY,
//     domain: process.env.DOMAIN
//     }}


const transporter = nodemailer.createTransport(mailGun(auth));

const sendMail = (email) => {
    // console.log(email);
    let mailOptions = {
        from: "postmaster@mail.victorguan.com",
        to: email['email'],
        subject: 'Thank you for signing up!',
        text: "You have signed up for BCIT IPE Events.\n\n" +
            `Username: ${email['email']}\n\n` +
            `Password: What you set in the WebApp \n\n` + 
            'Our next event is the Collaborators Event 2020.\n\n'
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

module.exports = {
    sendMail,};



{/* <script src="/static/js/api_key.js"></script> */}