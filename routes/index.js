const router = require('express').Router(),
    auth = require('./auth'),
    profile = require('./profile'),
    friends = require('./friends'),
    messages = require('./messages'),
    search = require('./search'),
    settings = require('./settings'),
    recover_password = require('./recover-password'),
    register = require('./register'),
    debug = require('./debug'),
    notifications = require('./notifications');

const me = require('./me');

module.exports = (client) => {

    router.get('/', async (req, res) => {
        res.render("index");
    });
    router.use('/auth', auth(client));
    router.use('/', profile(client));
    router.use('/friends', friends(client));
    router.use('/messages', messages(client));
    router.use('/search', search(client));
    router.use('/settings', settings(client));
    router.use('/', recover_password(client));
    router.use('/register', register(client));
    router.use('/debug', debug(client));
    router.use('/me', me(client));
    router.use('/notifications', notifications(client));

    router.get('/spa', async (req, res) => {
        if (req.user) {
            res.render("spa", { user_id: req.user.id, username: req.user.username, name: req.user.name, unread: {
                home: 0,
                friends: req.user.friend_requests.filter(x => x.unread).length,
                messages: req.user.rooms.filter(x => x.unread).length,
                notifications: req.user.notifications.filter(x => x.unread).length,
                menu: 0,
            }, eruda: process.env.ERUDA ? true : false });
            if (Math.abs(Date.now() - req.user.last_location_change) > 3 * 24 * 60 * 60 * 1000) {
                let ip_info = await client.get_ip_info(req);
                if (ip_info && ip_info.ll) {
                    req.user.ip_info = ip_info;
                    req.user.location = {
                        type: 'Point',
                        coordinates: ip_info.ll,
                    }
                    req.user.last_location_change = Date.now();
                    req.user.mark_modified('last_location_change');
                    req.user.save();
                }
            }
        } else res.status(403).redirect(`/login?ref=${req.originalUrl}`);
    });

    router.get('/spa/*', async (req, res) => {
        if (req.user) {
            res.render("spa", { user_id: req.user.id, username: req.user.username, name: req.user.name, unread: {
                home: 0,
                friends: req.user.friend_requests.filter(x => x.unread).length,
                messages: req.user.rooms.filter(x => x.unread).length,
                notifications: req.user.notifications.filter(x => x.unread).length,
                menu: 0,
            }, eruda: process.env.ERUDA ? true : false });
            if (Math.abs(Date.now() - req.user.last_location_change) > 3 * 24 * 60 * 60 * 1000) {
                let ip_info = await client.get_ip_info(req);
                if (ip_info && ip_info.ll) {
                    req.user.ip_info = ip_info;
                    req.user.location = {
                        type: 'Point',
                        coordinates: ip_info.ll,
                    }
                    req.user.last_location_change = Date.now();
                    req.user.mark_modified('last_location_change');
                    req.user.save();
                }
            }
        } else res.status(403).redirect(`/login?ref=${req.originalUrl}`);
    });
 
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
