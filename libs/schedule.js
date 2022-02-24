module.exports = (client) => {
    client.database.functions.schedule = async () => {
        setInterval(async () => {
            client.database.user.find({ 'verified': false, 'created_at': { $gt: Date.now() +  24 * 60 * 60 * 1000 } }, async (err, users) => {
                if (err) return console.log(err);
                for (var i = 0; i < users.length; i++) {
                    let user = users[i];
                    console.log(`[schedule][database] removing user ${user.username}`);
                    client.database_cache.user.remove(user.username);
                    await client.database.token.deleteMany({ 'username': user.username });
                    await user.remove();
                }
            });
		    await client.database.token.deleteMany({ 'expire_at': { $lt: Date.now() } });
        }, 60000);
    }
}