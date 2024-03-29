const router = require('express').Router();

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user) res.render("index", { user: req.user, route: 'messages' });
        else res.status(403).redirect('/login?back_to=/spa/messages');
    });

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            Promise.all(req.user.rooms.map(x => client.database.functions.get_room(x.id))).then(rooms => {
                Promise.all(rooms.map(room => client.database.functions.get_chat(room.chat_id))).then(async chats => {
                    let data = [];
                    for (var i = 0; i < rooms.length; i++) {
                        let room = rooms[i];
                        let chat = chats.find(x => x.room_id == room?.id);
                        if (room && chat && room.chat_id == chat.id) {
                            let last_message = chat.messages[chat.messages.length - 1], name, _user, image;
                            if (room.type == 'private') {
                                _user = await client.database.functions.get_user(room.members[0] == req.user.id ? room.members[1] : room.members[0]);
                                if (_user) {
                                    name = _user.name || _user.username;
                                    image = `/uploads/users/${_user.id}/profile.png`
                                } else name = 'Not Found';
                            } else name = room.name;
                            let user_room_unread = req.user.rooms.find(z => z.id == room.id)?.unread;
                            let hide_presence = false;
                            if (_user.presence_type == "friends-only" && !req.user.friends.includes(_user.id)) hide_presence = true;
                            data.push({
                                id: room.id,
                                name,
                                image: image || '',
                                time: last_message?.time,
                                last_message: last_message?.message,
                                last_message_id: last_message.id,
                                unread: user_room_unread,
                                deleted: last_message?.deleted,
                                has_attachment: last_message?.attachments?.length,
                                presence: { status: _user.presence?.status || 'offline', date: _user.presence?.date || 0, hide: hide_presence },
                                _user_id: room.type == 'private' ? _user.id : null,
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
