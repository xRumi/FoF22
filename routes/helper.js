const router = require('express').Router();
const metadata_scraper = require('metadata-scraper');
const fetch = require('node-fetch');

module.exports = (client) => {

    router.post('/metadata-scraper', async (req, res) => {
        if (req.user) {
            let urls = req.body.urls;
            if (Array.isArray(urls) && urls.length && urls.length < 20) {
                Promise.all(urls.map(x => fetch(x?.url).then(y => y.text()).then(y => { x.html = y; }).catch(() => {}))).then(x => {
                    Promise.all(urls.map(x => metadata_scraper({ html: x.html }).then(y => x.result = y).catch(() => {}))).then(y => {
                        res.status(200).send(urls.map(z => ({
                            url: z.url,
                            id: z.id,
                            result: z.result
                        })));
                    });
                }).catch(() => res.sendStatus(400));
            } else res.sendStatus(400);
        } else res.sendStatus(403);
    });

    return router;
}
