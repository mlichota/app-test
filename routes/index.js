var express = require('express');
var router = express.Router();
var fileUpload = require('express-fileupload');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var fs = require('fs');
var dataFormated = [];
var path = require('path');






router.get('/', ensureAuthenticated, function (req, res) {
	res.render('index');


});
router.get('/upload', ensureAuthenticated, function (req, res) {
	res.render('upload');

	router.use(fileUpload({ safeFileNames: true, preserveExtension: true }));

	router.post('/upload', function (req, res) {
		if (!req.files)
			return res.status(400).send('No files were uploaded.');

		let sampleFile = req.files.sampleFile;
		let filename = req.files.sampleFile.name;

		sampleFile.mv(filename, function (err) {
			if (err)
				return res.status(500).send(err);

			fs.readFile(filename, function (err, data) {
				
				if (err) { throw err; }

				params = { Bucket: 'mlichota-test', Key: filename, Body: data };

				s3.putObject(params, function (err, data) {

					if (err) {

						console.log(err)

					} else {

						console.log("Successfully uploaded data to myBucket/myKey");
						req.flash('success_msg', 'Sukces! Plik: ' + filename + ' został przesłany');
						res.redirect('upload');

						fs.unlink(filename, (err) => {
							if (err) throw err;
							console.log('Successfully deleted: ' + filename);
						});
					}
				});
			});
		});
	});
});
router.get('/download', ensureAuthenticated, function (req, res) {


	var params = {
		Bucket: "mlichota-test",
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

		res.render('download', { list: dataFormated });
		console.log(dataFormated)
	});

	

});
router.get('/download-file-s3', ensureAuthenticated, function(req, res){
	console.log('file: ' + req.query.file);
	var params = {
		Bucket: "mlichota-test",
		Key: req.query.file
	};
	var filePath = path.join(__dirname, "../tmp/" + req.query.file);
	
var file = fs.createWriteStream(filePath, 'utf8');

file.on('finish', function(){ 
    console.log(req.query.file + " downloaded");
});

file.on('error', function(e){ 
    console.log("Error downloading file", e);
});

s3.getObject(params).createReadStream().pipe(file);


//res.download('./tmp/'+req.query.file);

//next();

//res.render('download', { list: dataFormated });



res.render('downloading', { list: dataFormated });
});

router.get('/download-file-local', ensureAuthenticated, function(req, res){  
	res.download("./tmp/avatar.jpg")
}); 


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();

	} else {
		
		res.redirect('/users/login');
	}
}


module.exports = router;