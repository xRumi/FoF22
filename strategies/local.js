const passport = require('passport'),
    Local_strategy = require('passport-local').Strategy,
    User = require('../models/User');

module.exports = {

    async init(client) {

        passport.serializeUser((user, done) => {
            console.log('2');
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            console.log('3');
            const user = await client.database.functions.get_user(id);
            if (user) done(null, user)
            else {
                console.log('nooooo, something went wrong in local.js');
                done(null, false);
            }
            /*
            User.findById(id, (err, user) => {
                if (user) client.database_cache.users.set(user.username, user);
                done(err, user);
            });
            */
        });

        passport.use(
            new Local_strategy(async (username, password, done) => {
                console.log('4');
                try {
                    const user = await client.database.functions.get_user_by_username(username?.toLowerCase());
                    if (user && user.status !== 'deleted' && user.username !== 'system') {
                        if (user.password && user.password === password) return done(null, user);
                        else return done(null, false);
                    } else return done(null, false);
                } catch (err) {
                    console.log(err);
                    return done(err);
                }
            })
        );
    }
};