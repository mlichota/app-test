var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var data2 = [];

var params = {
    Bucket: 'mlichota-test'    
};

var allKeys = [];
listAllKeys();
function listAllKeys() {
    s3.listObjectsV2(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {
            var contents = data.Contents;
            contents.forEach(function (content) {
                allKeys.push(content.Key);
            });

            if (data.IsTruncated) {
                params.ContinuationToken = data.NextContinuationToken;
                console.log("get further list...");
                listAllKeys();
            } 

        }
    });
}