const router = require('express').Router();

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user) res.render("index", { user: req.user, route: 'messages' });
        else res.status(403).redirect('/login?ref=messages');
    });

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            Promise.all(req.user.rooms.map(x => client.database.functions.get_room(x))).then(rooms => {
                Promise.all(rooms.map(room => client.database.chat.findById(room.chat_id))).then(async chats => {
                    let data = [];
                    for (let i = 0; i < rooms.length; i++) {
                        let room = rooms[i];
                        let chat = chats[i];
                        if (room && chat && room.chat_id === chat.id) {
                            let last_message = chat.messages[chat.messages.length - 1], name, _name;
                            if (room.type == 'private') {
                                _name = room.members[0] === req.user.id ? await client.database.functions.get_user(room.members[1]) : await client.database.functions.get_user(room.members[0]);
                                if (_name) name = _name.username;
                                else name = 'Not Found';
                            } else name = room.name;
                            data.push({
                                id: room.id,
                                name,
                                image: `/dist/img/users/61d001de9b64b8c435985da9/profile.png`,
                                time: last_message?.time,
                                last_message: last_message?.message || 'This message was deleted',
                                is_unread: req.user.notification.messages.includes(room.id)
                            });
                        }
                    }
                    res.status(200).send(data);
                });
            });
        } else res.status(403).send('forbidden');
    });

    return router;

}