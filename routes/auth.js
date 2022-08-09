const router = require('express').Router(),
    passport = require('passport');

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
	windowMs: 60 * 1000,
	max: 8,
	message: 'Too many requests',
});

const _limiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 100,
    message: 'Too many requests, make sure you are not behind a proxy'
});

module.exports = (client) => {

    router.post('/local', limiter, _limiter, async (req, res, next) => {
        if (req.user) res.status(200).json({ message: 'user already logged in' });
        else passport.authenticate('local', (err, user, info) => {
            if (err) return res.status(400).send('Something went wrong, try again later');
            if (!user) return res.status(401).send( 'username or password is incorrect' );
            req.logIn(user, async (err) => {
                if (err) return res.status(400).send('Something went wrong, try again later');
                if (req.body.remember == 'false') {
                    req.session.cookie.expires = false;
                    req.session.save();
                }
                client.redis.sadd(`sessions:${user.id}`, req.session.id);
                if (user.login_retry) user.login_retry = 0;
                let save = false;
                if (user.account_status == 'active') res.status(200).json({ message: 'user logged in' });
                else if (user.account_status == 'deactive') {
                    user.account_status = 'active'; save = true;
                    user.mark_modified(`account_status`);
                    res.status(200).json({ message: 'account activated' });
                } else if (user.account_status == 'delete') {
                    user.account_status = 'active'; save = true;
                    user.delete_requested_at = null;
                    user.mark_modified('account_status|delete_requested_at');
                    res.status(200).json({ message: 'account deletion cancelled' });
                } else if (user.account_status == 'deleted') return res.status(400).send( 'account already deleted' );
                if (user.account_status !== 'deleted' && Math.abs(Date.now() - user.last_location_change) > 2 * 24 * 60 * 60 * 1000) {
                    let ip_info = await client.get_ip_info(req);
                    if (ip_info && ip_info.ll) {
                        user.ip_info = ip_info;
                        user.location = {
                            type: 'Point',
                            coordinates: ip_info.ll,
                        }
                        user.last_location_change = Date.now();
                        user.mark_modified(`ip_info|location`); save = true;
                    }
                }
                if (save) await user.save();
            });
        })(req, res, next);
    });

    return router;

}
