module.exports = (client) => {
    client.cache.functions.get_user = async (id) => {
        return client.cache.users.get(id);
    }
    client.cache.functions.update_user = async (id, { status, last_online }) => {
        let user = client.cache.users.get(id);
        if (user) {
            if (status) user.status = status;
            if (last_online) user.last_online = last_online;
        } else user = client.cache.users.set(id, { status });
        return true;
    }
    client.cache.functions.get_many_user = async ( _users, callback ) => {
        Promise.all(_users.map(user => client.database.functions.get_user(user))).then(users => {
            let result = [];
            for (let i = 0; i < users.length; i++) {
                let user = users[i];
                if (user.hide_presence) result.push({ id: user.id, name: user.name, status: 'offline' });
                else {
                    let __user = client.cache.users.get(user.id);
                    if (__user) result.push({ id: user.id, name: user.name, status: __user.status, last_online: __user.last_online });
                    else result.push({ id: user.id, name: user.name, status: 'offline' });
                }
            }
            callback(null, result);
        }).catch(e => {
            console.log(e);
            callback(true);
        }); 
    }
    client.cache.functions.get_friends = async ( friends ) => {
        let data = [];
        for (let i = 0; i < friends.length; i++) {
            let _data = client.cache.users.get(friends[i]);
            if (!_data) data.push({ status: 'offline' });
            else data.push(_data);
        }
        return data;
    }
}
