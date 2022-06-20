const router = require('express').Router();

module.exports = (client) => {

    router.get('/fetch', async (req, res) => {
        if (req.user) {
            res.status(200).send(req.user.notifications);
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
