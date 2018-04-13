var express = require('express');
var router = express.Router();
var passport = require('passport');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var fs = require('fs');
var path = require('path');
var rmdir = require('rimraf');


// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Register User
router.post('/register', function (req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;


	// Validation
	req.checkBody('username', 'Wprowadź login!').notEmpty();
	req.checkBody('password', 'Wprowadź hasło!').notEmpty();
	req.checkBody('password2', 'Wprowadzone hasła różnią się!').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	} else {
		var newUser = new User({
			username: username,
			password: password
		});

		User.createUser(newUser, function (err, user) {
			if (err) throw err;
			console.log(user.username);

			var params = {
				Bucket: 'mlichota-test-' + user.username, /* required */
				ACL: 'private',
				CreateBucketConfiguration: {
					LocationConstraint: "eu-central-1"
				},


			};
			s3.createBucket(params, function (err, data) {
				if (err) console.log(err, err.stack); // an error occurred
				else console.log(data);           // successful response
			});

		});

		req.flash('success_msg', 'Sukces! Możesz się zalogować używając swoich danych');

		res.redirect('/users/login');
	}
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Nieznany użytkownik!' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Wprowadziłeś błędne hasło!' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		
		
		
	
		
		
		
		
				
		
		
		
		
		
		
		
		
		res.redirect('/');
		













	});

router.get('/logout', function (req, res) {
	req.logout();
	
	rmdir(req.session.tmpDir, function(error){});
	console.log('Usuwam folder tymczasowy: ' + req.session.tmpDir)

	req.flash('success_msg', 'Zostałeś wylogowany');

	res.redirect('/users/login');
});

module.exports = router;