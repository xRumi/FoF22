const router = require('express').Router(), fs = require('fs');

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user) res.render("index", { user: req.user, route: 'profile' });
        else res.status(403).redirect('/login?ref=profile');
    });

    router.get('/fetch/:id', async (req, res) => {
        if (req.user) {
            let id = req.params.id,
                user = id === 'me' ? req.user : await client.database.functions.get_user(id);
            if (user) {
                let user_info = user.user_info, _hide = user_info._hide;
                for (let key in user_info) {
                    if (_hide.includes(key)) user_info[key] = false;
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
                    is_friend_requested: req.user.friend_request.some(x => x.target == user.id && x.type == 'request'),
                    is_friend_pending: req.user.friend_request.some(x => x.target == user.id && x.type == 'pending'),
                    user_info: {
                        about: {
                            bio: {
                                "Full Name": user.name,
                                "Nickname": user_info.nickname,
                                "Age": user_info.age,
                                "Gender": user_info.gender,
                                "Birth Of Date": user_info.bod,
                                "Hobby": user_info.Hobby
                            },
                            "About Myself": user_info.about_myself,
                        }
                    }
                });
            } else res.status(404).send(`<div style="padding: 50px;"><div style="font-size: 20px;">Oops! User Not Be Found</div><div style="color: lightgray; margin-top: 5px;">Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</div></div>`);
        } else res.status(403).send('forbidden');
    });

    return router;

}