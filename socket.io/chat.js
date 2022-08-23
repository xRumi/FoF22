const ObjectId = require("mongodb").ObjectId;
const is_function = value => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);
const fs = require("fs");
const path = require('path');
const xss = require('xss');
const video_length = require('video-length');

module.exports = (io, client, socket) => {
    socket.on('create-or-join-room', async (user_id, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        let _user = await client.database.functions.get_user(user_id);
        if (user && _user && _user.id !== user.id) {
            let room_exists = await client.database.room.findOne({ members: { $all: [user.id, _user.id], $size: 2 } });
            if (room_exists) {
                if (!user.rooms.some(x => x.id === room_exists.id)) {
                    user.rooms.push({
                        id: room_exists.id,
                    });
                    await user.save();
                }
                if (!_user.rooms.some(x => x.id === room_exists.id)) {
                    _user.rooms.push({
                        id: room_exists.id,
                    });
                    await _user.save();
                }
                callback(room_exists.id);
            } else {
                let room = await client.database.functions.create_room(`${user.username}.${_user.username}`, [user.id, _user.id], user.id);
                if (room) callback(room.id);
                else callback(null);
            }
        }
    });
    socket.on('leave-room', async (id) => {
        socket.leave(socket.room_id);
        socket.room_id = null;
        socket.chat_id = null;
    });
    socket.on('join-room', async (id, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user && user.id == socket.user_id && id) {
            if (ObjectId.isValid(id)) {
                const room = await client.database.functions.get_room(id);
                if (room) {
                    const chat = await client.database.functions.get_chat(room.chat_id);
                    if (chat) {
                        if (socket.room_id != room.id) {
                            socket.leave(socket.room_id);
                            socket.join(room.id);
                            socket.room_id = room.id;
                            socket.chat_id = room.chat_id;
                        }
                        let name;
                        if (room.type == 'private') {
                            if (room.members[0] == user.id) {
                                let _friend = await client.database.functions.get_user(room.members[1]);
                                if (_friend) name = _friend.name || _friend.username;
                            } else {
                                let _friend = await client.database.functions.get_user(room.members[0]);
                                if (_friend) name = _friend.name || _friend.username;
                            }
                        } else name = room.name;
                        let messages = chat.messages.slice(-7).filter(x => x);
                        Promise.all(messages.map(message => client.database.functions.get_user(message.user))).then(users => {
                            for (let i = 0; i < users.length; i++) {
                                let user = users[i];
                                let message = messages.find(x => x.user == user.id);
                                if (message) message.username = user.username;
                            }
                            let last_message = chat.messages[chat.messages.length - 1]
                            if (!last_message.seen_by.includes(user.id)) {
                                last_message.seen_by.push(user.id);
                                chat.mark_modified(`messages[${chat.messages.length - 1}]`); chat.save();
                                io.to(socket.room_id).emit('seen-message', { id: last_message.id, seen_by: last_message.seen_by });
                            }
                            let user_room = user.rooms.find(x => x.id == room.id);
                            if (user_room && user_room.unread) {
                                user_room.unread = false;
                                user.mark_modified('rooms'); user.save();
                                io.to(user.id).emit('unread', ({ messages: {
                                    count: user.rooms.filter(x => x.unread).length,
                                    read: [user_room.id]
                                } }));
                            }
                            Promise.all(room.members.map(member => client.database.functions.get_user(member))).then(members => {
                                let result = [];
                                for (let i = 0; i < members.length; i++) {
                                    let member = members[i];
                                    if (member.hide_presence) result.push({ id: member.id, username: user.username, name: member.name, status: 'offline' });
                                    else result.push({ id: member.id, username: user.username, name: member.name, status: member.presence.status, date: member.presence.date });
                                }
                                callback({ chat_data: {
                                    is_private: room.type == 'private',
                                    total_member: room.members.length,
                                    members: result,
                                }, user: user.id, messages, id, name: name || 'unknown', mm: chat.messages.length > 7 });
                            });
                        });
                    }
                } else callback({ id, error: '<p style="margin-left: 10px;">Oops! Chat Not Be Found</p><p style="margin-left: 10px;">Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
            } else callback({ id, error: '<p style="margin-left: 10px;">Oops! Chat Not Be Found</p><p style="margin-left: 10px;">Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
        }
    });
    /* TODO: socket.on('get-room-member') */
    socket.on('load-more-messages-up', async (id, limit = 7, callback) => {
        if (!is_function(callback)) return false;
        if (id && id.length > 8) {
            if (!socket.chat_id) return callback({ join_room: true });
            let chat = await client.database.functions.get_chat(socket.chat_id);
            if (chat && chat.room_id == socket.room_id) {
                limit = Math.abs(limit > 20 ? 20 : limit);
                let index = chat.messages.findIndex(x => x.id == id);
                if (index > -1) {
                    let messages = index - limit > -1 ? chat.messages.slice(index - limit, index) : chat.messages.slice(0, index);
                    Promise.all(messages.map(message => client.database.functions.get_user(message.user))).then(users => {
                        for (let i = 0; i < users.length; i++) {
                            let user = users[i];
                            let message = messages.find(x => x.user == user.id);
                            if (message) message.username = user.username;
                        }
                        callback({ id: socket.room_id, messages, mm: chat.messages[index - limit - 1] ? true : false });
                    });
                } else callback({ error: 'Provided message id does not exist' });
                /* not sure which one is faster T.T
                let a = chat.messages.length;
                while(a--) {
                    if (chat.messages[a]?.id == id) {
                        let messages = (a && a > limit) ? chat.messages.slice(a - limit, a) : chat.messages.slice(0, a);
                        Promise.all(messages.map(message => client.database.functions.get_user(message.user))).then(users => {
                            for (let i = 0; i < users.length; i++) {
                                let user = users[i];
                                let message = messages.find(x => x.user == user.id);
                                if (message) message.username = user.username;
                            }
                            callback({ id: socket.room_id, messages, mm: a - limit > 0 ? true : false })
                        });
                        break;
                    }
                }
                */
            }
        }
    });
    socket.on('load-more-messages-down', async (id, limit, callback) => {
        if (!is_function(callback)) return false;
        if (id && id.length > 8) {
            if (!socket.chat_id) return callback({ join_room: true });
            let chat = await client.database.functions.get_chat(socket.chat_id);
            if (chat && chat.room_id == socket.room_id) {
                limit = Math.abs(limit > 20 ? 20 : limit);
                let index = chat.messages.findIndex(x => x.id == id);
                if (index > -1) {
                    let messages = chat.messages.slice(index + 1, index + limit + 1);
                    Promise.all(messages.map(message => client.database.functions.get_user(message.user))).then(users => {
                        for (let i = 0; i < users.length; i++) {
                            let user = users[i];
                            let message = messages.find(x => x.user == user.id);
                            if (message) message.username = user.username;
                        }
                        callback({ id: socket.room_id, messages, mm: chat.messages[index + limit + 1] ? true : false });
                    });
                } else callback({ error: 'Provided message id does not exist' });
            }
        }
    });
    socket.on('send-message', async ({ id, _message, _id, _attachments = [] }, callback) => {
        if (!is_function(callback)) return false;
        if (!socket.room_id || socket.room_id !== id) return callback({ join_room: true });
        let message = _message?.trim();
        if (_attachments.length >= 15) return false;
        if (socket.room_id == id && message?.length < 2000 && (message.length || _attachments.length)) {
            let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
            if (user?.id == socket.user_id) {
                if (user.rooms.some(x => x.id == id)) {
                    let room = await client.database.functions.get_room(socket.room_id);
                    if (room?.members?.includes(user.id)) {
                        let chat = await client.database.functions.get_chat(room.chat_id);
                        if (chat) {
                            let attachments = [], callback_done = false;;
                            for (let i = 0; i < _attachments.length; i++) {
                                let { name, type, url, ext, thumbnail, height, width } = _attachments[i];
                                if (!name || !url) {
                                    callback({ error: `Attachment has missing informations` }); callback_done = true;
                                    break;
                                } else {
                                    if (thumbnail) thumbnail = xss(thumbnail);
                                    url = xss(url), type = xss(type), ext = xss(ext?.substring(0, 6));
                                    let filename = url.split('/').pop();
                                    let attachment_path = path.join(__dirname, `/../public/uploads/rooms/${room.id}/` + filename);
                                    if (fs.existsSync(attachment_path)) {
                                        let thumbnail_filename = thumbnail ? thumbnail.split('/').pop() : false;
                                        let thumbnail_path = thumbnail_filename ? path.join(__dirname, `/../public/uploads/rooms/${room.id}/` + thumbnail_filename) : false;
                                        if (thumbnail_path && !fs.existsSync(thumbnail_path)) {
                                            callback({ error: `Attachment thumbnail does not exist` }); callback_done = true;
                                            break;
                                            return;
                                        }
                                        let attachment_info = !type.match('video') ? fs.statSync(attachment_path) :
                                            await video_length(attachment_path, { bin: 'mediainfo', extended: true });
                                        if (!attachment_info) {
                                            callback({ error: `Error processing attachment` }); callback_done = true;
                                            break;
                                            return;
                                        }
                                        let attachment_data = {
                                            type: type?.substring(0, 20),
                                            url: `/uploads/rooms/${room.id}/${filename}`,
                                            size: attachment_info.size,
                                            name: xss((name?.substring(0, 200) || 'unknown') + (ext ? '.' + ext : '')),
                                        };
                                        if (width) {
                                            let width_float = Math.abs(parseFloat(width).toFixed(4));
                                            if (width_float) attachment_data.width = width_float > 1000 ? 1000 : width_float;
                                        }
                                        if (height) {
                                            let height_float = Math.abs(parseFloat(height).toFixed(4));
                                            if (height_float) attachment_data.height = height_float > 1000 ? 1000 : height_float;
                                        }
                                        if (type.match('video')) {
                                            attachment_data.thumbnail = `/uploads/rooms/${room.id}/${thumbnail_filename}`;
                                            attachment_data.duration = attachment_info.duration;
                                        }
                                        attachments.push(attachment_data);
                                    } else {
                                        callback({ error: `Attachment does not exist` }); callback_done = true;
                                        break;
                                    }
                                }
                            }
                            if (callback_done) return;
                            if (!message && !attachments.length) {
                                callback({ error: 'empty message' }); callback_done = true;
                                return;
                            }
                            let chat_data = {
                                id: Math.random().toString(36).substring(2, 15),
                                user: user.id,
                                message: xss(message || ''),
                                time: Date.now(),
                                seen_by: [],
                                attachments
                            }
                            chat.messages.push(chat_data);
                            chat.mark_modified(`messages[${chat.messages.length - 1}]`);
                            await chat.save();
                            chat_data.username = user.username;
                            
                            callback({ success: true, user: user.id, id: room.id, chat: chat_data, _id });
                            socket.broadcast.to(socket.room_id).emit('receive-message', { user: user.id, id: room.id, chat: chat_data, _id });

                            /*io.to('6241d152216bc87c370928f6').emit('receive-message', { user: '61d001de9b64b8c435985da5e', id: '6241d152216bc87c370928f6', chat_data: {
                                id: Math.random().toString(36).substring(2, 15),
                                user: '61d001de9b64b8c435985da5',
                                message: 'hey!',
                                time: Date.now(),
                                seen_by: []
                            } });*/

                            let room_members = [], _room_members = io.sockets.adapter.rooms.get(room.id);

                            for (const id of _room_members ) {
                                const room_member_socket = io.sockets.sockets.get(id);
                                if (room_member_socket?.user_id) room_members.push(room_member_socket.user_id);
                            }
                            
                            let last_message_index = chat.messages.length - 1,
                                last_message = chat.messages[last_message_index];
                            
                            Promise.all(room.members.map(user => client.database.functions.get_user(user))).then(users => {
                                Promise.all(users.filter(x => x).map(user => {
                                    let save = false, npr;
                                    if (!user.rooms.some(x => x.id === room.id)) {
                                        user.rooms.push({
                                            id: room.id
                                        }); save = true;
                                        user.mark_modified('rooms'); npr = true;
                                    }
                                    if (user.rooms[0]?.id !== room.id) {
                                        let user_room_index = user.rooms.findIndex(x => x.id == room.id);
                                        if (user_room_index > -1) {
                                            let _user_room = user.rooms[user_room_index];
                                            user.rooms.splice(user_room_index, 1); save = true;
                                            user.rooms.unshift(_user_room);
                                            user.mark_modified('rooms');
                                        }
                                    }
                                    let user_room = user.rooms.find(x => x.id == room.id);
                                    if (room_members.includes(user.id)) {
                                        if (!last_message.seen_by.includes(user.id)) {
                                            last_message.seen_by.push(user.id);
                                            chat.mark_modified(`messages[${last_message_index}]`); chat.save();
                                        }
                                        if (user_room && user_room.unread) {
                                            user_room.unread = false; save = true;
                                            user.mark_modified('rooms');
                                            io.to(user.id).emit('unread', ({ messages: {
                                                count: user.rooms.filter(x => x.unread).length,
                                                read: [user_room.id], npr
                                            } }));
                                        }
                                    } else if (!user_room.unread) {
                                        user_room.unread = true; save = true;
                                        user.mark_modified('rooms');
                                        io.to(user.id).emit('unread', ({ messages: {
                                            count: user.rooms.filter(x => x.unread).length,
                                            unread: [user_room.id], npr
                                        } }));
                                    }
                                    if (save) return user.save();
                                    else return true;
                                })).then(() => {
                                    if (last_message.seen_by?.length) 
                                        io.to(socket.room_id).emit('seen-message', { id: last_message.id, seen_by: last_message.seen_by });
                                });
                            });
                        } else socket.emit('error', 'chat does not exist');
                    } else socket.emit('error', 'room does not exist');
                }
            } else socket.emit('redirect', '/login?back_to=/spa/messages');
        }
    });
    socket.on('delete-messages', async ({ ids, _id }, callback) => {
        if (!is_function(callback)) return false;
        if (_id && Array.isArray(ids) && ids.length && ids.length < 20 && _id === socket.room_id) {
            let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
            if (!user) return callback({ err: true });
            let chat = await client.database.functions.get_chat(socket.chat_id);
            if (chat.room_id == socket.room_id) {
                let error = [], success = [], delete_attachments = [];
                for (i = 0;  i < ids.length; i++) {
                    let _a = chat.messages.findIndex(x => x.id == ids[i]);
                    if (_a > -1) {
                        let a = chat.messages[_a];
                        if (!a.deleted && a.user == user.id) {
                            a.deleted = true;
                            a.message = null;
                            if (a.attachments.length) {
                                delete_attachments.push(...a.attachments.filter(x => x.url).map(x => path.join(__dirname, `/../public/uploads/rooms/${socket.room_id}/` + x.url?.split('/').pop())));
                                delete_attachments.push(...a.attachments.filter(x => x.thumbnail).map(x => path.join(__dirname, `/../public/uploads/rooms/${socket.room_id}/` + x.thumbnail?.split('/').pop())));
                                a.attachments = [];
                            }
                            chat.mark_modified(`messages[${_a}]`);
                            await chat.save();
                            socket.broadcast.to(socket.room_id).emit('update-message', { id: socket.room_id, chat: a });
                            success.push(ids[i]);
                        } else error.push(ids[i]);
                    } else error.push(ids[i]);
                }
                callback({ error, success });
                if (delete_attachments.length)
                    Promise.all(delete_attachments.map(x => fs.promises.unlink(x))).catch(() => {});
            }
        }
    });
};
