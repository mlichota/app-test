var express = require('express');
var router = express.Router();
var fileUpload = require('express-fileupload');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var fs = require('fs');
var dataFormated = [];
var path = require('path');
var filePath;
var fileName;
var userName;
var emptyBucket;






router.get('/', ensureAuthenticated, function (req, res) {
	res.render('index', { list: req.user.username });
	console.log(req.session);
});

fs.mkdtemp(path.join(__dirname, '../temp-'), (err, folder) => {
	if (err) throw err;
	console.log(folder);
	// Prints: /tmp/foo-itXde2 or C:\Users\...\AppData\Local\Temp\foo-itXde2
});


router.get('/upload', ensureAuthenticated, function (req, res) {
	res.render('upload');

	router.use(fileUpload({ safeFileNames: true, preserveExtension: true }));

	router.post('/upload', function (req, res) {

		//console.log(req.files.sampleFile);

		if (req.files.sampleFile !== undefined) {

			console.log('ok');
			console.log(req.files.sampleFile);

			//res.render('upload');



			let sampleFile = req.files.sampleFile;
			let filename = req.files.sampleFile.name;
			let flag = 0;


			if (req.files.sampleFile.mimetype == 'image/jpeg') {

				sampleFile.mv(filename, function (err) {
					if (err)
						return res.status(500).send(err);

					fs.readFile(filename, function (err, data) {

						if (err) { throw err; }

						params = { Bucket: 'mlichota-test-' + req.user.username, Key: filename, Body: data };

						


						s3.putObject(params, function (err, data) {
							
							if (err) {

								console.log(err)

							} else {



								console.log("Successfully uploaded data to myBucket/myKey");


								fs.unlinkSync(filename, (err) => {
									if (err) throw err;
									console.log('Successfully deleted: ' + filename);

								});


							}
						});
						//
					});

				});
				req.flash('success_msg', 'Plik: ' + filename + ' został załadowany!');

			}
			else {
				req.flash('error_msg', 'Plik nie jest obrazkiem! Obsługiwane typu plików: "*.jpg", "*.gif", "*.png".');
			}
		}
		else {
			req.flash('error_msg', 'Nie wybrałeś pliku. Wybierz plik i spróbuj ponownie.');
			console.log('pusty array');
			//res.render('upload');
		}



		res.redirect('upload');


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
		}
	});





});

router.get('/download-file-s3', ensureAuthenticated, function (req, res) {
	fileName = req.query.file;
	var params = {
		Bucket: 'mlichota-test-' + req.user.username,
		Key: fileName
	};
	filePath = path.join(__dirname, "../tmp/" + fileName);

	var file = fs.createWriteStream(filePath, 'utf8');

	file.on('finish', function () {
		console.log(fileName + " downloaded");
	});

	file.on('error', function (e) {
		console.log("Error downloading file", e);
	});

	s3.getObject(params).createReadStream().pipe(file);


	//res.download('./tmp/'+req.query.file);

	//next();

	//res.render('download', { list: dataFormated });



	res.render('downloading', { fileName });
});

router.get('/download-file-local', ensureAuthenticated, function (req, res) {
	res.download(filePath);
});


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();

	} else {

		res.redirect('/users/login');
	}
}


module.exports = router;