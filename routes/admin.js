const router = require('express').Router();

Function.prototype.toJSON = function() { return "(...)" };

const _eval = async (content, client, user) => {
    const result = new Promise((resolve) => resolve(eval(content)));
	return result.then((output) => {
	    return JSON.stringify(output);
	}).catch((err) => {
		return err?.toString();
	});
}

router.get('/', async (req, res) => {
    if (req.user?.username == 'rumi') res.render('admin');
    else res.render('404');
});

router.post('/console', async (req, res) => {
    if (req.user?.username == 'rumi') {
        if (req.body.code) {
            let output = await _eval(req.body.code, req.client, req.user);
            res.status(200).send(output);
        } else res.status(400).send('Code is empty');
    } else res.sendStatus(404);
})

module.exports = router;