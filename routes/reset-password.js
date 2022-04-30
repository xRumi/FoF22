const router = require('express').Router();
const Session = require('../models/Session.js');
const humanize_duration = require("humanize-duration");
const ObjectId = require("mongodb").ObjectId;

const rateLimit = require('express-rate-limit');

module.exports = (client) => {

    router.get('/forgot-password', async (req, res) => {
        if (!req.user) res.render("forgot-password");
        else res.redirect('/');
    });

    const limiter1 = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many requests',
    });

    const _limiter1 = rateLimit({
        windowMs: 24 * 60 * 60 * 1000,
        max: 15,
        message: 'Too many requests'
    });

    router.post('/forgot-password/post', limiter1, _limiter1, async (req, res) => {
        const user = req.body.email ? await client.database.functions.get_user_by_email(req.body.email) : false;
        if (user) {
            const token = await client.database.functions.create_token(user.id);
            client.transporter.sendMail({
                from: 'mehedihasanrumi@yahoo.com',
                to: user.email,
                subject: 'reset password',
                html: `<p>You requested for reset password, kindly use this <a href="https://fof22.me/reset-password/?token=${token.id}">link</a> to reset your password.</p><br><hr><p>This link will expire in <b>${humanize_duration((token.expire_at) - Date.now())}</b></p><p>You're receiving this email because a password reset was requested for your account.</p>`,
            }, function(error) {
                if (error) console.log(error);
            });
        }
        res.sendStatus(200);
    });

    const limiter2 = rateLimit({
        windowMs: 60 * 1000,
        max: 8,
        message: 'Too many requests',
    });

    router.get('/reset-password', limiter2, async (req, res) => {
        if (!req.user) {
            if (req.query.token && ObjectId.isValid(req.query.token)) {
                let token = await client.database.token.findById(req.query.token);
                if (token && token.type == 'reset-token') {
                    let user = await client.database.functions.get_user(token.user_id);
                    if (user) res.render("reset-password", { expire: humanize_duration(token.expire_at - Date.now()) });
                    else {
                        await token.remove();
                        res.redirect('/login');
                    }
                } else res.redirect('/login');
            } else res.redirect('/login');
        } else res.redirect('/');
    });

    const limiter3 = rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        message: 'Too many requests',
    });

    router.post('/reset-password/post', limiter3, async (req, res) => {
        let _token = req.body.token,
            password = req.body.password;
        if (_token && password?.length >= 8 && ObjectId.isValid(_token)) {
            let token = await client.database.token.findById(_token);
            if (token && token.expire_at > Date.now()) {
                let user = await client.database.functions.get_user(token.user_id);
                if (user) {
                    if (user.status == 'deleted') res.status(400).send('You can\'t change password of a deleted account');
                    else {
                        await token.remove();
                        user.password = password;
                        await req.session.destroy();
                        let filter = {'session':{'$regex': '.*"user":"'+user.username+'".*'}};
                        Session.deleteMany(filter);
                        await user.save();
                        res.status(200).send('Password changed successfully, redirecting to login page in 5 seconds');
                    }
                } else {
                    await token.remove();
                    res.status(400).send('User does not exist');
                }
            } else res.status(400).send('Invalid or expired token was provided');
        } else res.status(400).send('Invalid data was provided');
    });

    return router;

}
