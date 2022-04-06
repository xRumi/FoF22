const router = require('express').Router();

router.get('/', async (req, res) => {
    if (req.user) res.render("index", { user: req.user, route: 'messages' });
    else res.status(403).redirect('/login?ref=messages');
});

router.get('/fetch', async (req, res) => {
    if (req.user) {
        Promise.all(req.user.rooms.map(x => req.client.database.functions.get_room(x))).then(rooms => {
            Promise.all(rooms.map(room => req.client.database.chat.findById(room.chat_id))).then(async chats => {
                let data = [];
                for (let i = 0; i < rooms.length; i++) {
                    let room = rooms[i];
                    let chat = chats[i];
                    if (room && chat && room.chat_id === chat.id) {
                        let last_message = chat.messages[chat.messages.length - 1], name, _name;
                        if (room.type == 'private') {
                            _name = room.members[0] === req.user.id ? await req.client.database.functions.get_user(room.members[1]) : await req.client.database.functions.get_user(room.members[0]);
                            if (_name) name = _name.username;
                            else name = 'Not Found';
                        } else name = room.name;
                        data.push({
                            id: room.id,
                            name,
                            image: `/dist/img/profile/61d001de9b64b8c435985da9.png`,
                            time: last_message?.time,
                            last_message: last_message?.message || 'This message was deleted',
                        });
                    }
                }
                res.status(200).send(data);
            });
        });
    } else res.status(403).send('forbidden');
});

router.get('/private/:room_id', async (req, res) => {
    if (req.user) {
        let room_id = req.params.room_id;
        if (req.user.rooms.includes(room_id)) {
            let room = await req.client.database.functions.get_room(room_id);
            if (room) {
                let _name = room.name.split('.'),
                    name = _name[0] == req.user.username ? _name[1] : _name[0];
                res.render("index", { user: req.user, page: name, route: 'messages.private', args: `{room_id:'${room_id}',name:'${name}'}` });
            }
        }
    } else res.status(403).redirect('/login?ref=messages');
});

router.get('/private/:room_id/fetch', async (req, res) => {
    if (req.user) {
        let room_id = req.params.room_id;
        if (req.user.rooms.includes(room_id)) {
            let room = await req.client.database.functions.get_room(room_id);
            if (room) {
                let chat = await req.client.database.chat.findById(room.chat_id);
                if (chat) res.status(200).send({ messages: chat.messages.slice(-10), room_id: room.id, title: room.name })
            }
        }
    } else res.status(403).send('forbidden');
})

module.exports = router;