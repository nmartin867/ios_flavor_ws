var request = require('request');
var express = require('express');
var app = express();

var imageDir = __dirname + '/images';
var kimonoUrl = 'http://www.kimonolabs.com/api/e1d6376a?apikey=17f07be1fa51fb9ee534beac571794b6';

app.get('/', function(req, res){
	res.send('hello world');
});

app.get('/refresh', function(req, res){
	request(kimonoUrl, function (error, response, body) {
		statCode = response.statusCode;
		if (!error && response.statusCode == 200) {
   			 res.statusCode = statCode;
			 res.json(response.body);
			}else{
			 res.statusCode = statCode;
			 res.send(error);
			}
	});
});

var download = function(uri, filename, callback){
	request.head(uri, function(err, res, body){
		console.log('content-type:', res.headers['content-type']);
		console.log('content-length:', res.headers['content-length']);
		request(uri).pipe(fs.createWriteStream(imageDir + '/' + filename)).on('close', callback);
	});
};

app.listen(3000);