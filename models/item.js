var mongodb = require("./db");
var Post = require("../models/post.js");

function Item(){
	//this._id = item.id;
}
module.exports = Item;

Item.get = function get(id, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// 读取 users 集合
		db.collection("posts", function(err, collection){
			if (err) {
				mongodb.close();
				return callback(err);
			}
			//查询_id必须要转换成对象
			var BSON = require('mongodb').BSONPure;
			var obj_id = BSON.ObjectID.createFromHexString(id);
			// 查找 name 属性为 username 的文档
			collection.findOne({"_id":obj_id}, function(err, doc) {
				mongodb.close();
				var reads;
				if(parseInt(doc.reads) > 0){
					reads = ++doc.reads;
				}else{
					reads = 1;
				}
				var post = new Post(doc.user, doc.talktitle, doc.post, doc.parentid, doc.time);
				post.update({_id:obj_id}, {reads:reads}, function(err,con){
					if (doc) {
						callback(err, doc);
					} else {
						callback(err, null);
					}
				});
				
				
			});
		});
	});
};