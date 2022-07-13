const router = require('express').Router();

module.exports = (client) => {

    router.get('/', async (req, res) => {
        if (req.user?.mail) res.render('mail', {
            from: (req.user.mail + "@" + process.env.DOMAIN),
        }); else res.render('404');
    });

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    router.post('/send', async (req, res) => {
        if (req.user?.mail) {
            let { to, subject, html } = req.body;
            if (to && subject && html && to.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) {
                client.mail.send({
                    from: `${capitalizeFirstLetter(req.user.mail)} <${req.user.mail + "@" + process.env.DOMAIN}>`,
                    to,
                    subject,
                    html
                }, (done) => {
                    if (done) {
                        res.status(200).send('mail was delivered successfully');
                    } else res.status(400).send('Something went wrong, try again later');
                });
            } else res.status(400).send('invalid mail data provided');
        } else next();
    });

    return router;
    
}
