const router = require('express').Router(),
    auth = require('./auth'),
    profile = require('./profile'),
    messages = require('./messages'),
    search = require('./search'),
    settings = require('./settings');

router.get('/', async (req, res) => {
    if (req.user) res.render("index", { user: req.user, route: 'home' });
    else res.status(403).redirect('/login');
});

router.get('/fetch', async (req, res) => {
    if (req.user) {
        res.status(200).send('this is home page');
    } else res.status(403).send('forbidden');
});

router.use('/auth', auth);
router.use('/profile', profile);
router.use('/messages', messages);
router.use('/search', search);
router.use('/settings', settings);

router.get('/login', async (req, res) => {
    if (!req.user) res.render("login");
    else res.redirect('/');
});

router.get('/logout', async (req, res) => {
    if (req.user) await req.session.destroy();
    res.redirect('/login');
});

module.exports = router;