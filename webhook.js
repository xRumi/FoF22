const secret = "i_hate_FoF22";

const http = require('http');
const crypto = require('crypto');
const exec = require('child_process').exec;

http.createServer(function (req, res) {
    req.on('data', function(chunk) {
        let sig = "sha1=" + crypto.createHmac('sha1', secret).update(chunk.toString()).digest('hex');
        if (req.headers['x-hub-signature'] == sig) {
            console.log('webhook received');
            exec('git pull');
        }
    });
    res.end();
}).listen(81);