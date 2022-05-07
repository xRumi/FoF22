const ObjectId = require("mongodb").ObjectId;
const router = require('express').Router();
const rateLimit = require('express-rate-limit');

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (!req.user) res.render('register');
        else res.redirect('/');
    });

    const limiter1 = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 6,
        message: 'Too many requests',
    });

    const _limiter1 = rateLimit({
        windowMs: 24 * 60 * 60 * 1000,
        max: 15,
        message: 'Too many requests'
    })

    router.post('/post', limiter1, _limiter1, async (req, res) => {
        const email = req.body.email;
        if (email && email.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) {
            let _user = await client.database._user.findOne({ email });
            if (!_user) {
                _user = await client.database.user.exists({ email });
                if (_user) return res.status(400).send('Email address is not available');
                _user = new client.database._user({ email });
                // html: `<div style="font-size: 15px;">Click <a href="https://fof22.me/register/confirm/?token=${_user.id}">here</a> to confirm your email address. This link will expire in ~24 hours.</div><p style="color: grey;">If you did not request for this email, simply ignore this email.</p><br><hr><p>Please do not respond, this email was auto-generated. If you need additional help, send an email to <a href="mailto:help@fof22.me">help@fof22.me</p>`,
                client.mail.send({
                    from: `FoF22 <no-reply@fof22.me>`,
                    to: email,
                    subject: `Please verify your email address`,
                    template: "confirm_email",
                    'h:X-Mailgun-Variables': {
                        confirm_url: `https://fof22.me/register/confirm/?token=${_user.id}`
                    }
                }, (done) => {
                    if (done) res.status(200).send({ time_left: 300, message: `We have sent a confirmation email to <b>${email}</b>. Make sure to check the both index and spam folder.` });
                    else res.status(400).send('Something went wrong, try again later');
                });
                await _user.save();
            } else {
                if (_user.mailed > 5) res.status(400).send(`You have reached maximum resend limit, mail to <a href="mailto:help@fof22.me">help@fof22.me</a> for help`);
                else {
                    let diff = Date.now() - _user.created_at;
                    if (diff > 5 * 60 * 1000) {
                        client.mail.send({
                            from: `FoF22 <no-reply@fof22.me>`,
                            to: email,
                            subject: `Please verify your email address`,
                            template: "confirm_email",
                            'h:X-Mailgun-Variables': {
                                confirm_url: `https://fof22.me/register/confirm/?token=${_user.id}`
                            }
                        }, (done) => {
                            if (done) {
                                _user.mailed++;
                                _user.created_at = Date.now();
                                _user.save();
                                res.status(200).send({ time_left: 300, message: `We have sent a confirmation email to <b>${email}</b>. Make sure to check the both index and spam folder.` });
                            } else res.status(400).send('Something went wrong, try again later');
                        });
                    } else res.status(400).json({ time_left: Math.floor(300 - (diff / 1000)) });
                }
            }
        } else res.status(400).send('Invalid data was provided');
    });

    const limiter2 = rateLimit({
        windowMs: 60 * 1000,
        max: 8,
        message: 'Too many requests',
    });

    router.get('/confirm', limiter2, async (req, res) => {
        if (!req.user) {
            if (req.query.token && ObjectId.isValid(req.query.token)) {
                let _user = await client.database._user.findById(req.query.token);
                if (!_user) return res.redirect('/login?ref=/spa');
                res.render("confirm-account", { alert: !_user.verified ? 'email address verified successfully, change the password to activate your account' : null });
                if (!_user.verified) {
                    _user.verified = true;
                    await _user.save();
                }
            } else res.redirect('/login');
        } else res.redirect('/');
    });

    const limiter3 = rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: 'Too many requests',
    });

    router.post('/confirm/post', limiter3, async (req, res) => {
        let username = req.body.username?.toLowerCase(),
            name = req.body.name,
            _token = req.body.token,
            password = req.body.password;
        if (_token && username?.length >= 4 && username.length <= 16 && name?.length >= 4 && name.length <= 32 && password?.length >= 8 && password.length <= 32 && ObjectId.isValid(_token)) {
            if (username.match(/[^A-Za-z0-9]/)) return res.status(400).send('Special character/space in username is not allowed');
            if (name.match(/[^A-Za-z0-9 ]/)) return res.status(400).send('Special character in full name is not allowed');
            let _user = await client.database._user.findById(_token);
            if (_user) {
                let user_exists = await client.database.user.exists({ username });
                if (user_exists) return res.status(400).send('Username is not available');
                let user = await client.database.functions.create_user(username, _user.email, password, name);
                if (user) {
                    await _user.remove();
                    res.status(200).send('Password changed successfully, redirecting to login page in 5 seconds');  
                } else res.status(400).send('Error activating account, try again later');
            } else res.status(400).send('Invalid token was provided');
        } else res.status(400).send('Invalid data was provided');
    });

    return router;

}
