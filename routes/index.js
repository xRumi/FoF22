const router = require('express').Router(),
    auth = require('./auth'),
    profile = require('./profile'),
    messages = require('./messages'),
    search = require('./search'),
    settings = require('./settings'),
    password = require('./reset-password'),
    register = require('./register'),
    debug = require('./debug');

const account = require('./account');

router.get('/', async (req, res) => {
    res.render("index");
});

router.get('/spa', async (req, res) => {
    if (req.user) {
        res.render("spa");
    } else res.status(403).redirect('/login');
});

router.get('/spa/*', async (req, res) => {
    if (req.user) {
        res.render("spa");
    } else res.status(403).redirect('/login');
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
router.use('/debug', debug);
router.use('/account', account);

router.get('/login', async (req, res) => {
    if (!req.user) res.render("login");
    else res.redirect('/spa');
});

router.get('/logout', async (req, res) => {
    if (req.user) await req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
