module.exports = (client) => {
    client.database.functions.delete_schedule_users = async () => {
        client.database.user.find({ 'status': 'delete_schedule' }).then((users) => {
			users.forEach(user => {
				client.database_cache.delete_schedule_users.set(user.id, user);
			});
		});
		setInterval(async () => {
		    client.database_cache.delete_schedule_users.forEach(async user_data => {
		        if (user_data.delete_schedule <= Date.now()) {
                    client.database_cache.delete_schedule_users.delete(user_data.id);
                    console.log(`[delete_user] deleting [${user_data.username}] data`);
                    /*user_data.name = null;
                    user_data.email = null;
                    user_data.password = null;
                    user_data.status = 'deleted';
                    user_data.delete_schedule = null;
                    await user_data.save();*/
		        }
            });
        }, 3000);
    }
}