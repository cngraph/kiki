var mongodb = require("./db");
var User = require("./user.js");
function Post(username,talktitle, post, parentid, id, time, comments, avatar, reads ) {
	this.user = username;
	this.talktitle = talktitle;
	this.post = post;
	this.parentid = parentid;
	this.id = id || null;
	time ? this.time = time : this.time = new Date();
	this.comments = comments ;
	avatar ? this.avatar = avatar : this.avatar = null;
	reads ? this.reads = reads : this.reads = 0;
};
module.exports = Post;

//日期格式化
Date.prototype.format = function(obj,ftt){
	var o = {};  //月份MM必须大写  分钟mm必须小写
	o = {
		year:obj.getYear()+1900,  //年
		month:formatNum(obj.getMonth()+1),  //月
		day:formatNum(obj.getDate()),  //日
		hours:formatNum(obj.getHours()),  //小时
		minutes:formatNum(obj.getMinutes()),  //分钟
		seconds:formatNum(obj.getSeconds())  //秒
	}
	function formatNum(n){
		var fn = "";
		parseInt(n) < 10 ? fn = "0" + n : fn = n;
		return fn;
	}
	var fmt = ftt.match(/[a-zA-Z]+/g);
	for(var i=0; i < fmt.length; i++){
		var doc = fmt[i];
		if(doc == "yy" || doc == "YY"){
			ftt = ftt.replace(new RegExp(doc),o.year);
		}else if(doc == "MM"){
			ftt = ftt.replace(new RegExp(doc),o.month);
		}else if(doc == "dd" || doc == "DD"){
			ftt = ftt.replace(new RegExp(doc),o.day);
		}else if(doc == "hh" || doc == "HH"){
			ftt = ftt.replace(new RegExp(doc),o.hours);
		}else if(doc == "mm"){
			ftt = ftt.replace(new RegExp(doc),o.minutes);
		}else if(doc == "ss" || doc == "SS"){
			ftt = ftt.replace(new RegExp(doc),o.seconds);
		}else{
			break;
		}
	}
	return ftt;
};

Post.prototype.save = function save(callback){
	//存入 Mongodb 的文档
	var post = {
			user: this.user,
			talktitle:this.talktitle,
			post: this.post,
			parentid: this.parentid,
			//id: this.id,
			time: this.time
	};
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取 posts 集合
		db.collection("posts", function(err,collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//为 user 属性添加索引
			collection.ensureIndex("user");
			// 写入 post 文档
			collection.insert(post, {safe: true}, function(err, post){
				mongodb.close();
				callback(err, post);
			});
		});
	});
};

Post.prototype.update = function update(conditions, contents, callback){
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		//读取 users 集合
		db.collection("posts", function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 写入 posts 文档
			collection.update(conditions, {$set:contents}, function(err, user){
				mongodb.close();
				callback(err,user);
			});
		});
	});
};

Post.get = function get(para, callback) {
	mongodb.open(function(err, db){
		if (err){
			return callback(err);
		}
		// 读取 posts 集合
		db.collection("posts", function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// 查找 user 属性为 username 的文档，如果 username 是null 则匹配全部
			var query = {};
			query.parentid = null;
			if (para.username) {
				query.user = para.username;
			}
			if (para.id) {
				query.parentid = para.id.toString();
			}
			collection.find(query).sort({time: -1}).toArray(function(err, docs) {
				if (err) {
					callback(err, null);
				}
				// 封装 posts 为 Post 对象
				var posts= [];
				var k = 0;
				if(docs.length == 0){
					mongodb.close();
					callback(null, posts);                                                                                                                                                         
				}
				var person = {};
				//打开users表
				db.collection("users", function(err, usercollection){
					//轮询操作
					docs.forEach(function(doc, index) {
						var comments = 0;
						//查询有多少条回复这个记录的
						collection.find({parentid: doc._id.toString()}).toArray(function(err, ds) {
							//回复条数
							comments = ds.length;
							//如果已经有对象的头像地址，那么直接使用，不用查找了
							if(person[doc.user]){
								if(k == docs.length-1){
									mongodb.close();
								}
								var post = new Post(doc.user, doc.talktitle, doc.post, null, doc._id, new Date().format(doc.time,"yy年MM月dd日  hh:mm:ss"), comments, person[doc.user]);
								posts[index] = post;
								if(k == docs.length-1){
									callback(null, posts);
								}
								k++;
							}else{ //如果没有，直接查找相关数据
								if (err) {
									mongodb.close();
									return callback(err);
								}
								// 查找 name 属性为 username 的文档
								usercollection.findOne({name:doc.user}, function(err, udoc) {
									if(k == docs.length-1){
										mongodb.close();
									}
									person[doc.user] = udoc.avatar;
									var post = new Post(doc.user, doc.talktitle, doc.post, null, doc._id, new Date().format(doc.time,"yy年MM月dd日  hh:mm:ss"), comments, udoc.avatar, doc.reads);
									posts[index] = post;
									if(k == docs.length-1){
										callback(null, posts);
									}
									k++;
								});
							}
						});
					});
					
					
					
					
				});
				
				
			});
		});
	});
};



