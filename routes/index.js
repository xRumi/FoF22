const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
        user: 'mehedihasanrumi@yahoo.com',
        pass: 'udxiaghwxqrvzadq'
    }
});

const humanize_duration = require("humanize-duration");
const ObjectID = require("mongodb").ObjectID

const router = require('express').Router(),
    auth = require('./auth'),
    profile = require('./profile'),
    messages = require('./messages'),
    search = require('./search'),
    settings = require('./settings');

router.get('/', async (req, res) => {
    if (req.user) {
        let friends = await req.client.cache.functions.get_friends(req.user.friends);
        res.render("index", { user: req.user, friends, route: 'home' });
    } else res.status(403).redirect('/login');
});

router.get('/fetch', async (req, res) => {
    if (req.user) {
        res.status(200).send('this is home page');
    } else res.status(403).send('forbidden');
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

router.get('/login', async (req, res) => {
    if (!req.user) res.render("login");
    else res.redirect('/');
});

router.get('/forgot-password', async (req, res) => {
    if (!req.user) res.render("forgot-password");
    else res.redirect('/');
});

router.post('/reset-password/email', async (req, res) => {
    const user = req.body.email ? await req.client.database.functions.get_user_by_email(req.body.email) : false;
    if (user) {
        const token = await req.client.database.functions.create_or_get_token(user.username, 'reset-token');
        transporter.sendMail({
            from: 'mehedihasanrumi@yahoo.com',
            to: user.email,
            subject: 'reset password',
            html: `<p>You requested for reset password, kindly use this <a href="http://88.99.83.158/reset-password/?token=${token.id}">link</a> to reset your password.</p><br><p>This link will expire in <b>${humanize_duration((token.expire_at) - Date.now())}</b></p>`,
        }, function(error, info) {
            if (error) console.log(error);
        });
    }
    res.sendStatus(200);
});

router.get('/reset-password', async (req, res) => {
    if (!req.user) {
        if (req.query.token && ObjectID.isValid(req.query.token)) {
            let token = await req.client.database.token.findById(req.query.token);
            if (token) res.render("reset-password", { username: token.username, expire: humanize_duration(token.expire_at - Date.now()) });
            else res.redirect('/login');
        } else res.redirect('/login');
    } else res.redirect('/');
});

router.post('/reset-password/change', async (req, res) => {

});

router.get('/logout', async (req, res) => {
    if (req.user) await req.session.destroy();
    res.redirect('/login');
});

module.exports = router;