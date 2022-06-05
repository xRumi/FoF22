const router = require('express').Router();

module.exports = (client) => {

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            let request_limit = 10;
            let _requests = req.user.friend_requests.filter(x => x.type == 'pending');
            Promise.all(_requests.slice(0, request_limit).map(x => client.database.functions.get_user(x.target))).then(users => {
                let requests = [];
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                    let is_req_has_less_friends = req.user.friends.length < user.friends.length;
                    let mutual_friends = is_req_has_less_friends ? req.user.friends.filter(x => user.friends.includes(x)) : user.friends.filter(x => req.user.friends.includes(x));
                    requests.push({
                        id: user.id,
                        username: user.username,
                        name: user.name,
                        mutual: {
                            sample: mutual_friends.slice(0, 3),
                            count: mutual_friends.length
                        },
                        created_at: req.user.friend_requests.find(x => x.type == 'pending' && x.target == user.id)?.created_at,
                    });
                }
                let ip_info = req.user.ip_info;
                if (ip_info && ip_info.ll) {
                    client.database.user.find({
                        $and: [
                            { created_at: { $lte: Date.now() } },
                            { _id: { $ne: req.user.id } },
                            { _id: { $nin: [
                                ...req.user.friends,
                                ...req.user.friend_requests.map(x => x.target),
                                ...req.user.exclude_nearby,
                                    ] }
                            },
                            {
                                location: {
                                    $nearSphere: {
                                        $geometry: {
                                            type: "Point",
                                            coordinates: ip_info.ll,
                                        },
                                        $maxDistance: 10000,
                                    },
                                }
                            }
                        ]
                    }).limit(request_limit).then(_users => {
                        let nearby = [];
                        for (let i = 0; i < _users.length; i++) {
                            let _user = _users[i];
                            nearby.push({
                                id: _user.id,
                                username: _user.username,
                                name: _user.name,
                            });
                        }
                        res.status(200).send({ requests, nearby, total_request_count: _requests.length });
                    }).catch(err => {
                        console.log(err);
                        res.status(500).send('error finding nearby users');
                    });
                } else res.status(200).send({ requests, total_request_count: _requests.length });
            });
        } else res.status(403).send('forbidden');
    });

    router.get('/requests', async (req, res) => {
        if (req.user) {
            if (!(req.query.created_at?.length > 12)) return res.sendStatus(400);
            let request_limit = 10;
            let _requests = req.user.friend_requests.filter(x => x.type == 'pending');
            if (_requests.length) {
                let last_request = _requests.findIndex(x => x.created_at == req.query.created_at);
                if (last_request == -1) return res.sendStatus(400);
                Promise.all(_requests.slice(last_request + 1, request_limit).map(x => client.database.functions.get_user(x.target))).then(users => {
                    let requests = [];
                    for (let i = 0; i < users.length; i++) {
                        let user = users[i];
                        let is_req_has_less_friends = req.user.friends.length < user.friends.length;
                        let mutual_friends = is_req_has_less_friends ? req.user.friends.filter(x => user.friends.includes(x)) : user.friends.filter(x => req.user.friends.includes(x));
                        requests.push({
                            id: user.id,
                            username: user.username,
                            name: user.name,
                            mutual: {
                                sample: mutual_friends.slice(0, 3),
                                count: mutual_friends.length
                            },
                            created_at: req.user.friend_requests.find(x => x.type == 'pending' && x.target == user.id)?.created_at,
                        });
                    }
                    res.status(200).send({ requests, total_request_count: _requests.length });
                });
            } else res.status(200).send([]);
        } else res.status(403).send('forbidden');
    });

    router.get('/nearby', async (req, res) => {
        if (req.user) {
            if (!(req.query.created_at?.length > 12)) return res.sendStatus(400);
            let ip_info = req.user.ip_info;
            if (ip_info && ip_info.ll) {
                let request_limit = 10;
                client.database.user.find({
                    $and: [
                        { created_at: { $lte: req.query.created_at } },
                        { _id: { $ne: req.user.id } },
                        { _id: { $nin: [
                            ...req.user.friends,
                            ...req.user.friend_requests.map(x => x.target),
                            ...req.user.exclude_nearby,
                                ] }
                        },
                        {
                            location: {
                                $nearSphere: {
                                    $geometry: {
                                        type: "Point",
                                        coordinates: ip_info.ll,
                                    },
                                    $maxDistance: 10000,
                                },
                            }
                        }
                    ]
                }).limit(request_limit).then(users => {
                    let nearby = [];
                    for (let i = 0; i < users.length; i++) {
                        let user = users[i];
                        nearby.push({
                            id: user.id,
                            username: user.username,
                            name: user.name,
                        });
                    }
                    res.status(200).send(nearby);
                }).catch(err => {
                    console.log(err);
                    res.status(500).send('error finding nearby users');
                });
            } else res.status(400).send('try again later');
        } else res.sendStatus(403);
    });

    router.post('/nearby/remove', async (req, res) => {
        if (req.user) {
            let _user = req.body.user;
            let user = await client.database.functions.get_user(_user);
            if (user && user.id !== req.user.id) {
                if (!req.user.exclude_nearby.includes(user.id)) {
                    req.user.exclude_nearby.push(user.id);
                    req.user.save();
                    res.sendStatus(200);
                } else res.sendStatus(200);
            } else res.sendStatus(400);
        } else res.sendStatus(403);
    });

    router.post('/nearby/undo-remove', async (req, res) => {
        if (req.user) {
            let _user = req.body.user;
            let user = await client.database.functions.get_user(_user);
            if (user && user.id !== req.user.id) {
                let index = req.user.exclude_nearby.indexOf(user.id);
                if (index > -1) {
                    req.user.exclude_nearby.splice(index, 1);
                    req.user.save();
                    res.sendStatus(200);
                } else res.sendStatus(200);
            } else res.sendStatus(400);
        } else res.sendStatus(403);
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
                        unread: true
                    });
                    client.io.to(user.id).emit('unread', ({ friends: {
                        count: user.friend_requests.filter(x => x.unread).length,
                        unread: [req.user.id]
                    } }));
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
                            user.notifications.push({
                                id: id1,
                                user_id: req.user.id,
                                title: `You are now friends with <b>${req.user.username}</b>, say Hi to your new friend!`,
                                time: Date.now(),
                                navigateTo: `/spa/profile/${req.user.id}`,
                                unread: true,
                            });
                            console.log('send two');
                            client.io.to(req.user.id).emit('unread', ({ notifications: {
                                count: req.user.notifications.filter(x => x.unread).length,
                                unread: [{
                                    id: id0,
                                    user_id: user.id,
                                    header: 'Friend Request Accepted',
                                    title: `You are now friends with <b>${user.username}</b>, say Hi to your new friend!`,
                                    navigateTo: `/spa/profile/${user.id}`,
                                }]
                            } }));
                            client.io.to(user.id).emit('unread', ({ notifications: {
                                count: user.notifications.filter(x => x.unread).length,
                                unread: [{
                                    id: id1,
                                    user_id: req.user.id,
                                    header: 'Friend Request Accepted',
                                    title: `You are now friends with <b>${req.user.username}</b>, say Hi to your new friend!`,
                                    navigateTo: `/spa/profile/${user.id}`,
                                }]
                            } }));
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
        } else res.sendStatus(403);
    });

    router.post('/cancel', async (req, res) => {
        if (req.user) {
            let _user = req.body.user;
            let user = await client.database.functions.get_user(_user);
            if (user && user.id !== req.user.id) {
                let is_request = req.user.friend_requests.findIndex(x => x.target === user.id);
                if (is_request > -1) {
                    if (req.user.friend_requests[is_request].type == 'pending') client.io.to(req.user.id).emit('unread', ({ friends: {
                        count: req.user.friend_requests.length - 1,
                    } }));
                    else client.io.to(user.id).emit('unread', ({ friends: {
                        count: user.friend_requests.length - 1,
                    } }));
                    req.user.friend_requests.splice(is_request, 1);
                    let from_request = user.friend_requests.findIndex(x => x.target === req.user.id);
                    if (from_request > -1) user.friend_requests.splice(from_request, 1);
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
                        user.notifications.push({
                            id: id1,
                            user_id: req.user.id,
                            title: `<b>${req.user.username}</b> has accepted your friend request, say Hi to your new friend`,
                            time: Date.now(),
                            navigateTo: `/spa/profile/${req.user.id}`
                        });
                        console.log('send one')
                        client.io.to(req.user.id).emit('unread', ({ notifications: {
                            count: req.user.notifications.filter(x => x.unread).length,
                            unread: [{
                                id: id0,
                                user_id: user.id,
                                header: 'Friend Request Accepted',
                                title: `You are now friends with <b>${user.username}</b>, say Hi to your new friend!`,
                                navigateTo: `/spa/profile/${user.id}`,
                            }]
                        } }));
                        client.io.to(user.id).emit('unread', ({ notifications: {
                            count: user.notifications.filter(x => x.unread).length,
                            unread: [{
                                id: id1,
                                user_id: req.user.id,
                                header: 'Friend Request Accepted',
                                title: `You are now friends with <b>${req.user.username}</b>, say Hi to your new friend!`,
                                navigateTo: `/spa/profile/${req.user.id}`,
                            }]
                        } }));
                        user.markModified('notifications');
                        req.user.markModified('notifications');
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
