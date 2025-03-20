if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}
const express = require("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const path = require("path");
const engine = require("ejs-mate");
const ExpressError = require("./utils/expresserror.js");
const wrapasync = require("./utils/wrapasync.js");
const { isLoggedIn, saveredirectUrl } = require("./middleware.js");

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Add Google Strategy
const User = require("./models/user.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine("ejs", engine);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/fintech");
}
main()
.then(()=>{
    console.log("connected");
})
.catch((err)=>{
    console.log(err);
})
;

const sessionOption = {
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOption));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// Configure Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID:process.env.CLIENT_ID, // Replace with your Google Client ID
            clientSecret: process.env.CLIENT_SECRET, // Replace with your Google Client Secret
            callbackURL: "http://localhost:3000/auth/google/callback", // Redirect URI
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Find or create user in the database
                let user = await User.findOne({ googleId: profile.id });
                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        username: profile.displayName,
                        email: profile.emails[0].value, // Google provides email in profile.emails
                    });
                    await user.save();
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/user/login", failureFlash: true }),
    (req, res) => {
        req.flash("success", "Welcome back to Bharat Darpan Inc via Google!");
        res.redirect("/fintech");
    }
);
app.get("/user/signup", (req, res) => {
    res.render("./user/signup.ejs", { imagePath: "/images/example.jpg" });
});

app.post(
    "/user/signup",
    wrapasync(async (req, res) => {
        try {
            let { username, number, email, password } = req.body;
            const newUser = new User({
                username: username,
                number: number,
                email: email,
            });
            const registeredUser = await User.register(newUser, password);
            req.login(registeredUser, (err) => {
                if (err) {
                    return next(err);
                }
                req.flash("success", "Welcome To Bharat Darpan");
                res.redirect("/fintech");
            });
        } catch (err) {
            req.flash("error", "A user with the given username is already registered");
            res.redirect("/user/signup");
        }
    })
);

app.get("/user/login", (req, res) => {
    res.render("./user/login.ejs", { imagePath: "/images/example.jpg" });
});

app.post(
    "/user/login",
    saveredirectUrl,
    passport.authenticate("local", { failureRedirect: "/user/login", failureFlash: true }),
    (req, res) => {
        req.flash("success", "Welcome Back to Bharat Darpan");
        res.locals.redirectUrl === undefined
            ? res.redirect("/fintech")
            : res.redirect(res.locals.redirectUrl);
    }
);

app.get("/user/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You logged out successfully");
        res.redirect("/fintech");
    });
});

app.get("/fintech",(req,res)=>{
    res.render("home.ejs",{
         imagePath: "/images/example.jpg",
         headerlogo:"/images/headerlog.svg",
        company :"/images/CompanyMaserData.png",
        eci_banner_up2 :"/images/eci_banner_up2.png",
        HOME_VOD_17032025:"/images/HOME-VOD-17032025.png",
        KCC_Banner :"/images/KCC_Banner.jpg",
        eshram1 :"/images/eshram1.png",
        search:"/images/search.png",
        economy:"/images/economy.png",
        education:"/images/education.png",
        Environment:"/images/Environment-And-Forest.png",
        Science :"/images/Science-And-Technology.png",
        Labour:"/images/Labour-And-Employment.png",
        community:"/images/community.svg",
        app:"/images/app.svg",
        blog:"/images/blogs.svg",
        event:"/images/event.svg",
        high:"/images/high.svg",
        info:"/images/info.svg",
        first:"/images/first.png",
        second:"/images/second.png",
        third:"/images/third.png",
        four:"/images/first.png"
        });
});
app.get("/sector",(req,res)=>{
    res.send("Ok");
});
app.all("*", (req, res) => {
    throw new ExpressError(404, "Page not found");
});

app.use((err, req, res, next) => {
    let { status = 500, message = "Internal server error" } = err;
    res.status(status).render("error.ejs", { imagePath: "/images/example.jpg", message, status });
});

app.listen(port, () => {
    console.log("listening");
});