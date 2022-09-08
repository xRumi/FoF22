const router = require('express').Router();
const metadata_scraper = require('metadata-scraper');

module.exports = (client) => {

    router.post('/metadata-scraper', async (req, res) => {
        if (req.user) {
            let urls = req.body;
            if (Array.isArray(urls) && urls.length && urls.length < 20) {
                Promise.all(urls.map(x => metadata_scraper(x?.url).then(y => { console.log(y); x.result = y; }).catch(() => {}))).then(x => {
                    res.status(200).send(urls);
                }).catch(() => res.sendStatus(400));
            } else res.sendStatus(400);
        } else res.sendStatus(403);
    });

    return router;
}
