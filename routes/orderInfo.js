var express = require("express");
var router = express.Router();
var middleware = require("../middleware");
var moment = require('moment');

var sqlite3 = require("sqlite3");
var db = new sqlite3.Database("cart");

router.get("/", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.all("SELECT * FROM orderInfo WHERE author=? GROUP BY id ORDER BY date DESC", req.user.username,  
        function(err, rows){
            if (err)
                console.log(err);
            else
                res.render('orderInfo/index', {data: rows});
        });
    });
});

router.post("/", function(req, res){
    var date = moment().format('YYYY-MM-DD hh:mm:ss');
    var name = req.body.name;
    var phone = req.body.phone;
    var takeaway_datetime = moment(req.body.takeaway_datetime).format('YYYY-MM-DD hh:mm:ss');
    var takeaway_address = req.body.address;
    var id = 0;

    db.serialize(function() {
        db.all("SELECT *, (SELECT max(id) as id FROM orderInfo) as id " + 
                "FROM cart, menu " +
                "WHERE cart.product=menu.product and author=?" +
                "ORDER BY menu.class ", req.user.username,
        function(err, rows){
            if (!err){
                id = rows[0].id;
                id++; //訂單編號增加

                //將購物車內容新增至訂單資料表
                for(var i=0; i<rows.length; i++){
                    db.run("INSERT INTO orderInfo VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                                id, date, name, phone, takeaway_datetime, takeaway_address, rows[i].product, rows[i].sugar, rows[i].ice, rows[i].price, rows[i].quantity, rows[i].author);
                }

                //結帳後 清空購物車
                db.run("DELETE FROM cart WHERE author=?", req.user.username,
                function(err){
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

router.post("/new", function(req, res){
    db.serialize(function() {
        //查詢購物車內是否已有相同飲料
        db.all("SELECT * FROM cart WHERE product=? and sugar=? and ice=? and author=?", req.body.product, req.body.sugar, req.body.ice, req.user.username,
        function(err, rows){
            if(!err){
                if (rows.length!=0){
                    //點過相同飲料 更新飲料數量
                    db.run("UPDATE cart SET quantity=? WHERE product=? and sugar=? and ice=? and author=?", 
                        parseInt(rows[0].quantity) + parseInt(req.body.quantity), req.body.product, req.body.sugar, req.body.ice, req.user.username,
                    function(err){
                        if (err)
                            req.flash("error", "加入購物車失敗");
                        else
                            req.flash("success","加入購物車成功");
                        res.redirect("new");
                    });
                }else{
                    //未點過相同飲料 新增資料
                    db.run("INSERT INTO cart VALUES (?,?,?,?,?)", req.body.product, req.body.sugar, req.body.ice, req.body.quantity, req.user.username,
                    function(err){
                        if (err)
                            req.flash("error", "加入購物車失敗");
                        else
                            req.flash("success","加入購物車成功");
                        res.redirect("new");
                    });
                }
            }
        });
    });
});

router.get("/cart", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.all("SELECT * " + 
                "FROM cart, menu " +
                "WHERE cart.product=menu.product and author=?" + 
                "ORDER BY menu.class ", req.user.username,
         function(err, rows){
             if (err)
                 console.log(err);
             else
                res.render('orderInfo/cart', {data: rows});
         });
     });
});

router.delete("/cart_detail", function(req, res){
    db.serialize(function() {
      db.run("DELETE FROM cart WHERE product=? and sugar=? and ice=? and author=?", req.body.product, req.body.sugar, req.body.ice, req.user.username,
      function(err){
            if (err)
                req.flash("error", "刪除失敗");
            else
                req.flash("success","刪除成功");
            res.redirect("cart");
        });
    });
});

router.delete("/cart", function(req, res){
    db.serialize(function() {
        db.run("DELETE FROM cart WHERE author=?", req.user.username, 
        function(err){
            if (err)
                req.flash("error", "購物車清空失敗");
            else
                req.flash("success","購物車已清空");
            res.redirect("cart");
        });
    });
});

router.put("/cart", function(req, res){
    db.serialize(function() {
        //查詢購物車內是否已有相同飲料
        db.all("SELECT * FROM cart WHERE product=? and sugar=? and ice=? and author=?", req.body.product, req.body.sugar, req.body.ice, req.user.username,
        function(err, rows){
            if(!err){                
                if (rows.length!=0 && req.body.old_sugar != req.body.sugar && req.body.old_ice != req.body.ice){
                    //更新後的飲料與舊飲料不同 且 更新後的飲料已點過 刪除舊飲料 更新已點過的飲料數量
                    db.run("DELETE FROM cart WHERE product=? and sugar=? and ice=? and author=?",  
                        req.body.product, req.body.old_sugar, req.body.old_ice, req.user.username);
                    db.run("UPDATE cart SET quantity=? WHERE product=? and sugar=? and ice=? and author=?", 
                        parseInt(rows[0].quantity) + parseInt(req.body.quantity), req.body.product, req.body.sugar, req.body.ice, req.user.username,
                    function(err){
                        if (err)
                            req.flash("error", "更新購物車失敗");
                        else
                            req.flash("success","更新購物車成功");
                        res.redirect("cart");
                    });
                }else if(rows.length!=0 && req.body.old_sugar == req.body.sugar && req.body.old_ice == req.body.ice){
                    //僅更新飲料數量 甜度冰塊不變
                    db.run("UPDATE cart SET quantity=? WHERE product=? and sugar=? and ice=? and author=?", 
                        req.body.quantity, req.body.product, req.body.sugar, req.body.ice, req.user.username,
                    function(err){
                        if (err)
                            req.flash("error", "更新購物車失敗");
                        else
                            req.flash("success","更新購物車成功");
                        res.redirect("cart");
                    });
                }else{
                    //更新後的飲料與舊飲料不同 且 更新後的飲料未點過 更新舊資料
                    db.run("UPDATE cart SET sugar=?, ice=?, quantity=? WHERE product=? and sugar=? and ice=? and author=?", 
                            req.body.sugar, req.body.ice, req.body.quantity, req.body.product, req.body.old_sugar, req.body.old_ice, req.user.username,
                    function(err){
                        if (err)
                            req.flash("error", "更新購物車失敗");
                        else
                            req.flash("success","更新購物車成功");
                        res.redirect("cart");
                    });
                }
            }
        });
     });
 });

router.get("/checkout", middleware.isLoggedIn, function(req, res){
    db.serialize(function() {
        db.all("SELECT * " + 
                "FROM cart, menu " +
                "WHERE cart.product=menu.product and author=?" + 
                "ORDER BY menu.class ", req.user.username,
         function(err, rows){
             if (err)
                 console.log(err);
             else
                res.render('orderInfo/checkout', {data: rows});
         });
     });
});

router.get("/:id", middleware.checkOrderOwner, function(req, res){
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