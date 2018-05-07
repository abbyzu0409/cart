var express = require("express");
var router = express.Router();
var middleware = require("../middleware");
var moment = require('moment');

var sqlite3 = require("sqlite3");
var db = new sqlite3.Database("cart");

router.get("/", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.all("SELECT * FROM orderInfo GROUP BY id ORDER BY date DESC",  
        function(err, rows){
            if (err)
                console.log(err);
            else
                res.render('orderInfo/index', {data: rows});
        });
    });
});

router.post("/", middleware.isLoggedIn, function(req, res){
    var date = moment().format('YYYY-MM-DD hh:mm:ss');
    var name = req.body.name;
    var phone = req.body.phone;
    var takeaway_datetime = moment(req.body.takeaway_datetime).format('YYYY-MM-DD hh:mm:ss');
    var takeaway_address = req.body.address;
    var total = req.body.order_total;
    var author = req.user.username;
    var id = 0;

    db.serialize(function() {
        db.all("SELECT *, sum(quantity) as quantity, (SELECT max(id) as id FROM orderInfo) as id " + 
                "FROM cart, menu " +
                "WHERE cart.product=menu.product " +
                "GROUP BY cart.product, cart.sugar, cart.ice " + 
                "ORDER BY menu.class ", 
        function(err, rows){
            if (!err){
                id = rows[0].id;
                id++; //訂單編號增加

                for(var i=0; i<rows.length; i++){
                    db.run("INSERT INTO orderInfo VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                    id, date, name, phone, takeaway_datetime, takeaway_address, rows[i].product, rows[i].sugar, rows[i].ice, rows[i].price, rows[i].quantity, author);
                }
                db.run("DELETE FROM cart", function(err){
                    if (err)
                        req.flash("error", "結帳失敗");
                    else
                        req.flash("success","完成結帳");
                    res.redirect("/orderInfo");
                });
            }
        });
    });
});

router.get("/new", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.all("SELECT * FROM menu", 
         function(err, rows){
             if (err)
                 console.log(err);
             else
                 res.render('orderInfo/new', {data: rows});
         });
     });
});

router.post("/new", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.run("INSERT INTO cart VALUES (?,?,?,?)", req.body.product, req.body.sugar, req.body.ice, req.body.quantity, 
        function(err){
            if (err)
                req.flash("error", "加入購物車失敗");
            else
                req.flash("success","加入購物車成功");
            res.redirect("new");
        });
    });
});

router.get("/cart", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.all("SELECT *, sum(quantity) as quantity " + 
                "FROM cart, menu " +
                "WHERE cart.product=menu.product " + 
                "GROUP BY cart.product, cart.sugar, cart.ice " + 
                "ORDER BY menu.class ", 
         function(err, rows){
             if (err)
                 console.log(err);
             else
                res.render('orderInfo/cart', {data: rows});
         });
     });
});

router.delete("/cart_detail", middleware.checkOrderOwner, function(req, res){
    db.serialize(function() {
      db.run("DELETE FROM cart WHERE product=? and sugar=? and ice=?", req.body.product, req.body.sugar, req.body.ice, 
      function(err){
            if (err)
                req.flash("error", "刪除失敗");
            else
                req.flash("success","刪除成功");
            res.redirect("cart");
        });
    });
});

router.delete("/cart", middleware.checkOrderOwner, function(req, res){
    db.serialize(function() {
        db.run("DELETE FROM cart", function(err){
            if (err)
                req.flash("error", "購物車清空失敗");
            else
                req.flash("success","購物車已清空");
            res.redirect("cart");
        });
    });
});

router.put("/cart", middleware.checkOrderOwner, function(req, res){
    db.serialize(function() {
         db.run("UPDATE cart SET sugar=?, ice=?, quantity=? WHERE product=?", req.body.sugar, req.body.ice, req.body.quantity, req.body.product,
         function(err){
            if (err)
                req.flash("error", "更新購物車失敗")
            else
                req.flash("success","更新購物車成功");
            res.redirect("cart");
        });
     });
 });

router.get("/checkout", middleware.checkOrderOwner, function(req, res){
    db.serialize(function() {
        db.all("SELECT *, sum(quantity) as quantity " + 
                "FROM cart, menu " +
                "WHERE cart.product=menu.product " + 
                "GROUP BY cart.product, cart.sugar, cart.ice " + 
                "ORDER BY menu.class ", 
         function(err, rows){
             if (err)
                 console.log(err);
             else
                res.render('orderInfo/checkout', {data: rows});
         });
     });
});

router.get("/:id", function(req, res){
   db.serialize(function() {
       db.all("SELECT * FROM orderInfo WHERE id=?", req.params.id, 
        function(err, rows){
            if (err)
                console.log(err);
            else
                res.render('orderInfo/show', {data: rows});
        });
    });
});

module.exports = router;