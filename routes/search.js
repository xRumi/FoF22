const router = require('express').Router();

router.get('/', async (req, res) => {
    if (req.user) res.render("index", { user: req.user, route: 'search' });
    else res.redirect('/login?ref=search');
});

router.get('/fetch', async (req, res) => {
    if (req.user) {
        res.status(200).send('this is search page');
    } else res.status(403).send('forbidden');
});

/*
router.get('/user', async (req, res) => {
    if (req.user) {
        const key = req.query.key;
        console.log(key);
        const result = Array.from(req.client.database_cache.users).filter(x => x[1]?.username?.includes(key))?.map(x => x[1].username);
        if (result.length) res.end(JSON.stringify(result));
        else res.end(JSON.stringify([]))
    } else res.redirect('/login');
});
*/

module.exports = router;