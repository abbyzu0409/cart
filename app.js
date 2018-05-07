var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var passport = require("passport");
var LocalStrategy  = require("passport-local");
var methodOverride = require("method-override");
var flash = require("connect-flash");

var sqlite3 = require("sqlite3");
var db = new sqlite3.Database("cart");

var orderInfoRoute = require("./routes/orderInfo");
var indexRoute = require("./routes/index");

const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS orderInfo (" + 
              "id INTEGER, " + 
              "date TEXT, " + 
              "name TEXT, " + 
              "phone TEXT, " + 
              "takeaway_datetime TEXT, " + 
              "takeaway_address TEXT, " + 
              "product TEXT, " + 
              "sugar TEXT, " + 
              "ice TEXT, " + 
              "price INTEGER, " + 
              "quantity INTEGER, " +
              "author TEXT, " +
              "PRIMARY KEY (id, product, sugar, ice), " + 
              "FOREIGN KEY (author) REFERENCES user(username))");
  
  db.run("CREATE TABLE IF NOT EXISTS cart (" + 
              "product TEXT, " + 
              "sugar TEXT, " + 
              "ice TEXT, " + 
              "quantity INTEGER, " +
              "FOREIGN KEY (product) REFERENCES menu(product))");

  db.run("CREATE TABLE IF NOT EXISTS menu (" + 
              "product TEXT PRIMARY KEY, " + 
              "class TEXT, " + 
              "price INTEGER)");

  db.run("CREATE TABLE IF NOT EXISTS user (" + 
              "username TEXT PRIMARY KEY, " + 
              "email TEXT, " +
              "password TEXT)");
    /*
    db.run("INSERT INTO menu VALUES ('翡翠綠茶','原味茶',25)");
    db.run("INSERT INTO menu VALUES ('錫蘭紅茶','原味茶',25)");
    db.run("INSERT INTO menu VALUES ('高山金萱茶','原味茶',25)");
    db.run("INSERT INTO menu VALUES ('四季春茶','原味茶',25)");
    db.run("INSERT INTO menu VALUES ('文山清茶','原味茶',25)");
    db.run("INSERT INTO menu VALUES ('烏龍綠茶','原味茶',25)");
    db.run("INSERT INTO menu VALUES ('古早味紅茶','原味茶',25)");

    db.run("INSERT INTO menu VALUES ('紅茶拿鐵','鮮奶茶',55)");
    db.run("INSERT INTO menu VALUES ('鐵觀音拿鐵','鮮奶茶',55)");
    db.run("INSERT INTO menu VALUES ('波霸紅茶拿鐵','鮮奶茶',55)");
    db.run("INSERT INTO menu VALUES ('阿華田拿鐵','鮮奶茶',65)");
    db.run("INSERT INTO menu VALUES ('玫瑰拿鐵','鮮奶茶',65)");
    db.run("INSERT INTO menu VALUES ('布丁鮮奶茶','鮮奶茶',65)");

    db.run("INSERT INTO menu VALUES ('香橙百香綠茶','鮮果茶飲',60)");
    db.run("INSERT INTO menu VALUES ('翡翠香橙','鮮果茶飲',60)");
    db.run("INSERT INTO menu VALUES ('柳橙綠茶','鮮果茶飲',60)");
    db.run("INSERT INTO menu VALUES ('奇異果綠茶','鮮果茶飲',65)");
    db.run("INSERT INTO menu VALUES ('檸檬汁','鮮果茶飲',50)");
    db.run("INSERT INTO menu VALUES ('蜂蜜多多','鮮果茶飲',60)");
    db.run("INSERT INTO menu VALUES ('百香多多','鮮果茶飲',60)");
    db.run("INSERT INTO menu VALUES ('葡萄柚多多','鮮果茶飲',65)");*/
});

app.use(require("express-session")({
  secret: "secret", //session secret
  resave: false,
  saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  function(username, password, done) {
    //find user
    db.get("SELECT * FROM user WHERE username=?", username, 
  function(err, row) {
    if (!row) 
      return done(null, false);
    //have user
    db.get("SELECT * FROM user WHERE username=? and password=?", username, password, 
    function(err, row) {
      if (!row) 
        return done(null, false);
      return done(null, row);
    });
  });
}));

passport.serializeUser(function(user, done) {
  return done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  db.get("SELECT * FROM user WHERE username=?", username,
    function(err, row) {
      if (!row)
        return done(null, false);
    return done(null, row);
  });
});

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   console.log(req.user);
   next();
});

app.use("/", indexRoute);
app.use("/orderInfo", orderInfoRoute);

app.listen(PORT, function(){
  console.log("Starting the server port " + PORT);
});