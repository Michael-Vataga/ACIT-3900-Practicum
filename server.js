const port = process.env.PORT || 8080;

// Modules
const express = require("express");
const hbs = require("hbs");
const _ = require("lodash");
const bodyParser = require("body-parser");

// Files
const register = require("./registration.js");
const db = require("./database.js");
const passport = require("./passport.js");
const queries = require("./queries.js");
const events = require("./event.js");
const profile = require("./profile.js");
const admin = require("./admin.js");
const sendMail = require('./mailgun');
const resetPassword = require('./resetpassword');

const app = express();

var current_tokens = {};

let server = app.listen(port, () => {
    console.log(`Server is up on the port ${port}`);
    db.init();
});

hbs.registerPartials(__dirname + "/views/partials");

app.use(express.static(__dirname + "/public"));
// app.use(express.static(path.join(__dirname + "public")));
app.use('/static', express.static('public'));


app.use(bodyParser.urlencoded({
    extended:true
}));


app.use(express.urlencoded({
    extended: false
}));

app.use(express.json());


app.use(events);
app.use(register);
app.use(passport);
app.use(profile);
app.use(admin);
app.use(queries.router);

//Checks Account Administrator Status
checkAdmin = (request, response, next) => {
    if (request.isAuthenticated()) {
        if (request.user.isadmin == 1) {
            return next();
        }
    } else {
        response.redirect('/');
    }
};

checkAdmin_false = (request, response, next) => {
    if (request.isAuthenticated()) {
        if (request.user.isadmin != 1) {
            return next();
        }
    } else {
        response.redirect('/');
    }
};

// Home
app.get("/", async (request, response) => {
    let sponsorFolder = './public/images/index/sponsors';
    let sponsorImgs = await queries.getFiles(sponsorFolder);
    let carouselFolder = './public/images/index/carousel';
    let carouselImgs = await queries.getFiles(carouselFolder);

    response.render("home.hbs", {
        title: "Home",
        heading: "Home",
        sponsorImgs: sponsorImgs,
        carouselImgs: carouselImgs
    });
});

hbs.registerHelper("convertTime", (timeString) => {
    let H = +timeString.substr(0, 2);
    let h = H % 12 || 12;
    let ampm = (H < 12 || H === 24) ? "AM" : "PM";
    timeString = h + timeString.substr(2, 3) + ampm;

    return timeString;
});

hbs.registerHelper("convertDate", (dateString) => {
    let date = new Date(dateString);
    let new_date = date.toDateString();

    return new_date;
});

hbs.registerHelper("setActive", index => {
    if (index == 0) {
        return "active";
    }
    return "";
});


/*
Compares account's isadmin with 1 or 0.
May be used for toggling fields HTML elements later?
*/
hbs.registerHelper("isAdminStatus", (statusNum, isAdmin, options) => {
    if (statusNum === isAdmin) {
        return options.fn(this);
    }

    return options.inverse(this);
});

// Functions
function formatDate(inputDate = '') {
    let date = '';

    if (inputDate == '') date = new Date();
    else date = new Date(inputDate);

    let dd = String(date.getDate()).padStart(2, '0');
    let mm = String(date.getMonth() + 1).padStart(2, '0');
    let yy = date.getFullYear();

    let returnDate = yy + "-" + mm + "-" + dd;

    return returnDate;
}

//Checks Authentication (is user logged in?)
checkAuthentication = (request, response, next) => {
    if (request.isAuthenticated()) {
        return next();
    } else {
        response.redirect('/registration');
    }
};

checkAuthentication_false = (request, response, next) => {
    if (!request.isAuthenticated()) {
        return next();
    }
    response.redirect('/');
};

// Login Page
app.get("/login", checkAuthentication_false, (request, response) => {
    let sessionID = request.sessionID;
    let sessionData_string = request.sessionStore.sessions[sessionID];
    let sessionData = JSON.parse(sessionData_string);
    let failureFlag = false;
    let failureMessage = "";

    if (sessionData.flash != undefined) {
        failureFlag = true;
        failureMessage = sessionData.flash.error[0];

        delete sessionData["flash"];
        let deletedError = JSON.stringify(sessionData);
        request.sessionStore.sessions[sessionID] = deletedError;
    }

    response.render("login.hbs", {
        title: "Login",
        heading: "Log In",
        failureFlag: failureFlag,
        failureMessage: failureMessage
    });
});

// Logout
app.get("/logout", checkAuthentication, (request, response) => {
    request.logout();
    request.session.destroy(() => {
        response.clearCookie("connect.sid");
        response.redirect("/");
    });
});

// Profile
app.get("/profile/:account_uuid", checkAuthentication, async (request, response) => {
    if (request.user == undefined) {
        response.render("profile.hbs");
    }

    let user = request.user;

    let profile_uuid = request.params.account_uuid;

    response.render("profile.hbs", {
        profile_uuid: profile_uuid,
        current_uuid: user.account_uuid,

        email: user.email,
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        division: user.division,
        plantClassification: user.plantClassification,
        fieldPosition: user.fieldPosition,
        businessPhone: user.businessPhone,
        homePhone: user.homePhone,
        cellPhone: user.cellPhone,
        addressL1: user.addressL1,
        addressL2: user.addressL2,
        country: user.country,
        city: user.city,
        province_state: user.province_state,
        pc_zip: user.pc_zip
    });

    hbs.registerHelper("compareUser", (profileUser, currentUser, options) => {
        if (profileUser == currentUser) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
});

//  Page
app.get('/about', async (request, response) => {
    let details = await queries.getRow();

    response.render("about.hbs", {
        title:"About",
        heading: "About",
        details: details

    });
});

// Registration Page
app.get('/registration', checkAuthentication_false, (request, response) => {
    response.render("registration.hbs", {
        title:"Registration",
        heading: "Registration",
        action: "/registerUser"
    });
});

// Agenda Page
app.get('/agenda', (request, response) => {
    response.render("agenda.hbs", {
        title:"Agenda",
        heading: "Agenda"
    });
});

// Speaker Page
app.get('/speaker', (request, response) => {
    response.render("speakers.hbs", {
        title: "Speaker",
        heading: "Speaker"
    });
});

// Contact Page
app.get('/contact', (request, response) => {
    response.render("contact.hbs", {
        title:"Contact",
        heading: "Contact"
    });
});

// RSVP
app.get("/rsvp", checkAuthentication, checkAdmin_false, async (request, response) => {
    let events = await queries.eventPromise();

    let user = request.user;

    let rsvps = await queries.getRSVPS(user.account_uuid);
    let event_difference = _.differenceBy(events, rsvps, 'event_uuid');

    response.render("rsvp.hbs", {
        title: "RSVP",
        heading: "Event RSVP",
        event: event_difference,
        account_uuid: user.account_uuid,
        rsvps: rsvps
    });
});

//Admin Page
app.get('/admin', checkAdmin, (request, response) => {
    response.render("administrator/index.hbs", {
        title: "Administrator Panel",
        heading: "Administrator Panel"
    });
});

app.get('/admin/events', checkAdmin, async (request, response) => {
    let events = await queries.eventPromise();
    let today = formatDate();

    for (let i=0; i<events.length; i++){
        events[i].eventDate = formatDate(events[i].eventDate);
    }

    response.render("administrator/events.hbs", {
        title: "Events",
        heading: "Events",
        event: events,
        today: today,
        events_isActive: true
    });
});

app.get('/admin/events/:event_id', checkAdmin, async (request, response) => {
    let event = await queries.getEvent(request.params.event_id);
    let eventAttendees = await queries.getEventAttendees(request.params.event_id);
    let event_uuid = request.params.event_id;

    // // formats the input event date
    let eventDate = await event.eventDate;

    let date = formatDate(eventDate);
    let today = formatDate();
    
    let countAttendees = _.size(eventAttendees);

    response.render("administrator/event.hbs", {
        title: event.eventName,
        heading: event.eventName,
        name: event.eventName,
        date: date,
        desc: event.eventDescription,
        events_isActive: true,
        eventAttendees: eventAttendees,
        countAttendees: countAttendees,
        event_uuid: event_uuid,
        today: today
    });
});

app.get('/admin/webcontent/home', checkAdmin, async (request, response) => {
    let sponsorFolder = './public/images/index/sponsors';
    let sponsorImgs = await queries.getFiles(sponsorFolder);
    let carouselFolder = './public/images/index/carousel';
    let carouselImgs = await queries.getFiles(carouselFolder);
    
    response.render("administrator/webcontent/home.hbs", {
        title: 'Admin - Home',
        heading: 'Manage Home Page Content',
        carouselImgs: carouselImgs,
        sponsorImgs: sponsorImgs,
        webcontent_homeisActive: true,
        webcontent_isActive: true
    });
});

app.get('/admin/webcontent/about', checkAdmin, async (request, response) => {
    let details = await queries.getRow();

    response.render("administrator/webcontent/about.hbs", {
        title: 'Admin - About',
        heading: 'Manage About Page Content',
        webcontent_aboutisActive: true,
        details: details,
        webcontent_isActive: true
    });
});
app.get('/admin/webcontent/agenda', checkAdmin, async (request, response) => {
    response.render("administrator/webcontent/agenda.hbs", {
        title: 'Admin - Agenda',
        heading: 'Manage Agenda Page Content',
        webcontent_agendaisActive: true,
        webcontent_isActive: true
    });
});
app.get('/admin/webcontent/speakers', checkAdmin, async (request, response) => {
    response.render("administrator/webcontent/speaker.hbs", {
        title: 'Admin - Speaker',
        heading: 'Manage Speaker Page Content',
        webcontent_speakersisActive: true,
        webcontent_isActive: true
    });
});
app.get('/admin/webcontent/contact', checkAdmin, async (request, response) => {
    response.render("administrator/webcontent/contact.hbs", {
        title: 'Admin - Contact',
        heading: 'Manage Contact Page Content',
        webcontent_contactisActive: true,
        webcontent_isActive: true
    });
});

app.get('/admin/webcontent', checkAdmin, async (request, response) => {
    response.render("administrator/webcontent.hbs", {
        title: "Website Content",
        heading: "Manage Website Content",
        webcontent_isActive: true
    });
});

app.get('/admin/useraccounts', checkAdmin, async (request, response) => {
    let users = await queries.getAllUsers();

    response.render("administrator/useraccounts.hbs", {
        title: "User Accounts",
        heading: "Manage User Accounts",
        ua_isActive: true,

        users: users
    });
});

app.get('/admin/useraccounts/:account_uuid', checkAdmin, async (request, response) => {
    let user = await queries.getUser(request.params.account_uuid);

    response.render('administrator/user.hbs', {
        title: `${user.firstName} ${user.lastName}'s Profile`,
        heading: `${user.firstName} ${user.lastName}`,

        user: user,
        account_uuid: user.account_uuid
    });
});

app.get('/admin/adminaccount', checkAdmin, async (request, response) => {
    let admins = await queries.getAdmins();
    let nonAdmins = await queries.getNonAdmins();

    response.render("administrator/adminaccount.hbs", {
        title: "Admin Account",
        heading: "Manage Administrator Accounts",
        adminacc_isActive: true,

        admins: admins,
        nonAdmins: nonAdmins
    });
});

//Contact Form Emails
app.post('/email', (req, res) => {
    const {email, subject, text} = req.body;
    console.log(req.body)

    sendMail(email, subject, text, function(err, data) {
        if (err) {
            res.status(500).json({ message: 'An error has occurred' });
        } else {
            res.status(200).json({ message: 'Message sent successfully.'});
        }
    });

});

//Reset Password Page
app.get('/forgotpassword', (request, response) => {
    response.render("forgotpassword.hbs", {
        title:"Forgot Password",
        heading: "Forgot Password"
    });
});

//Reset Password Emails
app.post('/resetpassword', async (req, res) => {
    console.log(`current tokens ${JSON.stringify(current_tokens)}`);
    const {email} = req.body;
    console.log(req.body["email"]);
    var token = "";
    setTimeout(() => {
        token = resetPassword.generateToken();
        console.log(`inside of timeout ${token}`);
        current_tokens[`${token}`] = email;
        resetPassword.sendMail(email, token);

    }, 2000);
    // console.log(await resetPassword.realToken);
    // let token = resetPassword.generateToken();
    console.log( `outside of timeout: ${resetPassword.generateToken()}`);
    
    // if (){
       
        console.log(resetPassword.generateToken());
        // resetPassword.sendMail(req.body["email"], function(err, data) {
        //     if (err) {
        //         res.status(500).json({ message: 'An error has occurred' });
        //     } else {
        //         res.status(200).json({ message: 'Message sent successfully.'});
        //     }
        // });
    // }else{
    //     console.log("Email not sent")
    // }

   

});

app.get('/resetpassword/:token', (request, response) => {
    response.render("resetpassword.hbs", {
        title:"Reset Password",
        heading: "Reset Password"
    });
});

app.post('/resetpassword/:token', (request, response) => {
    // console.log(request.params.token);
   
    let email = current_tokens[`${request.params.token}`];
    let password = request.body[`password`];
    console.log("password entered is: " +password);
    console.log("email found: " +email);
    resetPassword.changepassword(email, password).then((result) =>{
        console.log(`${resetPassword.changepassword()}`);
        // response.send("You Fucken did it son");
        response.redirect('/login');

    }).catch((err) => {
        console.log(err);
    });




});