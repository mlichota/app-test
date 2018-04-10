var express = require('express');
var router = express.Router();
var fileUpload = require('express-fileupload');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var myBucket = 'mlichota-test';
var filename;


// Get Homepage





router.get('/', ensureAuthenticated, function (req, res) {
	res.render('index');

	router.use(fileUpload({ safeFileNames: true, preserveExtension: true }));

	router.post('/upload', function (req, res) {
		if (!req.files)
			return res.status(400).send('No files were uploaded.');

		let sampleFile = req.files.sampleFile;

		sampleFile.mv(req.files.sampleFile.name, function (err) {
			if (err)
				return res.status(500).send(err);

			req.flash('success_msg', 'Sukces! Plik tymczasowy utworzony');
			filename = req.files.sampleFile.name;
		});

		// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file

		//console.log(filename);


		// Use the mv() method to place the file somewhere on your server
		params = { Bucket: myBucket, Key: filename, Body: 'Valueeee or some data' };
		s3.putObject(params, function (err, data) {

			if (err) {

				console.log(err)

			} else {

				console.log("Successfully uploaded data to myBucket/myKey");
				req.flash('success_msg', ' oraz przesłany do chmury S3');
				res.redirect('/');
				//req.flash('success_msg', 'Przesłano do serwera S3');
				//	res.redirect('/');
			}




		/* sampleFile.mv(req.files.sampleFile.name, function(err) {
		   if (err)
			 return res.status(500).send(err);
	    
			 req.flash('success_msg', 'Sukces! Plik załadowany');
			 res.redirect('/');
	   
		 });
	   
	   */	});
	});
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();

	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}


module.exports = router;