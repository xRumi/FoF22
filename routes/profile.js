const router = require('express').Router(), fs = require('fs');
const rateLimit = require('express-rate-limit');

module.exports = (client) => {
 
    router.get('/spa/profile/:id', async (req, res, next) => {
        if (req.user) next();
        else {
            let id = req.params.id,
                user = await client.database.functions.get_user(id);
            if (user) {
                let profile_data = user.profile_data;
                for (let key in profile_data) {
                    if (!profile_data[key]?.value?.length) delete profile_data[key];
                    else {
                        let value_type = profile_data[key]?.type;
                        if (value_type !== 'public') delete profile_data[key];
                    }
                }
                res.render("./no-login-spa/profile", { error: false, user_data: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    created_at: user.created_at,
                    friends: user.friends,
                    has_cover: fs.existsSync(`../public/dist/img/users/${user.id}/cover.png`),
                    has_profile_picture: fs.existsSync(`../public/dist/img/users/${user.id}/profile.png`),
                    profile_data
                }});
            } else res.render("./no-login-spa/profile", { error: `<div style="padding: 50px;"><div style="font-size: 20px;">Oops! User Not Be Found</div><div style="color: lightgray; margin-top: 5px;">Sorry but the user you are looking for does not exist, have been removed. id changed or is temporarily unavailable</div></div>` });
        }
    });

    const limiter = rateLimit({
        windowMs: 10 * 1000,
        max: 10,
        message: 'Too many requests',
    });

    const _limiter = rateLimit({
        windowMs: 24 * 60 * 60 * 1000,
        max: 100,
        message: 'Too many requests, blocked for a day'
    });

    router.get('/profile/fetch/:id', limiter, _limiter, async (req, res) => {
        if (req.user) {
            let id = req.params.id,
                is_me = id == 'me' || id == req.user.id ? true : false;
                user = is_me ? req.user : await client.database.functions.get_user(id);
            if (user) {
                let profile_data = user.profile_data;
                for (let key in profile_data) {
                    if (!profile_data[key]?.value?.length) delete profile_data[key];
                    else {
                        if (is_me) continue;
                        let value_type = profile_data[key]?.type;
                        if (value_type == 'friends-only') {
                            if (!req.user.friends.includes(user.id))
                                delete profile_data[key];
                        } else if (value_type == 'private') delete profile_data[key];
                    }
                }
                res.status(200).send({
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    created_at: user.created_at,
                    friends: user.friends,
                    has_cover: fs.existsSync(`../public/dist/img/users/${user.id}/cover.png`),
                    has_profile_picture: fs.existsSync(`../public/dist/img/users/${user.id}/profile.png`),
                    is_my_friend: user.friends.includes(req.user.id),
                    is_friend_requested: req.user.friend_requests.some(x => x.target == user.id && x.type == 'request'),
                    is_friend_pending: req.user.friend_requests.some(x => x.target == user.id && x.type == 'pending'),
                    profile_data
                });
            } else res.status(404).send(`<div style="padding: 50px;"><div style="font-size: 20px;">Oops! User Not Be Found</div><div style="color: lightgray; margin-top: 5px;">Sorry but the user you are looking for does not exist, have been removed. id changed or is temporarily unavailable</div></div>`);
        } else res.status(403).send('forbidden');
    });

    return router;

}
