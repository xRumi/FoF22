const passport = require('passport'),
    Local_strategy = require('passport-local').Strategy;

module.exports = {

    init(client) {

        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (id, done) => {
            const user = await client.database.functions.get_user(id);
            if (user) done(null, user);
            else done(null, false);
        });

        passport.use(
            new Local_strategy(async (username, password, done) => {
                try {
                    const user = await client.database.functions.get_user_by_username(username?.toLowerCase());
                    if (user && user.account_status !== 'deleted') return (user.password && user.password === password) ? done(null, user) : done(null, false);
                    else return done(null, false);
                } catch (err) {
                    console.log(err);
                    return done(err);
                }
            })
        );
    }
};
