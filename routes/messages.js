const router = require('express').Router();

router.get('/', async (req, res) => {
    if (req.user) res.render("index", { user: req.user, route: 'messages' });
    else res.status(403).redirect('/login?ref=messages');
});

router.get('/fetch', async (req, res) => {
    if (req.user) {
        const room_data = [];
        for (const x of req.user.rooms) {
            let room = await req.client.database.functions.get_room(x);
            if (room) {
                let name, chat = await req.client.database.chat.findById(room.chat_id);
                if (room.type == 'private') {
                    if (room.members[0] == req.user.id) {
                        let _friend = await req.client.database.functions.get_user(room.members[1]);
                        if (_friend) name = _friend.name || _friend.username;
                    } else {
                        let _friend = await req.client.database.functions.get_user(room.members[0]);
                        if (_friend) name = _friend.name || _friend.username;
                    }
                } else name = room.name;
                let last_message = chat.messages[chat.messages.length - 1];
                room_data.push({
                    name,
                    id: room.id,
                    image: `/dist/img/profile/61d001de9b64b8c435985da9.png`,
                    last_message: last_message?.message,
                    time: last_message?.time
                });
            }
        }
        res.status(200).send(room_data);
    } else res.status(403).send('forbidden');
});

router.get('/private/:room_id', async (req, res) => {
    if (req.user) {
        let room_id = req.params.room_id;
        if (req.user.rooms.includes(room_id)) {
            let room = await req.client.database.functions.get_room(room_id);
            if (room) {
                let name, _name = room.name.split('.');
                if (_name[0] == req.user.username) name = _name[1];
                else name = _name[0];
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