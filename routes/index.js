
/*
 * GET home page.
 */
var crypto = require("crypto");
var User = require("../models/user.js");
var Post = require("../models/post.js");
var Item = require("../models/item.js");
//移动文件需要使用fs模块
var fs = require('fs');

module.exports = function (app) {
	//首页
    app.get('/', function (req, res) {
    	Post.get({username:null}, function(err, posts) {
    		if (err) {
    			posts = [];
    		}
    		res.render('index', { 
            	title: "首页" ,
            	posts: posts
            });
    	})
    });
    
    //注册
    app.get("/reg", checkNotLogin);
    app.get("/reg", function (req, res) {
        res.render('reg', { title: "用户注册" });
    });
    
    //注册提交
    app.post("/reg", checkNotLogin);
    app.post("/reg", function(req, res){
    	//检查用户两次输入的口令是否一致
    	if (req.body["password-repeat"] != req.body["password"]){
    		req.flash("error","两次输入的口令不一致");
    		return res.redirect("/reg");
    	}
    	//生成口令的数列值
    	var md5 = crypto.createHash("md5");
    	var password = md5.update(req.body.password).digest("base64");
    	
    	var newUser = new User({
    		name: req.body.username,
    		password: password
    	});
    	//检查用户名是否已经存在
    	User.get(newUser.name, function(err,user){
    		if (user){
    			err = "Username already exists.";
    		}
    		if (err){
    			req.flash("error", err);
    			return res.redirect("/reg");
    		}
    		//如果不存在则新增用户
    		newUser.save(function(err){
    			if (err) {
    				req.flash("error",err);
    				return res.redirect("/reg");
    			}
    			req.session.user = newUser;
    			req.flash("success","注册成功");
    			res.redirect("/");
    		});
    	})
    });
    //登录
    app.get("/login", checkNotLogin);
    app.get("/login", function(req, res) {
    	res.render("login",{
    		title:"用户登录"
    	});
    });
    //登录提交
    app.post("/login", checkNotLogin);
    app.post("/login", function(req, res) {
    	//生成口令的数列值
    	var md5 = crypto.createHash("md5");
    	var password = md5.update(req.body.password).digest("base64");
    	
    	User.get(req.body.username, function(err, user){
    		if (!user){
    			req.flash("error","用户不存在");
    			return res.redirect("/login");
    		}
    		if (user.password != password) {
    			req.flash("error","用户口令错误");
    			return res.redirect("/login");
    		}
    		req.session.user = user;
    		req.flash("success","登录成功");
    		res.redirect("/");
    	});
    });
    //退出
    app.get("/logout", checkLogin);
    app.get("/logout",function(req, res) {
    	req.session.user = null;
    	req.flash("success","退出成功");
    	res.redirect("/");
    });
    //发表话题
    app.post("/post", checkLogin);
    app.post("/post", function(req, res) {
    	var currentUser = req.session.user;
    	var post = new Post(currentUser.name, req.body.talkTitle, req.body.post);
    	post.save(function(err){
    		if (err) {
    			req.flash("error", err);
    			return res.redirect("/");
    		}
    		req.flash("success", "发表成功");
    		res.redirect("/u/" + currentUser.name);
    	});
    });
    //评论话题
    app.post("/backpost", function(req, res) {
    	var currentUser = req.session.user;
    	var pid = req.body.parentid;
    	var post = new Post(currentUser.name, req.body.talkTitle, req.body.post, pid);
    	post.save(function(err){
    		if (err) {
    			req.flash("error", err);
    			return res.redirect("/");
    		}
    		req.flash("success", "发表成功");
    		res.redirect("/topic/" + pid);
    	});
    });
    
    //个人设置
    app.get("/setting", checkLogin);
    app.get("/setting", function (req, res) {
    	var currentUser = req.session.user;
    	User.get(currentUser.name,function(err, user){
    		res.render('upload-img', { title: "个人设置" ,person:user});
    	});
        
    });
        
    //文件上传处理
	app.post('/file-upload', function(req, res) {
	  //console.log(req.body);  req.files.thumbnail.name; console.log(req.files.thumbnail.type);
	  var currentUser = req.session.user;
	  // 获得文件的临时路径
	  var tmp_path = req.files.thumbnail.path;
	  // 指定文件上传后的目录 - 示例为"images"目录。 
	  var filetime = new Date().getTime();
	  var docType = "";
	  switch(req.files.thumbnail.type.toLowerCase()){
		  case "image/jpeg":
			  docType = ".jpg";
			  break;
		  case "image/gif":
			  docType = ".gif";
			  break;
		  case "image/png":
			  docType = ".png";
			  break;
		  default:
			  return;
	  }
	  var target_path = './public/images/' + filetime + docType;
	  
	  //更新头像记录
	  var newUser = new User(currentUser);
	  newUser.update({name:currentUser.name}, {avatar:'/images/' + filetime + docType}, function(err,user){
		  //res.redirect("/upload-img");
	  });
	  
	  // 移动文件
	  fs.rename(tmp_path, target_path, function(err) {
		  if (err) throw err;
		  // 删除临时文件夹文件
		  fs.unlink(tmp_path, function() {
		     if (err) throw err;
		     res.redirect("/setting");
		     //res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
		  });
	  });
	  
	});
    
    
	
    app.get("/u/:user", function(req, res){
    	User.get(req.params.user, function(err, user){
    		if (!user) {
    			req.flash("error", "用户不存在");
    			return res.redirect("/");
    		}
    		Post.get({username:user.name}, function(err,posts){
    			if (err) {
    				req.flash("error", err);
    				return res.redirect("/");
    			}
    			res.render("user",{
    				title: user.name,
    				posts: posts
    			});
    		});
    	});
    });
    app.get("/topic/:tid", function(req, res){
    	Item.get(req.params.tid, function(err, item){
    		if (!item) {
    			req.flash("error", "用户不存在");
    			return res.redirect("/");
    		}
    		User.get(item.user,function(err,doc){
    			Post.get({id:req.params.tid}, function(err,posts){
        			if (err) {
        				req.flash("error", err);
        				return res.redirect("/");
        			}
        			res.render("topic",{
        				id:req.params.tid,
        				title: item.talktitle,
        				users:item.user,
        				author:item.user,
        				avatar:doc.avatar,
        				talktitle:item.talktitle,
        				time:new Date().format(item.time,"yy年MM月dd日  hh:mm:ss"),
        				post:item.post,
        				comment: posts
        			});
        		});
    		});
    		
    	});
    });
    
    
    
};

function checkLogin(req, res, next) {
	if (!req.session.user) {
		req.flash("error", "未登录");
		return res.redirect("/login");
	}
	next();
}

function checkNotLogin(req, res, next){
	if (req.session.user){
		req.flash("error", "已登录");
		return res.redirect("/");
	}
	next();
}

