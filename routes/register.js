const router = require('express').Router();

router.get('/', async (req, res) => {
    if (!req.user) res.render('register');
    else res.redirect('/');
});

// todo: registering stuff

module.exports = router;