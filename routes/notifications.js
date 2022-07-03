const router = require('express').Router();

module.exports = (client) => {

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            let id = req.query.id;
            if (id && id < 9) {
                let a = req.user.notifications.length;
                while(--a) {
                    if (req.user.notifications[a].id == id) {
                        let notifications = (a && a > 10) ? req.user.notifications.slice(a, a - 10) : req.user.notifications.slice(0, a);
                        res.status(200).send({
                            notifications,
                            mm: a - 10 ? true : false
                        });
                    }
                }
            } else res.status(200).send({ 
                notifications: req.user.notifications.slice(req.user.notifications.length - 10).reverse(),
                mm: req.user.notifications.length - 10 > 0 ? true : false
            });
        } else res.status(403).send('forbidden');
    });

    router.get('/read', async (req, res) => {
        if (req.user) {
            let id = req.body.id;
            let _nic = req.user.notifications.findIndex(x => x.id == id);
            let nic = _nic > -1 ? req.user.notifications[_nic] : false;
            if (nic && nic.unread) {
                nic.unread = false;
                io.to(user.id).emit('unread', ({ notifications: {
                    count: req.user.notifications.filter(x => x.unread).length,
                    read: [nic.id]
                } }));
                req.user.mark_modified(`notifications[${_nic}]`);
                await req.user.save();
                res.sendStatus(200);
            } else res.sendStatus(200);
        } else res.status(403).send('forbidden');
    });

    return router;

}
