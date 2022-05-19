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
            let nic = req.user.notifications.find(x => x.id == id);
            if (nic && nic.unread) {
                nic.unread = false;
                io.to(user.id).emit('unread', ({ notifications: {
                    count: req.user.notifications.filter(x => x.unread).length,
                    read: [nic.id]
                } }));
                await req.user.save();
                res.sendStatus(200);
            } else res.sendStatus(200);
        } else res.status(403).send('forbidden');
    });

    return router;

}
