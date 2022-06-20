const router = require('express').Router();

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user) res.render("index", { user: req.user, route: 'search' });
        else res.redirect('/login?ref=search');
    });

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            res.status(200).send('this is search page');
        } else res.status(403).send('forbidden');
    });

    router.get("/autocomplete", async (req, res) => {
        if (req.query.term) {
            let result = {
                names: null,
            };
            let name_regex = new RegExp(req.query.term, 'i');
            const [names] = await Promise.all([ client.database.user.find({ name: name_regex }).sort({ 'updated_at': -1, 'created_at': -1 }).limit(10) ]);

            if (names && names.length) result.names = names.map(x => ({
                id: x.id,
                username: x.username,
                name: x.name
            }));
            res.status(200).send(result);
        } else res.sendStatus(400);
    });

    return router;
}
