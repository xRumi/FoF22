const router = require('express').Router();

const _eval = async (content, client, user, io) => {
    const result = new Promise((resolve) => resolve(eval(content)));
	return result.then((output) => stringify(output)).catch((err) => stringify(err));
}

function stringify(obj) {
    Object.prototype.toJSON = function () {
        var sobj = {},
            i;
        for (i in this)
            if (this.hasOwnProperty(i))
                sobj[i] = typeof this[i] == 'function' ?
                this[i].toString() : this[i];

        return sobj;
    };
    Array.prototype.toJSON = function () {
        var sarr = [],
            i;
        for (i = 0; i < this.length; i++)
            sarr.push(typeof this[i] == 'function' ? this[i].toString() : this[i]);

        return sarr;
    };
    let str = JSON.stringify(obj);
    delete Object.prototype.toJSON;
    return str;
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
