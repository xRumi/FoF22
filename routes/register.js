const humanize_duration = require("humanize-duration");
const ObjectID = require("mongodb").ObjectID;

const router = require('express').Router();

router.get('/', async (req, res) => {
    if (!req.user) res.render('register');
    else res.redirect('/');
});

router.post('/post', async (req, res) => {
    const username = req.body.username,
        name = req.body.name,
        email = req.body.email;
    if (username && name && email && username.length >= 4 && username.length <= 16 && name.length >= 4 && name.length <= 32 && email.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) {
        let _email = await req.client.database.user.exists({ email }) || await req.client.database._user.exists({ email });
        if (_email) return res.status(400).send('Email address is not available');
        let _user = await req.client.database.user.exists({ username }) || await req.client.database._user.exists({ username });
        if (!_user) {
            _user = new req.client.database._user({ username, name, email });
            res.sendStatus(200);
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
            _user = await req.client.database._user.findOne({ username });
            if (_user && _user.username == username && _user.email == email) {
                req.client.transporter.sendMail({
                    from: 'mehedihasanrumi@yahoo.com',
                    to: email,
                    subject: 'Verify Your Email',
                    html: `<p>Visit <a href="http://88.99.83.158/register/confirm/?token=${_user.id}">here</a> to confirm this email address and change the password.</p><br><hr><p>You're receiving this email because you have registered with this address in <a href="http://88.99.83.158">88.99.83.158</a>.</p>`,
                }, function(error, info) {
                    if (error) console.log(error);
                });
                res.sendStatus(200).send('Resending account confirmation email');
            } else res.status(400).send('Username is not available');
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
    let _token = req.body.token,
        password = req.body.password;
    if (_token && password?.length >= 8 && ObjectID.isValid(_token)) {
        let _user = await req.client.database._user.findById(_token);
        if (_user) {
            let user = await req.client.database.functions.create_user(_user.username, _user.email, password, _user.name);
            if (user) {
                await _user.remove();
                res.status(200).send('Password changed successfully, redirecting to login page in 5 secs');  
            } else res.status(400).send('Error activating account, try again later');
        } else res.status(400).send('Invalid token was provided');
    } else res.status(400).send('Invalid data was provided');
});

module.exports = router;