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
            if (token.mailed > 6) res.status(400).send(`You have reached maximum for resending reset email, you can try again in ${humanize_duration(token.expire_at - Date.now())}`);
            else {
                client.mail.send({
                    from: `FoF22 <no-reply@fof22.me>`,
                    to: email,
                    subject: `Reset your password`,
                    html: `
                        <div style="font-size: 15px;">
                            Reset your account password by clicking the link below.
                        </div>
                        <br>
                        <a style="text-decoration: none;" href="https://fof22.me/reset-password/?token=${token.id}">https://fof22.me/reset-password/?token=${token.id}</a>
                        <br><br><hr>
                        <div>
                            If you did not request for this email, you don’t have to do anything.
                        </div>
                        <div>
                            Just ignore this email the way your cat ignores you.
                        </div>
                        <p>Please do not respond, this email was auto-generated. If you need additional help, send an email to <a href="mailto:help@fof22.me">help@fof22.me</p>
                    `
                }, (done) => {
                    if (done) {
                        token.mailed++;
                        token.save();
                        res.sendStatus(200);
                    } else res.sendStatus(400);
                });
            }
        }
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
        max: 6,
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
