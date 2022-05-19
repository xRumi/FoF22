const router = require('express').Router();

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user) res.render("index", { user: req.user, route: 'messages' });
        else res.status(403).redirect('/login?ref=messages');
    });

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            Promise.all(req.user.rooms.map(x => client.database.functions.get_room(x.id))).then(rooms => {
                Promise.all(rooms.map(room => client.database.chat.findById(room.chat_id))).then(async chats => {
                    let data = chats.map(chat => {
                        let room = rooms.find(y => y.chat_id == chat.id);
                        if (room && chat && chat.room_id == chat.id) {
                            let last_message = chat.messages[chat.messages.length - 1], name, _user, image;
                            if (room.type == 'private') {
                                _user = await client.database.functions.get_user(room.members[0] == req.user.id ? room.members[1] : room.members[0]);
                                if (_user) {
                                    name = _user.username;
                                    image = `/dist/img/users/${_user.id}/profile.png`
                                } else name = 'Not Found';
                            } else name = room.name;
                            let user_room_unread = req.user.rooms.find(z => z.id == room.id)?.unread;
                            return {
                                id: room.id,
                                name,
                                image: image || `/dist/img/users/61d001de9b64b8c435985da9/profile.png`,
                                time: last_message?.time,
                                last_message: last_message?.message || 'This message was deleted',
                                unread: user_room_unread
                            };
                        }
                    });
                    res.status(200).send(data);
                });
            });
        } else res.status(403).send('forbidden');
    });

    return router;

}
