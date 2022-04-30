const router = require('express').Router();

Function.prototype.toJSON = function() { return "(...)" };

const _eval = async (content, client, user, io) => {
    const result = new Promise((resolve) => resolve(eval(content)));
	return result.then((output) => {
	    return JSON.stringify(output);
	}).catch((err) => {
		return err?.toString();
	});
}

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user?.username == 'rumi') res.render('debug');
        else res.render('404');
    });

    router.post('/js', async (req, res, next) => {
        if (req.user?.username == 'rumi') {
            if (req.body.code) {
                let output = await _eval(req.body.code, client, req.user, client.io);
                res.status(200).send(output);
            } else res.status(400).send('Code is empty');
        } else next();
    });

    return router;
}
