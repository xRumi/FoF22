const router = require('express').Router();

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user) res.render('index', { user: req.user, route: 'settings' });
        else res.status(403).redirect('/login?back_to=/spa/menu');
    });

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            res.status(200).send(`this is settings page`);
        } else res.status(403).send('forbidden');
    });

    return router;
    
}
