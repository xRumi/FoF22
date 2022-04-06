const router = require('express').Router();
const Session = require('../models/Session.js');

router.get('/info', async (req, res) => {
    if (req.user) {
        res.status(200).json({
            username: req.user.username,
            name: req.user.name,
            email: req.user.email,
        });
    } else res.status(403).send('forbidden');
});

router.post('/update/info', async (req, res) => {
    if (req.user) {
        let save = false;
        const messages = [],
            name = req.body.name,
            email = req.body.email?.toLowerCase(),
            password = req.body.password;
        if (!email && !name) res.status(406).send( 'not enough information provided' );
        else if (password && password === req.user.password) {
            if (name) {
                if (name.length < 30) {
                    req.user.name = name;
                    save = true;
                    messages.push({
                        message: 'Full name updated',
                        status: 'success'
                    });
                } else messages.push({
                    message: 'maximum length for name is 29'
                })
            }
            if (email) {
                if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) && email.length < 64) {
                    req.user.email = email;
                    save = true;
                    messages.push({
                        message: 'Email address updated',
                        status: 'success'
                    });
                } else messages.push({
                    message: 'invalid email address provided',
                    status: 'warning'
                });
            }
            if (save) await req.user.save();
            res.status(200).json({ messages, data: {
                name: req.user.name,
                email: req.user.email
            } });
        } else res.status(401).send( 'password is incorrect' );
    } else res.status(403).send( 'forbidden' )
});

router.post('/update/password', async (req, res) => {
    if (req.user) {
        const new_pass = req.body.new_pass,
            old_pass = req.body.old_pass;
        if (!new_pass || !old_pass) res.status(406).send( 'not enough information provided' );
        else if (old_pass === req.user.password) {
            if (new_pass.length > 5 && new_pass.length < 21) {
                req.user.password = new_pass;
                await req.user.save();
                await req.session.destroy();
                let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
                Session.deleteMany(filter);
                res.status(200).send('password successfully changed');
            } else res.status(400).send ('invalid data');
        } else res.status(401).send('password is incorrect');
    } else res.status(403).send('forbidden')
});

router.post('/force_logout', async (req, res) => {
    if (req.user) {
        if (req.body.password === req.user.password) {
            await req.session.destroy();
            res.status(200).send( 'force logout success' );
            let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
            Session.deleteMany(filter);
        } else res.status(401).send( 'password is incorrect' );
    } else res.status(403).send( 'forbidden' );
});

router.post('/deactive', async (req, res) => {
    if (req.user) {
        if (req.body.password === req.user.password) {
            req.user.status = 'deactive';
            await req.user.save();
            console.log(req.user)
            await req.session.destroy();
            res.status(200).send( 'account deactivated, re-login to cancel' );
            let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
            Session.deleteMany(filter);
        } else res.status(401).send( 'password is incorrect' );
    } else res.status(403).send( 'forbidden' );
});

router.post('/delete', async (req, res) => {
    if (req.user) {
        if (req.body.password === req.user.password) {
            req.user.status = 'delete';
            req.user.delete_time = new Date((new Date()) + 86400000);
            await req.user.save();
            console.log(req.user)
            await req.session.destroy();
            res.status(200).send( 'account will be deleted in 24 hours, re-login to cancel' );
            let filter = {'session':{'$regex': '.*"user":"'+req.user.username+'".*'}};
            Session.deleteMany(filter);
        } else res.status(401).send( 'password is incorrect' );
    } else res.status(403).send( 'forbidden' );
});

module.exports = router;
