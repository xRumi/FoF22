const express = require('express'),
    router = express.Router(),
    path = require('path'),
    { v4: uuidv4 } = require('uuid'),
    fs = require('fs'),
    multer = require('multer');

const room_upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            let { room_id } = req.body;
            cb(null, path.join(__dirname, `/../public/uploads/rooms/${room_id}`));
        },
        filename: (req, file, cb) => {
            cb(null, uuidv4() + path.extname(file.originalname).substring(0, 6));
        }
    }),
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        let { room_id } = req.body;
        if (!file.originalname) return cb('File does not have a name', false);
        if (req.user && room_id && req.user.rooms.some(x => x.id == room_id))
            return cb(null, true);
        else return cb('You are not in the room or does not exist', false);
    }
}).single('attachment');

module.exports = (client) => {

    router.post('/room', (req, res) => {
        room_upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.log(err);
                return res.status(400).send('Something went wrong, try again later');
            } else if (err) return res.status(400).send(err);
            let { room_id } = req.body;
            res.status(200).send(`/uploads/rooms/${room_id}/${req.file.filename}`);
        });
    });

    /*
    
    router.post('/img/room', upload.single('image'), async (req, res) => {
        let { room_id } = req.body;
        if (req.user && room_id && req.user.rooms.some(x => x.id == room_id)) {
            if (!req.file?.buffer) return res.sendStatus(400);
            let folder_path = `/uploads/rooms/${room_id}`
            let upload_path = `${folder_path}/${uuidv4()}.jpg`;
            try {
                if (!fs.existsSync(path.join(__dirname, '/../public' + folder_path)))
                    fs.mkdirSync(path.join(__dirname, '/../public' + folder_path), { recursive: true });
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
    */
 
    return router;
}
