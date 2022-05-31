const router = require('express').Router();
const Session = require('../models/Session.js');

const rateLimit = require('express-rate-limit');

const limiter1 = rateLimit({
	windowMs: 60 * 1000,
	max: 7,
	message: 'Too many requests, blocked for a minute',
});

const _limiter1 = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 30,
    message: 'Too many requests, blocked for a day'
});


const limiter2 = rateLimit({
	windowMs: 60 * 1000,
	max: 5,
	message: 'Too many requests, blocked for a minute',
});

const _limiter2 = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 20,
    message: 'Too many requests, blocked for a day'
});

module.exports = (client) => {

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            res.status(200).json({
                username: req.user.username,
                name: req.user.name,
                email: req.user.email,
            });
        } else res.status(403).send('forbidden');
    });

    router.post('/password/verify', limiter1, _limiter1, async (req, res) => {
        if (req.user) {
            let pass = req.body.password;
            if (pass === req.user.password) {
                if (req.user.login_retry) {
                    req.user.login_retry = 0;
                    await req.user.save();
                }
                res.sendStatus(200);
            } else {
                }
        } else res.status(403).send('forbidden');
    });

    router.post('/password/edit', limiter2, _limiter2, async (req, res) => {
        if (req.user) {
            const new_pass = req.body.new_pass,
                old_pass = req.body.old_pass;
            if (!new_pass || !old_pass) res.status(406).send('not enough information provided');
            else if (old_pass === req.user.password) {
                if (new_pass.length > 5 && new_pass.length < 21) {
                    if (new_pass === req.user.password) res.status(406).send('new password is the same as the previous one');
                    else {
                        if (req.user.login_retry) req.user.login_retry = 0;
                        req.user.password = new_pass;
                        await req.user.save();
                        await req.session.destroy();
                        let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
                        Session.deleteMany(filter);
                        res.status(200).send('password changed successfully');
                    }
                } else res.status(400).send ('invalid data');
            } else {
                req.user.login_retry++; let force_logout = false;
                if (req.user.login_retry > 5 && req.user.login_retry < 8) {
                    req.session.destroy();
                    force_logout = true;
                } else if (req.user.login_retry > 10) {
                    req.session.destroy();
                    let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
                    Session.deleteMany(filter);
                    force_logout = true;
                }
                await req.user.save();
                res.status(400).send(force_logout ? 'force_logout' : `incorrect password (${Math.abs(5 - req.user.login_retry)})`);
            }
        } else res.status(403).send('forbidden');
    });

    router.post('/force_logout', async (req, res) => {
        if (req.user) {
            if (req.body.password === req.user.password) {
                await req.session.destroy();
                res.status(200).send( 'force logout success' );
                let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
                Session.deleteMany(filter);
            } else res.status(401).send( 'password is incorrect' );
        } else res.status(403).send( 'forbidden' );
    });

    router.post('/deactive', async (req, res) => {
        if (req.user) {
            if (req.body.password === req.user.password) {
                req.user.account_status = 'deactive';
                await req.user.save();
                await req.session.destroy();
                res.status(200).send( 'account deactivated, re-login to cancel' );
                let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
                Session.deleteMany(filter);
            } else res.status(401).send( 'password is incorrect' );
        } else res.status(403).send( 'forbidden' );
    });

    router.post('/delete', async (req, res) => {
        if (req.user) {
            if (req.body.password === req.user.password) {
                req.user.account_status = 'delete';
                req.user.delete_time = new Date((new Date()) + 86400000);
                await req.user.save();
                await req.session.destroy();
                res.status(200).send( 'account will be deleted in 24 hours, re-login to cancel' );
                let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
                Session.deleteMany(filter);
            } else res.status(401).send( 'password is incorrect' );
        } else res.status(403).send( 'forbidden' );
    });

    return router;

}
