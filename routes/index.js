const router = require('express').Router(),
    auth = require('./auth'),
    profile = require('./profile'),
    messages = require('./messages'),
    search = require('./search'),
    settings = require('./settings'),
    password = require('./password'),
    register = require('./register');

router.get('/', async (req, res) => {
    res.render('index', { logged_in: req.user ? true : false });
});

router.get('/home', async (req, res) => {
    let friends;
    if (req.user) friends = await req.client.cache.functions.get_friends(req.user.friends);
    res.render('home', { user: req.user, friends, route: 'home' });
});

router.get('/friends/fetch', async (req, res) => {
    if (req.user) {
        let friends = await req.client.cache.functions.get_friends(req.user.friends);
        res.status(200).send(friends);
    } else res.status(403).send('forbidden');
});

router.use('/auth', auth);
router.use('/profile', profile);
router.use('/messages', messages);
router.use('/search', search);
router.use('/settings', settings);
router.use('/', password);
router.use('/register', register);

router.get('/login', async (req, res) => {
    if (!req.user) res.render("login");
    else res.redirect('/');
});

router.get('/logout', async (req, res) => {
    if (req.user) await req.session.destroy();
    res.redirect('/');
});

module.exports = router;