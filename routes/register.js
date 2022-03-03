const humanize_duration = require("humanize-duration");
const ObjectID = require("mongodb").ObjectID;

const router = require('express').Router();

router.get('/', async (req, res) => {
    if (!req.user) res.render('register');
    else res.redirect('/');
});

router.post('/post', async (req, res) => {
    const email = req.body.email;
    if (email && email.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) {
        let _user = await req.client.database._user.findOne({ email });
        if (!_user) {
            _user = await req.client.database.user.exists({ email });
            if (_user) return res.status(400).send('Email address is not available');
            _user = new req.client.database._user({ email });
            res.status(200).send(`We have sent a confirmation email to <b>${email}</b>. Make sure to check the both index and spam folder.`);
            req.client.transporter.sendMail({
                from: 'mehedihasanrumi@yahoo.com',
                to: email,
                subject: 'Verify Your Email',
                html: `<p>Visit <a href="http://88.99.83.158/register/confirm/?token=${_user.id}">here</a> to confirm this email address and change the password.</p><br><hr><p>You're receiving this email because you have registered with this address in <a href="http://88.99.83.158">88.99.83.158</a>.</p>`,
            }, function(error, info) {
                if (error) console.log(error);
            });
            await _user.save();
        } else {
            req.client.transporter.sendMail({
                from: 'mehedihasanrumi@yahoo.com',
                to: email,
                subject: 'Verify Your Email',
                html: `<p>Visit <a href="http://88.99.83.158/register/confirm/?token=${_user.id}">here</a> to confirm this email address and change the password.</p><br><hr><p>You're receiving this email because you have registered with this address in <a href="http://88.99.83.158">88.99.83.158</a>.</p>`,
            }, function(error, info) {
                if (error) console.log(error);
            });
            res.status(200).send('Resending account confirmation email');
        }
    } else res.status(400).send('Invalid data was provided');
});

router.get('/confirm', async (req, res) => {
    if (!req.user) {
        if (req.query.token && ObjectID.isValid(req.query.token)) {
            let _user = await req.client.database._user.findById(req.query.token);
            if (!_user) return res.redirect('/login');
            res.render("confirm-account", { alert: !_user.verified ? 'email address verified successfully, change the password to activate your account' : null });
            if (!_user.verified) {
                _user.verified = true;
                await _user.save();
            }
        } else res.redirect('/login');
    } else res.redirect('/');
});

router.post('/confirm/post', async (req, res) => {
    console.log
    let username = req.body.username?.toLowerCase(),
        name = req.body.name,
        _token = req.body.token,
        password = req.body.password;
    if (_token && username?.length >= 4 && username.length <= 16 && name?.length >= 4 && name.length <= 32 && password?.length >= 8 && password.length <= 32 && ObjectID.isValid(_token)) {
        if (username.match(/[^A-Za-z0-9]/)) return res.status(400).send('Special character/space in username is not allowed');
        if (name.match(/[^A-Za-z0-9 ]/)) return res.status(400).send('Special character in full name is not allowed');
        let _user = await req.client.database._user.findById(_token);
        if (_user) {
            let user_exists = await req.client.database.user.exists({ username });
            if (user_exists) return res.status(400).send('Username is not available');
            let user = await req.client.database.functions.create_user(username, _user.email, password, name);
            if (user) {
                await _user.remove();
                res.status(200).send('Password changed successfully, redirecting to login page in 5 secs');  
            } else res.status(400).send('Error activating account, try again later');
        } else res.status(400).send('Invalid token was provided');
    } else res.status(400).send('Invalid data was provided');
});

module.exports = router;