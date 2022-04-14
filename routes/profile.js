const router = require('express').Router(), fs = require('fs');

router.get('/', async (req, res) => {
    if (req.user) res.render("index", { user: req.user, route: 'profile' });
    else res.status(403).redirect('/login?ref=profile');
});

router.get('/fetch/:id', async (req, res) => {
    if (req.user) {
        let id = req.params.id,
            user = id === 'me' ? req.user : await req.client.database.functions.get_user(id);
        if (user) {
            res.status(200).send({
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                status: user.status,
                created_at: user.created_at,
                friends: user.friends,
                has_cover: fs.existsSync(`../public/dist/img/users/${user.id}/cover.png`),
                is_my_friend: user.friends.includes(req.user.id),
            });
        } else res.status(404).send(`<div style="padding: 50px;"><div style="font-size: 20px;">Oops! User Not Be Found</div><div style="color: lightgray; margin-top: 5px;">Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</div></div>`);
    } else res.status(403).send('forbidden');
});

module.exports = router;