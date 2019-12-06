const express = require("express");
const session = require("express-session");

const bodyParser = require("body-parser");
const flash = require("connect-flash");

const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const db = require('./database');

const router = express.Router();

/* SETUP */
router.use(express.static("public"));
router.use(session({ secret: "cats" }));
router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(flash());

router.use(passport.initialize());
router.use(passport.session());

router.use((request, response, next) => {
    response.locals.isAuthenticated = request.isAuthenticated();
    next();
});

passport.serializeUser((user, done) => {
    done(null, user.account_uuid);
});

passport.deserializeUser((id, done) => {
    let con = db.getDb();
    
    let sql = "SELECT * FROM accounts WHERE account_uuid = ?";
    
    con.query(sql, id, (err, result) => {
        if (err) throw err;
        if (result[0].account_uuid == id) {
            return done(null, result[0]);
        }
        return done(err, false);
    });
});

router.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: 'Invalid username and password'
    }),
    (request, response) => {
        if (request.user.isadmin) {
            response.redirect("/admin");
        }
        else {
            response.redirect("/");
        }
    }
);

passport.use(
    new localStrategy((email, password, done) => {  
        let con = db.getDb();

        let sql = "SELECT * from accounts WHERE email=?";
        
        con.query(sql, email, (err, result) => {
            if (err) throw err;
            if (result.length != 1) {
                console.log("ERROR: not equal to 1 found");
                return done(null, false);
            }
            else {
                bcrypt.compare(password, result[0].password).then(match => {
                    if (match) {
                        return done(null, result[0]);
                    }
                    return done(null, false);
                });
            }
        });
}));

router.use((request, response, next) => {
    response.locals.user = request.user;
    next();
});

module.exports = router;