const secret = "i_hate_FoF22",
    http = require('http'),
    crypto = require('crypto'),
    spawn = require('child_process').spawn;

http.createServer(function (req, res) {
    req.on('data', function(chunk) {
        let sig = "sha1=" + crypto.createHmac('sha1', secret).update(chunk.toString()).digest('hex');
        if (req.headers['x-hub-signature'] == sig) {
            let pull = spawn('git pull', { shell: true });
            pull.stdout.on('data', function (data) {
                console.log(data.toString());
            });
            pull.stderr.on('data', function (data) {
                console.log(data.toString());
            });
            pull.on('exit', function (code) {
                console.log('child process exited with code ' + code.toString());
            });
        }
    });
    res.end();
}).listen(81);
