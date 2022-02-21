const router = require('express').Router(),
    passport = require('passport');

router.post('/local', async (req, res, next) => {
    const returnTo = req.query.ref ? req.query.ref : '/';
    if (req.user) res.status(200).json({ message: 'user already logged in', returnTo });
    else passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(400).send( err );
        if (!user) return res.status(401).send( 'username or password is incorrect' );
        req.logIn(user, async (err) => {
            if (req.body.remember == 'false') req.session.cookie.expires = false;
            if (err) return res.status(400).send( err );
            if (user.status == 'active') return res.status(200).json({ message: 'user logged in', returnTo });
            else if (user.status == 'deactive') {
                user.status = 'active';
                await user.save();
                return res.status(200).json({ message: 'account activated', returnTo });
            } else if (user.status == 'delete') {
                user.status = 'active';
                user.delete_time = null;
                await user.save();
                return res.status(200).json({ message: 'account deletion cancelled', returnTo });
            } else if (user.status == 'deleted') return res.status(400).send( 'account already deleted' );
            else {
                console.log(user);
                return res.status(200).json({ message: 'account status unknown', returnTo });
            }
        })
    })(req, res, next);
});

module.exports = router;
