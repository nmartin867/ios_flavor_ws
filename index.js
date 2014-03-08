var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/treefort');
var path = require('path');
var fs = require('fs');
var graceFs = require('graceful-fs');
var request = require('request');
var express = require('express');
var app = express();

var imageDir = __dirname + '/images';
var kimonoUrl = 'http://www.kimonolabs.com/api/e1d6376a?apikey=17f07be1fa51fb9ee534beac571794b6';
var db = mongoose.connection;
var dbConnectionOpen = false;
var artistSchema = mongoose.Schema({
	name: String,
	city: String,
	imageFile: String
});
var Artist = mongoose.model('Artist', artistSchema);

var download = function(uri, filename, callback){
	var filePath = imageDir + '/' + filename;
	request.head(uri, function(err, res, body){
		if (graceFs.existsSync(filePath)) {
			return;
		}
		request(uri).pipe(graceFs.createWriteStream(filePath)).on('close', callback);
	});
};

/** Mongo Connection Callbacks**/
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	dbConnectionOpen = true;
});

/**Create Image Dir**/
if (!fs.existsSync(imageDir)) {
	fs.mkdirSync(imageDir);
}

app.get('/', function(req, res){
	var query = Artist.find()
	.sort('-name')
	.select('name city imageFile');
	query.exec(function (err, artists) {
		if (err) return handleError(err);
		res.json(artists);
	});
});

app.get('/image/:imagename', function(req, res){
	var filePath = imageDir + '/' + req.params.imagename;
	graceFs.readFile(filePath, function (err, data) {
		if (err) throw err;
		res.setHeader('Content-Type', 'image/jpeg');
		res.send(data);
	});
});

app.get('/update', function(req, res){
	request(kimonoUrl, function (error, response, body) {
		statCode = response.statusCode;
		if (!error && response.statusCode == 200) {
			var obj = JSON.parse(response.body);
			var artistCollection = obj.results.collection1;
			for(var p in artistCollection){
				var imageFileName = artistCollection[p].image.alt + path.extname(artistCollection[p].image.src);
				var artist = new Artist({
					name: artistCollection[p].Artist.text,
					city: artistCollection[p].City,
					imageFile: imageFileName
				});
				Artist.update(
					{ name: artist.name },
					{
						name: artistCollection[p].Artist.text,
						city: artistCollection[p].City,
						imageFile: imageFileName
					},
					{ upsert: true },
					function (err, numberAffected, raw) {
						if (err) console.log(err);
					});
				download(artistCollection[p].image.src, imageFileName, function(){});
			}
			res.statusCode = statCode;
			res.json(response.body);
		}else{
			res.statusCode = statCode;
			res.send(error);
		}
	});
});




app.listen(3000);