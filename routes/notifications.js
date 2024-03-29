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
            } else {
                let notifications = [];
                for (let i = req.user.notifications.length; i--;) {
                    let notification = req.user.notifications[i];
                    if (!notification) break;
                    if (!isNaN(notification.title) && notification.user_id) {
                        let user = await client.database.functions.get_user(notification.user_id);
                        notification.title = client.parse(client.common_notification_texts[notification.title], user.name);
                    }
                    notifications.push(notification);
                }
                res.status(200).send({ notifications, mm: false });
            }
            /*
            } else res.status(200).send({ 
                notifications: req.user.notifications.slice(req.user.notifications.length - 10).reverse(),
                mm: req.user.notifications.length - 10 > 0 ? true : false
            });
            */
        } else res.status(403).send('forbidden');
    });

    router.post('/read', async (req, res) => {
        if (req.user) {
            let id = req.body.id;
            let _nic = req.user.notifications.findIndex(x => x.id == id);
            let nic = _nic > -1 ? req.user.notifications[_nic] : false;
            if (nic && nic.unread) {
                nic.unread = false;
                client.io.to(req.user.id).emit('unread', ({ notifications: {
                    count: req.user.notifications.filter(x => x.unread).length,
                    read: [nic.id]
                } }));
                req.user.mark_modified(`notifications[${_nic}]`);
                await req.user.save();
                res.sendStatus(200);
            } else res.sendStatus(200);
        } else res.status(403).send('forbidden');
    });

    router.post('/read_all', async (req, res) => {
        if (req.user) {
            let unread_notifications = req.user.notifications.filter(x => x.unread);
            for (let i = 0; i < unread_notifications.length; i++) {
                unread_notifications[i].unread = false;
            }
            client.io.to(req.user.id).emit('unread', ({ notifications: {
                count: 0,
                read: [],
            } }));
            req.user.mark_modified(`notifications`);
            await req.user.save();
            res.sendStatus(200);
        }
    });

    return router;

}
