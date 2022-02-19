module.exports = (client) => {
    client.cache.functions.update_user = async ({ username, status }) => {
        let user = client.cache.users.get(username);
        if (user) {
            if (status) user.status = status;
        } else user = client.cache.users.set(username, { username, status });
        return true;
    }
    client.cache.functions.get_friends = async ( friends ) => {
        let data = [];
        for (var i = 0; i < friends.length; i++) {
            let _data = client.cache.users.get(friends[i]);
            if (!_data) {
                client.cache.users.set(friends[i], { username: friends[i], status: 'offline' });
                _data = client.cache.users.get(friends[i]);
                data.push(_data);
            } else data.push(_data);
        }
        return data;
    }
}