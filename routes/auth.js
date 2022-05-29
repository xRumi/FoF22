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
        const returnTo = req.query.ref ? req.query.ref : '/';
        if (req.user) res.status(200).json({ message: 'user already logged in', returnTo });
        else passport.authenticate('local', (err, user, info) => {
            if (err) return res.status(400).send( err );
            if (!user) return res.status(401).send( 'username or password is incorrect' );
            req.logIn(user, async (err) => {
                if (req.body.remember == 'false') req.session.cookie.expires = false;
                if (err) return res.status(400).send( err );
                if (user.login_retry) {
                    user.login_retry = 0;
                    await user.save();
                }
                if (user.account_status == 'active') return res.status(200).json({ message: 'user logged in', returnTo });
                else if (user.account_status == 'deactive') {
                    user.accounr_status = 'active';
                    await user.save();
                    return res.status(200).json({ message: 'account activated', returnTo });
                } else if (user.account_status == 'delete') {
                    user.account_status = 'active';
                    user.delete_requested_at = null;
                    await user.save();
                    return res.status(200).json({ message: 'account deletion cancelled', returnTo });
                } else if (user.account_status == 'deleted') return res.status(400).send( 'account already deleted' );
                else {
                    console.log(user);
                    return res.status(200).json({ message: 'account status unknown', returnTo });
                }
            })
        })(req, res, next);
    });

    return router;

}
