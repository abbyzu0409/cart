var sqlite3 = require("sqlite3");
var db = new sqlite3.Database("cart");

var middlewareObj = {};

middlewareObj.checkOrderOwner = function(req, res, next) {
    if(req.isAuthenticated()){
        db.serialize(function() {
            db.all("SELECT * FROM orderInfo WHERE id=? and author=?", req.params.id, req.user.username, 
            function(err, rows){
                if (rows.length == 0){
                    req.flash("error", "無權限使用");
                    res.redirect("/orderInfo");
                }
                else
                    next();
            });
        });
    } else{
        req.flash("error", "請先登入");
        res.redirect("/login");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated())
        return next();
    req.flash("error", "請先登入");
    res.redirect("/login");
}

module.exports = middlewareObj;