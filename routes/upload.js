const express = require('express'),
    router = express.Router(),
    path = require('path'),
    { v4: uuidv4 } = require('uuid'),
    fs = require('fs'),
    multer = require('multer');

const upload = multer({
    limits: {
        fileSize: 8 * 1024 * 1024,
    }
});

module.exports = (client) => {

    router.post('/img/room', upload.single('image'), async (req, res) => {
        let { room_id } = req.body;
        if (req.user && room_id && req.user.rooms.some(x => x.id == room_id)) {
            if (!req.file?.buffer) return res.sendStatus(400);
            let upload_path = `/uploads/rooms/${room_id}/${uuidv4()}.jpg`;
            try {
                fs.writeFile(path.join(__dirname, '/../public' + upload_path), req.file.buffer, (err, result) => {
                    if (!err) res.status(200).send(upload_path);
                    else {
                        console.log(err);
                        res.status(400).send('Something went wrong, try again later');
                    }
                });
            } catch (err) {
                console.log(err);
                res.status(400).send('Something went wrong, try again later');
            }
        } else res.status(403).send('forbidden');
    });
 
    return router;
}
