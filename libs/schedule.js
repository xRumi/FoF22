module.exports = (client) => {
    client.database.functions.schedule = async () => {
        setInterval(async () => {
		    await client.database.token.deleteMany({ 'expire_at': { $lt: Date.now() } });
        }, 60000);
    }
}