const router = require('express').Router();

router.get('/', async (req, res) => {
    if (req.user) res.render("index", { user: req.user, c_page: 'profile' });
    else res.status(403).redirect('/login?ref=profile');
});

router.get('/fetch', async (req, res) => {
    if (req.user) {
        res.status(200).send('this is profile page');
    } else res.status(403).send('forbidden');
});

module.exports = router;