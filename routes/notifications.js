const router = require('express').Router();

module.exports = (client) => {

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            res.status(200).send(req.user.notifications);
        } else res.status(403).send('forbidden');
    });

    return router;

}
