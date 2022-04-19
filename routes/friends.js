const router = require('express').Router();

router.get('/', async (req, res) => {
    res.sendStatus(200);
});

router.post('/add', async (req, res) => {
    if (req.user) {
        let _user = req.body.user;
        let user = await req.client.database.functions.get_user(_user);
        if (user && user.id !== req.user.id) {
            if (!req.user.friends.includes(user.id) && !req.user.friend_request.some(x => x.target == user.id)) {
                req.user.friend_request.push({
                    type: 'request',
                    target: user.id
                });
                user.friend_request.push({
                    type: 'await_accept',
                    target: req.user.id
                });
                user.markModified('friend_request');
                req.user.markModified('friend_request');
                await user.save();
                await req.user.save();
                res.sendStatus(200);
            } else if (req.user.friend_request.some(x => x.target == user.id && x.type == 'await_accept')) {
                if (!req.user.friends.includes(user.id)) {
                    let is_request = req.user.friend_request.findIndex(x => x.target === user.id && x.type == 'await_accept');
                    if (is_request > -1) {
                        req.user.friend_request.splice(is_request, 1);
                        let from_request = user.friend_request.findIndex(x => x.target === req.user.id && x.type == 'request');
                        if (from_request > -1) user.friend_request.splice(from_request, 1);
                        req.user.friends.push(user.id);
                        user.friends.push(req.user.id);
                        user.markModified('friend_request');
                        req.user.markModified('friend_request');
                        user.markModified('friends');
                        req.user.markModified('friends');
                        await req.user.save();
                        await user.save();
                        res.sendStatus(200);
                    } else res.sendStatus(400);
                } else res.sendStatus(200);
            } else res.sendStatus(200);
        } else res.sendStatus(400);
    } else res.status(403).send('forbidden');
});

router.post('/cancel', async (req, res) => {
    if (req.user) {
        let _user = req.body.user;
        let user = await req.client.database.functions.get_user(_user);
        if (user && user.id !== req.user.id) {
            let is_request = req.user.friend_request.findIndex(x => x.target === user.id);
            if (is_request > -1) {
                req.user.friend_request.splice(is_request, 1);
                let from_request = user.friend_request.findIndex(x => x.target === req.user.id);
                if (from_request > -1) user.friend_request.splice(from_request, 1);
                user.markModified('friend_request');
                req.user.markModified('friend_request');
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
        let user = await req.client.database.functions.get_user(_user);
        if (user && user.id !== req.user.id) {
            if (!req.user.friends.includes(user.id)) {
                let is_request = req.user.friend_request.findIndex(x => x.target === user.id && x.type == 'await_accept');
                if (is_request > -1) {
                    req.user.friend_request.splice(is_request, 1);
                    let from_request = user.friend_request.findIndex(x => x.target === req.user.id && x.type == 'request');
                    if (from_request > -1) user.friend_request.splice(from_request, 1);
                    req.user.friends.push(user.id);
                    user.friends.push(req.user.id);
                    user.markModified('friend_request');
                    req.user.markModified('friend_request');
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
        let user = await req.client.database.functions.get_user(_user);
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


module.exports = router;
