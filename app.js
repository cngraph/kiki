/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

//mongodb
var MongoStore = require("connect-mongo")(express);
var settings = require("./settings");

var app = express();

// all environments
app.configure(function(){
	app.set('port', process.env.PORT || 1000);
	app.set("views",__dirname + "/views");
	app.set("view engine","ejs");
	//图片上传临时目录
	app.use(express.bodyParser({uploadDir:"./uploads"}));
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: settings.cookieSecret,
		store: new MongoStore({
			db: settings.db
		})
	}));
	var flash = require('connect-flash');
	app.use(flash());
	app.use(function(req, res, next){
		  var error = req.flash('error');
		  var success = req.flash('success');
		  res.locals.user = req.session.user;
		  res.locals.error = error.length ? error : null;
		  res.locals.success = success ? success : null;
		  next();
	});
	
	//app.use(express.router(routes));
	app.use(app.router);
	app.use(express.static(__dirname + "/public"));
});

// development only
app.configure("development",function(){
	app.use(express.errorHandler());
});

routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});







