const router = require('express').Router();

module.exports = (client) => {

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            Promise.all(req.user.friend_requests.filter(x => x.type == 'pending').map(x => client.database.functions.get_user(x.target))).then(users => {
                let requests = [];
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    requests.push({
                        id: user.id,
                        username: user.username,
                        name: user.name,
                        created_at: req.user.friend_requests.find(x => x.type == 'pending' && x.target == user.id)?.created_at,
                    });
                }
                res.status(200).send(requests);
            });
        } else res.status(403).send('forbidden');
    });

    router.post('/add', async (req, res) => {
        if (req.user) {
            let _user = req.body.user;
            let user = await client.database.functions.get_user(_user);
            if (user && user.id !== req.user.id) {
                if (!req.user.friends.includes(user.id) && !req.user.friend_requests.some(x => x.target == user.id)) {
                    req.user.friend_requests.push({
                        type: 'request',
                        target: user.id,
                        created_at: Date.now(),
                    });
                    user.friend_requests.push({
                        type: 'pending',
                        target: req.user.id,
                        created_at: Date.now(),
                    });
                    user.unread.friends.push(req.user.id);
                    user.markModified('unread.friends');
                    user.markModified('friend_requests');
                    req.user.markModified('friend_requests');
                    await user.save();
                    await req.user.save();
                    res.sendStatus(200);
                } else {
                    if (!req.user.friends.includes(user.id)) {
                        let is_request = req.user.friend_requests.findIndex(x => x.target === user.id && x.type == 'pending');
                        if (is_request > -1) {
                            req.user.friend_requests.splice(is_request, 1);
                            let from_request = user.friend_requests.findIndex(x => x.target === req.user.id && x.type == 'request');
                            if (from_request > -1) {
                                user.friend_requests.splice(from_request, 1);
                                user.markModified('friend_requests');
                            }
                            req.user.friends.push(user.id);
                            user.friends.push(req.user.id);
                            let id0 = Math.random().toString(36).substring(2, 15),
                                id1 = Math.random().toString(36).substring(2, 15);
                            req.user.notifications.push({
                                id: id0,
                                user_id: user.id,
                                title: `You are now friends with <b>${user.username}</b>, say Hi to your new friend!`,
                                time: Date.now(),
                                navigateTo: `/spa/profile/${user.id}`,
                                unread: true,
                            });
                            req.user.unread.notifications.push(id0);
                            user.notifications.push({
                                id: id1,
                                user_id: req.user.id,
                                title: `You are now friends with <b>${req.user.username}</b>, say Hi to your new friend!`,
                                time: Date.now(),
                                navigateTo: `/spa/profile/${req.user.id}`,
                                unread: true,
                            });
                            user.unread.notifications.push(id1);
                            let is_unread = req.user.unread.friends.indexOf(user.id);
                            if (is_unread > -1) {
                                req.user.unread.friends.splice(is_unread, 1);
                                req.user.markModified('unread.friends');
                            }
                            client.io.to(req.user.id).emit('unread', ({ notifications: req.user.unread.notifications }));
                            client.io.to(user.id).emit('unread', ({ notifications: user.unread.notifications }));
                            user.markModified('notifications');
                            req.user.markModified('notifications');
                            req.user.markModified('friend_requests');
                            user.markModified('friends');
                            req.user.markModified('friends');
                            await req.user.save();
                            await user.save();
                            res.sendStatus(200);
                        } else res.sendStatus(400);
                    } else res.sendStatus(200);
                }
            } else res.sendStatus(400);
        } else res.status(403).send('forbidden');
    });

    router.post('/cancel', async (req, res) => {
        if (req.user) {
            let _user = req.body.user;
            let user = await client.database.functions.get_user(_user);
            if (user && user.id !== req.user.id) {
                let is_request = req.user.friend_requests.findIndex(x => x.target === user.id);
                if (is_request > -1) {
                    req.user.friend_requests.splice(is_request, 1);
                    let from_request = user.friend_requests.findIndex(x => x.target === req.user.id);
                    if (from_request > -1) user.friend_requests.splice(from_request, 1);
                    let is_unread0 = req.user.unread.friends.indexOf(user.id),
                        is_unread1 = user.unread.friends.indexOf(req.user.id);
                    if (is_unread0 > -1) {
                        req.user.unread.friends.splice(is_unread0, 1);
                        req.user.markModified('unread.friends');
                    }
                    if (is_unread1 > -1) {
                        user.unread.friends.splice(is_unread1, 1);
                        user.markModified('unread.friends');
                    }
                    user.markModified('friend_requests');
                    req.user.markModified('friend_requests');
                    await req.user.save();
                    await user.save();
                    res.sendStatus(200);
                } else res.sendStatus(200);
            } else res.sendStatus(400);
        } else res.status(403).send('forbidden');
    });

    router.post('/accept', async (req, res) => {
        if (req.user) {
            let _user = req.body.user;
            let user = await client.database.functions.get_user(_user);
            if (user && user.id !== req.user.id) {
                if (!req.user.friends.includes(user.id)) {
                    let is_request = req.user.friend_requests.findIndex(x => x.target === user.id && x.type == 'pending');
                    if (is_request > -1) {
                        req.user.friend_requests.splice(is_request, 1);
                        let from_request = user.friend_requests.findIndex(x => x.target === req.user.id && x.type == 'request');
                        if (from_request > -1) user.friend_requests.splice(from_request, 1);
                        req.user.friends.push(user.id);
                        user.friends.push(req.user.id);
                        let id0 = Math.random().toString(36).substring(2, 15),
                            id1 = Math.random().toString(36).substring(2, 15);
                        req.user.notifications.push({
                            id: id0,
                            user_id: user.id,
                            title: `You are now friends with <b>${user.username}</b>`,
                            time: Date.now(),
                            navigateTo: `/spa/profile/${user.id}`
                        });
                        req.user.unread.notifications.push(id0);
                        user.notifications.push({
                            id: id1,
                            user_id: req.user.id,
                            title: `<b>${req.user.username}</b> has accepted your friend request, say Hi to your new friend`,
                            time: Date.now(),
                            navigateTo: `/spa/profile/${req.user.id}`
                        });
                        user.unread.notifications.push(id1);
                        let is_unread = req.user.unread.friends.indexOf(user.id);
                        if (is_unread > -1) {
                            req.user.unread.friends.splice(is_unread, 1);
                            req.user.markModified('unread.friends');
                            client.io.to(req.user.id).emit('unread', ({ friends: req.user.unread.friends }));
                        }
                        client.io.to(req.user.id).emit('unread', ({ notifications: req.user.unread.notifications }));
                        client.io.to(user.id).emit('unread', ({ notifications: user.unread.notifications }));
                        user.markModified('notifications');
                        req.user.markModified('notifications');
                        user.markModified('unread.notifications');
                        req.user.markModified('unread.notifications');
                        user.markModified('friend_requests');
                        req.user.markModified('friend_requests');
                        user.markModified('friends');
                        req.user.markModified('friends');
                        await req.user.save();
                        await user.save();
                        res.sendStatus(200);
                    } else res.sendStatus(400);
                } else res.sendStatus(200);
            } else res.sendStatus(400);
        } else res.status(403).send('forbidden');
    });

    router.post('/remove', async (req, res) => {
        if (req.user) {
            let _user = req.body.user;
            let user = await client.database.functions.get_user(_user);
            if (user && user.id !== req.user.id) {
                let friend = req.user.friends.indexOf(user.id),
                    _friend = user.friends.indexOf(req.user.id);
                if (friend > -1) req.user.friends.splice(friend, 1);
                if (_friend > -1) user.friends.splice(_friend, 1);
                user.markModified('friends');
                req.user.markModified('friends');
                await req.user.save();
                await user.save();
                res.sendStatus(200);
            } else res.sendStatus(400);
        } else res.status(403).send('forbidden');
    });

    return router;

}
