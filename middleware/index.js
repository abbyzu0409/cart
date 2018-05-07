var sqlite3 = require("sqlite3");
var db = new sqlite3.Database("cart");

var middlewareObj = {};

middlewareObj.checkOrderOwner = function(req, res, next) {
 if(req.isAuthenticated()){
        db.serialize(function() {
            db.all("SELECT * FROM user WHERE username=? and password=?", req.user.username, req.user.password, 
            function(err, rows){
                if (!rows){
                    req.flash("error", "無權限使用");
                    res.redirect("/orderInfo/" + req.params.id);
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