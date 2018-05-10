var express = require("express");
var router = express.Router();
var middleware = require("../middleware");
var passport = require("passport");

var sqlite3 = require("sqlite3");
var db = new sqlite3.Database("cart");

router.get("/", function(req, res){
    res.render("landing");
});

router.get("/aboutus", function(req, res){
    res.render("aboutus");
});

router.get("/ingredient", function(req, res){
    res.render("ingredient");
});

router.get("/register", function(req, res){
   res.render("register"); 
});

router.post("/register", function(req, res){
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    db.serialize(function() {
        db.run('INSERT INTO user VALUES (?, ?, ?)', username, email, password, 
        function(err){
            if(err){
                console.log(err);
                req.flash("error", "該用戶已被註冊");
                return res.redirect("register"); 
            }
            else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/"); 
                });
            }
        });
    });
});

router.get("/login", function(req, res){
   res.render("login"); 
});

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: '帳號或密碼錯誤'
    }), function(req, res){
});

router.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});

router.get("/member", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.all("SELECT * FROM user WHERE username=?", req.user.username,  
        function(err, rows){
            if (err)
                console.log(err);
            else
                res.render('member', {data: rows});
        });
    });
});

router.put("/member", function(req, res){
    db.serialize(function() {
         db.run("UPDATE user SET email=?, password=? WHERE username=?", req.body.email, req.body.password, req.user.username,
         function(err){
            if (err)
                req.flash("error", "儲存失敗")
            else
                req.flash("success","儲存成功");
            res.redirect("member");
        });
     });
 });

module.exports = router;