var express = require('express');
var router = express.Router();
var fileUpload = require('express-fileupload');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({ endpoint: 's3-us-east-2.amazonaws.com', signatureVersion: 'v4', region: 'us-east-2' });
var fs = require('fs');
var dataFormated = [];
var path = require('path');
var filePath;
var fileName;
var emptyBucket;
var session = require('express-session');
var clipboardy = require('clipboardy');



router.get('/', ensureAuthenticated, function (req, res) {
	res.render('index', { list: req.user.username });

	fs.mkdtemp(path.join(__dirname, '../temp-'), (err, folder) => {
		if (err) throw err;

		req.session.tmpDir = folder;
		console.log('Tworzę folder tymczasowy: ' + req.session.tmpDir)

	});



});

router.get('/upload', ensureAuthenticated, function (req, res) {
	res.render('upload');

	router.use(fileUpload({ safeFileNames: true, preserveExtension: true }));

	router.post('/upload', function (req, res) {


		if (req.files.sampleFile !== undefined) {

			let sampleFile = req.files.sampleFile;
			let filename = req.files.sampleFile.name;


			if (req.files.sampleFile.mimetype == 'image/jpeg' || req.files.sampleFile.mimetype == 'image/png' || req.files.sampleFile.mimetype == 'image/bmp') {

				sampleFile.mv(req.session.tmpDir + '/' + filename, function (err) {
					if (err)
						return res.status(500).send(err);

					fs.readFile(req.session.tmpDir + '/' + filename, function (err, data) {

						if (err) { throw err; }

						params = { Bucket: 'mlichota-test-' + req.user.username, Key: filename, Body: data };

						s3.putObject(params, function (err, data) {

							if (err) {

								console.log(err)

							} else {

								console.log("Successfully uploaded data to myBucket/myKey");
								req.flash('success_msg', 'Plik: ' + filename + ' został załadowany!');
								res.redirect('upload');

							}
						});

					});

				});


			}
			else {
				req.flash('error_msg', 'Plik nie jest obrazkiem! Obsługiwane typu plików: "*.jpg", "*.gif", "*.png".');
				res.redirect('upload');
			}
		}
		else {
			req.flash('error_msg', 'Nie wybrałeś pliku. Wybierz plik i spróbuj ponownie.');
			res.redirect('upload');

		}



	});

});

router.get('/download', ensureAuthenticated, function (req, res) {


	var params = {
		Bucket: 'mlichota-test-' + req.user.username,
	};


	dataFormated = [];

	s3.listObjectsV2(params, function (err, data) {
		if (err) console.log(err, err.stack);
		else

			console.log(data);

		var contents = data.Contents;
		contents.forEach(function (data) {
			dataFormated.push(data.Key);
		});
		if (data.KeyCount == 0) {
			emptyBucket = true
			res.render('download', { emptyBucket });
		}
		else {
			emptyBucket = false
			res.render('download', { list: dataFormated });
			console.log(dataFormated);
		}
	});

});

router.get('/download-file-s3', ensureAuthenticated, function (req, res) {
	fileName = req.query.file;
	var params = {
		Bucket: 'mlichota-test-' + req.user.username,
		Key: fileName
	};
	filePath = req.session.tmpDir + '/' + fileName;

	var file = fs.createWriteStream(filePath, 'utf8');

	file.on('finish', function () {
		console.log(fileName + " downloaded");
		res.download(filePath);
	});

	file.on('error', function (e) {
		console.log("Error downloading file", e);
	});

	s3.getObject(params).createReadStream().pipe(file);

});

router.get('/share-file', ensureAuthenticated, function (req, res) {
	fileName = req.query.file;




	var params = { Bucket: 'mlichota-test-' + req.user.username, Key: fileName, Expires: 300 };
	var url = s3.getSignedUrl('getObject', params, function (err, url) {
		console.log('The URL is', url);
		clipboardy.writeSync(url);
		req.flash('success_msg', 'Tymczasowy link do pliku: "' + fileName + '" został skopiowany do schowka. Link będzie aktywny przez 5 minut.');
		res.redirect('download');

	});
	// expires in 60 seconds



});


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();

	} else {

		res.redirect('/users/login');
	}
}


module.exports = router;