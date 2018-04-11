var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var data2 = [];
var i = 0;

var params = {
    Bucket: "mlichota-test",
};
s3.listObjectsV2(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     //console.log(data);           // successful response
    var contents = data.Contents;
    contents.forEach(function (data) {
        data2.push(data.Key);
    });
    
 
   console.log(data2)
  

});


