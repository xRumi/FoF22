const router = require('express').Router(),
    auth = require('./auth'),
    profile = require('./profile'),
    friends = require('./friends'),
    messages = require('./messages'),
    search = require('./search'),
    settings = require('./settings'),
    password = require('./reset-password'),
    register = require('./register'),
    debug = require('./debug'),
    notifications = require('./notifications');

const me = require('./me');

module.exports = (client) => {

    router.get('/', async (req, res) => {
        res.render("index");
    });

    router.get('/spa', async (req, res) => {
        if (req.user) {
            res.render("spa", { user_id: req.user.id, username: req.user.username, name: req.user.name, unread: req.user.unread });
        } else res.status(403).redirect(`/login?ref=${req.originalUrl}`);

    });

    router.get('/spa/*', async (req, res) => {
        if (req.user) {
            res.render("spa", { user_id: req.user.id, username: req.user.username, name: req.user.name, unread: req.user.unread });
        } else res.status(403).redirect(`/login?ref=${req.originalUrl}`);
    });

    router.use('/auth', auth(client));
    router.use('/profile', profile(client));
    router.use('/friends', friends(client));
    router.use('/messages', messages(client));
    router.use('/search', search(client));
    router.use('/settings', settings(client));
    router.use('/', password(client));
    router.use('/register', register(client));
    router.use('/debug', debug(client));
    router.use('/me', me(client));
    router.use('/notifications', notifications(client));

    router.get('/login', async (req, res) => {
        if (!req.user) res.render("login");
        else res.redirect('/spa');
    });

    router.get('/logout', async (req, res) => {
        if (req.user) req.session.destroy();
        res.redirect('/login');
    });

    return router;

}
