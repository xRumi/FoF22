import Constructor from "./constructor.js";

const attachment_limit = 10;
let attachments = [],
    old_people_list = [],
    _ajax0 = false,
    typing = false,
    typing_timeout = undefined,
    loading_more_messages = false,
    is_private;

const people_list = (new_people_list) => {
    if (new_people_list && JSON.stringify(new_people_list) == JSON.stringify(old_people_list)) return false;
    if (new_people_list) old_people_list = new_people_list;
    if (old_people_list && old_people_list.length && Array.isArray(old_people_list)) $('.people-list').html(old_people_list.map(x => {
        return $(`
            <div data-id="${x.id}" class="_people${client.messages.room_id == x.id ? ' _people-active' : ''}${x.unread ? ` _people-unread` : ''}">
                <div class="_people-img">
                    <img src="${x.image}">
                </div>
                <div class="_people-content">
                    <span class="_people-time">${parse_message_time(x.time, true)}</span>
                    <span class="_people-name">${x.name}</span>
                    <p>${!x.deleted ? `${x.has_attachment ? 
                        `<i class="bx bx-paperclip"></i> ` : ''}
                        <span>${x.last_message ? x.last_message.replace(/[&<>]/g, (t) => ttr[t] || t) : ''}</span>` : '<i>This message was deleted</i>'}
                    </p>
                </div>
            </div>
        `).on('click', (e) => {
            attachments = [];
            $('#message-input-file-text').text('No file selected');
            $('.message-input-files-preview').html('');
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            $('#message-input').prop('disabled', true);
            $('#message-input-files-button').prop('disabled', true);
            $('.message-send-icon').hide();
            $('.messages-info').hide();
            $('.load-more-messages .spinner').hide();
            $('.load-more-messages').hide();
            $('.messages-list').html('');
            $('._people-active').removeClass('_people-active');
            let _people = $(e.currentTarget);
            _people.addClass('_people-active');
            client.messages.room_id = _people.data('id');
            socket.emit('join-room', client.messages.room_id, (response) => join_room(response));
            history.pushState(null, null, `/spa/messages/${client.messages.room_id}`);
            let name = e.currentTarget.querySelector('._people-name');
            if (name && name.innerHTML) {
                document.title = name.innerHTML;
                $('.messages-header-back-text').text(name.innerHTML);
            }
            nanobar.go(40);
        });
    }));
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle('Messages');
        navbar('#nav__link__messages', true);
        if (!_ajax0) {
            _ajax0 = true;
            nanobar.go(30);
            $.ajax({
                type: 'GET',
                url: `/messages/fetch`,
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    if (!result.length) $('.people-list').html(`<span style="position: absolute; margin: 25px; color: red;">Empty</span>`);
                    else people_list(result);
                    _ajax0 = false;
                    nanobar.go(100);
                },
                error: function(xhr, textStatus, errorThrown) {
                    /* do something */
                    _ajax0 = false;
                },
            });
        }
    }

    async render() {
        return $(`
            <div class="chat">
                <div class="people">
                    <div class="people-header"></div>
                    <div class="people-list scrollbar">
                        <svg class="spinner" style="width: 30px; margin-left: 30px; margin-top: 20px;" viewBox="0 0 50 50">
                            <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                        </svg>
                    </div>
                </div>
                <div class="messages">
                    <div class="messages-header header-back">
                        <div class="header-back-icon">
                            <i class='bx bx-chevron-left'></i>
                        </div>
                        <p class="messages-header-back-text header-back-text"></p>
                    </div>
                    <div class="messages-info" style="display: none;">
                        <div class="messages-info-text"></div>
                        <i class="bx bx-dots-vertical"></i>
                    </div>
                    <div class="load-more-messages" style="display: none;">
                        See Older Messages
                        <svg class="spinner" style="width: 20px; height: 20px; margin-left: 10px; position: relative; margin-bottom: -6px; display: none;" viewBox="0 0 50 50">
                            <circle class="spinner-path" style="stroke: black;" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                        </svg>
                    </div>
                    <div class="messages-list scrollbar"></div>
                    <div class="messages-typing message" style="display: none">
                        <div class="message-img"></div>
                        <div class="message-content"></div>
                    </div>
                    <div class="messages-bottom">
                        <form autocomplete="off">
                            <input type="text" name="message-input" id="message-input" placeholder="type your message..." disabled>
                            <button type="submit" style="outline: none; border: none; background-color: unset;">
                                <i style="display: none;" class='bx bx-send message-send-icon'></i>
                            </button>
                            <div id="message-input-files">
                                ${window.File && window.FileList && window.FileReader ? `
                                    <input id="message-input-files-button" type="button" value="upload" disabled> <span id="message-input-file-text" style="margin-left: 5px; font-size: 13px;">No file selected</span>
                                    <input type="file" style="display: none;" accept="image/*">
                                ` : `<span style="color: grey;">does not support file upload</span>`}
                            </div>
                            <div class="message-input-files-preview"></div>
                        </form>
                    </div>
                </div>
            </div>
        `).on('submit', '.messages-bottom form', (e) => {
            e.preventDefault();
            let input = $('#message-input'),
                _message = input.val();
            if ((!_message && !attachments.length) || !client.messages.room_id) return $('.message-send-icon').shake();
            input.val(''); let _id = Math.random().toString(36).substring(2, 15);
            $('#message-input-file-text').text('No file selected');
            $('.message-input-files-preview').html('');
            $('.messages-list').append(`
                <div id="${_id}" class="message outgoing pending-message" data-username="${client.username}">
                    <div class="message-content">
                        ${attachments.length ? attachments.map(x => `<img src="${x.base64}" data-bytes="${x.bytes}" data-name="${x.name}" data-size="${x.size}" data-lastmodified="${x.lastModified}" data-type="${x.type}" />`).join('') : ''}
                        ${_message ? '<p>' + _message.replace(/[&<>]/g, (t) => ttr[t] || t) + '</p>' : ''}
                    </div>
                </div>
            `);
            send_message(_message, attachments.map(x => ({
                name: x.name,
                bytes: x.bytes,
                type: x.type,
                size: x.size
            })), _id, (response) => {
                if (response.error) $(`#${_id}`).remove();
                else {
                    const { id, chat, _id } = response;
                    if (client.messages.room_id == id) {
                        let message = $(`#${_id}`);
                        if (message.length) {
                            message.removeClass('pending-message');
                            message.attr({ 'data-username': chat.username, 'data-user-id': chat.user, 'data-id': chat.id, 'data-time': chat.time });
                            let prev_message = message.prev()[0];
                            let prev_message_time = prev_message ? prev_message.querySelector('.outgoing .message-time') : false;
                            if (prev_message_time && prev_message_time.innerText && (parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.style.display = 'none';
                            message[0].querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${parse_message_time(chat.time)}</div>`);
                            $(`._people[data-id="${id}"]`).find('._people-content p').html(`${!chat.deleted ? `${chat.attachments && chat.attachments.length ? 
                                `<i class="bx bx-paperclip"></i> ` : ''}
                                <span>${chat.message ? chat.message.replace(/[&<>]/g, (t) => ttr[t] || t) : ''}</span>` : '<i>This message was deleted</i>'}
                            `);
                        }
                    }
                }
            });
            attachments = [];
            typing = false;
            socket.emit('messages-typing', false);
            $(".message:last-child")[0].scrollIntoView();
            return false;
        }).on('keypress', '#message-input', e => {
            if (!typing) {
                typing = true;
                socket.emit('messages-typing', true);
                typing_timeout = setTimeout(() => {
                    typing = false;
                    socket.emit('messages-typing', false);
                }, 3000);
            } else {
                clearTimeout(typing_timeout);
                typing_timeout = setTimeout(() => {
                    typing = false;
                    socket.emit('messages-typing', false);
                }, 3000);
            }
        }).on('click', '.header-back-icon', e => {
            history.pushState(null, null, `/spa/messages`);
            socket.emit('leave-room', client.messages.room_id);
            client.messages.room_id = null;
            document.title = 'Messages';
            $('.chat').removeClass('chat-active');
            $('.navbar').removeClass('chat-active');
        }).on('click', '.load-more-messages', e => {
            if (loading_more_messages) return false;
            $('.load-more-messages .spinner').show();
            loading_more_messages = true;
            load_more_messages();
        }).on('click', '#message-input-files input:button', (e) => {
            e.preventDefault();
            $(e.currentTarget).parent().find('input:file').trigger('click');
        }).on('change', '#message-input-files input:file', (e) => {
            let files = e.target.files;
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                if (!file.type.match('image')) continue;
                if (file.size > 5242880) {
                    alert(`upload limit: 5mb; skipping ${file.name}`);
                    continue;
                } else if (attachments.some(x => x.name == file.name && file.type == x.type && file.size == x.size && x.lastModified == file.lastModified)) {
                    alert(`duplicate file, skipping ${file.name}`);
                    continue;
                }
                let reader_base64 = new FileReader();
                let reader = new FileReader(), bytes;
                reader.onload = (_e) => {
                    bytes = new Uint8Array(_e.target.result)
                    reader_base64.readAsDataURL(file);
                }
                reader_base64.onload = (_e) => {
                    attachments.push({
                        type: file.type,
                        bytes,
                        name: file.name,
                        size: file.size,
                        lastModified: file.lastModified,
                        base64: _e.target.result
                    });
                    $('.message-input-files-preview').append(`<img src="${_e.target.result}" data-bytes="${file.bytes}" data-name="${file.name}" data-size="${file.size}" data-lastmodified="${file.lastModified}" data-type="${file.type}" />`);
                    let attachment_length = attachments.length;
                    if (attachment_length >= attachment_limit) {
                        $('#message-input-files-button').prop('disabled', true);
                        $('#message-input-file-text').text(`limit reached, click to remove`);
                    } else $('#message-input-file-text').text(`${attachment_length} file${attachment_length > 1 ? 's' : ''} selected, click to remove`);
                }
                reader.readAsArrayBuffer(file);
            }
            $(e.currentTarget).val('');
        }).on('click', '.message-input-files-preview', (e) => {
            let that = $(e.target);
            let attachment_index = attachments.findIndex(x => x.name == that.data('name') && x.type == that.data('type') && x.size == that.data('size') && x.lastModified == that.data('lastmodified'));
            if (attachment_index > -1) {
                attachments.splice(attachment_index, 1);
                that.remove();
                $('#message-input-files-button').prop('disabled', false);
                let attachment_length = attachments.length;
                $('#message-input-file-text').text(attachment_length ? `${attachment_length} file${attachment_length > 1 ? 's' : ''} selected, click to remove` : 'No file selected');
            }
        }).on('click', '.message-content img', (e) => {
            let that = $(e.currentTarget).clone();
            history.pushState(null, null, window.location.href.replace(window.location.origin, ""));
            $('.view-images').html(that);
            $('.view-image-header-text').text(that.data('name'));
            $('.view-image').show();
        });
    }

    async after_render() {
        people_list();
        if (this.id) {
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            client.messages.room_id = this.id;
            socket.emit('join-room', this.id, (response) => join_room(response));
        }
    }

    async before_new_render() {
        socket.emit('leave-room', client.messages.room_id);
        client.messages.room_id = null;
        $('.chat').removeClass('chat-active');
        $('.navbar').removeClass('chat-active');
    }
}

socket.on('receive-message', ({ id, chat, _id }) => {
    if (client.messages.room_id == id) {
        let message = $(`#${_id}`);
        if (message.length) {
            message.removeClass('pending-message');
            message.attr({ 'data-username': chat.username, 'data-user-id': chat.user, 'data-id': chat.id, 'data-time': chat.time });
            let prev_message = message.prev()[0];
            let prev_message_time = prev_message ? prev_message.querySelector('.outgoing .message-time') : false;
            if (prev_message_time && prev_message_time.innerText && (parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.style.display = 'none';
            message[0].querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${parse_message_time(chat.time)}</div>`);
        } else {
            let prev_message = client.id == chat.user ? $('.message:last-child.outgoing')[0] : $('.message:last-child:not(.outgoing)')[0];
            let prev_message_time = prev_message ? prev_message.querySelector('.message-time') : false;
            if (prev_message_time && prev_message_time.innerText && Math.abs(parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.style.display = 'none';
            $('.messages-list').append(`
                <div class="message${client.id == chat.user ? ' outgoing' : $('.message:last-child').data('user-id') == chat.user ? ' stack-message' : ''}${chat.deleted ? ' message-deleted' : ''}" data-username="${chat.username}" data-user-id="${chat.user}" data-id="${chat.id}" data-time="${chat.time}">
                    <div class="message-img">
                        <img src="/uploads/users/${chat.user}/profile.png" onclick="$.fn.navigateTo('/spa/profile/${chat.user}');">
                    </div>
                    <div class="message-content">
                        ${!chat.deleted ? `
                            ${chat.attachments ? chat.attachments.filter(x => x.type.match('image')).map(x => `<img src="${x.url}" data-name="${x.name}" />`).join('') : ''}
                            ${chat.message ? '<p>' + chat.message.replace(/[&<>]/g, (t) => ttr[t] || t) + '</p>' : ''}
                        ` : `<p><i>This message was deleted</i>`}
                        <div class="message-time">${parse_message_time(chat.time)}</div>
                    </div>
                </div>
            `);
        }
        $(`._people[data-id="${id}"]`).find('._people-content p').html(`${!chat.deleted ? `${chat.attachments && chat.attachments.length ? 
            `<i class="bx bx-paperclip"></i> ` : ''}
            <span>${chat.message ? chat.message.replace(/[&<>]/g, (t) => ttr[t] || t) : ''}</span>` : '<i>This message was deleted</i>'}
        `);
    }
});

/*
    *** deletes a message ***
    
    socket.emit('delete-message', { id: message.data('id'), _id: client.messages.room_id}, ({ id, done }) => {
        let message = $(`[data-id="${id}"]`);
        let message_content_p = message.find('.message-content p');
        if (done) {
            message.addClass('message-deleted');
            message_content_p.css('background-color', '').text('This message was deleted');
        } else message.find('.message-content p').css('background-color', '');
    });

*/

socket.on('update-message', ({ id, chat }) => {
    if (client.messages.room_id == id) {
        let message = $(`[data-id="${chat.id}"]`);
        if (message.length) {
            let message_content_p = message.find('.message-content p');
            if (chat.message) {
                message_content_p.css('background-color', '').text(chat.message);
            } else {
                message.addClass('message-deleted');
                message_content_p.css('background-color', '').text('This message was deleted');
            }
        }
    }
});

socket.on('seen-message', ({ id, seen_by }) => {
    let tm = $(`.outgoing[data-id=${id}]`);
    if (tm.length) {
        if (is_private && seen_by.includes(is_private)) 
            tm.find('.message-time').prepend(`<b>seen</b> • `);
    }
});

let today = new Date();

let months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

function parse_message_time(message_time, minimal) {
    let _time = new Date(message_time),
        diff = Math.abs(Date.now() - message_time), time;
    if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
    else if (diff < periods.day && _time.getDate() === today.getDate()) time = `${!minimal ? `Today at ` : ''}${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
    else {
        if (diff < periods.week) time = `${days[_time.getDay()]}${!minimal ? ` at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : ``}`;
        else time = `${_time.getDate()} ${months[_time.getMonth()]}${!minimal ? ` at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : ``}${_time.getFullYear() !== today.getFullYear() ? `, ${_time.getFullYear()}` : ''}`
    }
    return time;
}

function message_time(html, callback, last_message = {}) {
    let messages = $(html.join('')).filter('.message, .system-message').toArray(), seen_by = '';
    let messages_group = messages.reduce((p, c, i, a) => {
        if (c.classList.contains('system-message')) p.push(c);
        else if (a[i - 1] && c.classList.contains('outgoing') === a[i - 1].classList.contains('outgoing')) p[p.length - 1].constructor === Array ? p[p.length - 1].push(c) : p.push([c]);
        else p.push(a[i + 1] && c.classList.contains('outgoing') === a[i + 1].classList.contains('outgoing') ? [c] : [c]);
        return p;
    }, []);
    if (is_private && last_message.seen_by && last_message.seen_by.length && last_message.user == client.id) seen_by = is_seen(last_message, is_private);
    for (let i = 0; i < messages_group.length; i++) {
        if (messages_group[i].constructor !== Array) continue;
        else if (messages_group[i].length == 1) {
            let message = messages_group[i][0];
            message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${parse_message_time(parseInt(message.dataset.time))}</div>`);
        } else {
            for (let j = 0; j < messages_group[i].length; j++) {
                let message = messages_group[i][j];
                let next_message = messages_group[i][j + 1] ? messages_group[i][j + 1] : false;
                let time = parse_message_time(parseInt(message.dataset.time));
                if (next_message) {
                    if (Math.abs(parseInt(message.dataset.time) - parseInt(next_message.dataset.time)) > 7 * 60 * 1000)
                        message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${time}</div>`);
                } else message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${seen_by || ''}${time}</div>`);
            }
        }
    }
    callback(Array.prototype.concat.apply([], messages_group));
}

function is_seen(last_message, other_member) {
    if (last_message.seen_by.includes(other_member)) {
        return '<b>seen</b> • ';
    }
}

function join_room(response) {
    if (response.error) {
        let { id, error } = response;
        if (client.messages.room_id == id) $('.messages-list').append(error);
        $('.messages-list .spinner').hide();
    } else {
        let { chat_data, messages, id, name, mm } = response;
        if (client.messages.room_id == id) {
            document.title = name;
            $('.messages-header-back-text').text(name);
            let html = [], lm = {};
            for (let i = 0; i < messages.length; i++) {
                let m = messages[i];
                html.push(m.user == '61d001de9b64b8c435985da9' ? `<div class="system-message" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">${m.message}</div>` : `
                    <div class="message${client.id == m.user ? ' outgoing' : lm.user == m.user ? ' stack-message' : ''}${m.deleted ? ' message-deleted' : ''}" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">
                        <div class="message-img">
                            <img src="/uploads/users/${m.user}/profile.png" onclick="$.fn.navigateTo('/spa/profile/${m.user}');">
                        </div>
                        <div class="message-content">
                            ${!m.deleted ? `
                                ${m.attachments ? m.attachments.filter(x => x.type.match('image')).map(x => `<img src="${x.url}" data-name="${x.name}" />`).join('') : ''}
                                ${m.message ? '<p>' + m.message.replace(/[&<>]/g, (t) => ttr[t] || t) + '</p>' : ''}
                            ` : `<p><i>This message was deleted</i>`}
                        </div>
                    </div>
                `);
                lm = m;
            }
            messages_info_header_text(chat_data);
            message_time(html, (_html) => {
                $('.messages-list').html(_html);
                $('#message-input').prop('disabled', false);
                $('#message-input-files-button').prop('disabled', false);
                $('.message-send-icon').show();
                if ($(".message:last-child")[0]) $(".message:last-child")[0].scrollIntoView();
            }, messages[messages.length - 1]);
            if (mm) $('.load-more-messages').show();
            $(`._people[data-id="${id}"]`).css('background-color', '');
            nanobar.go(100);
        }
    }
}

function send_message(_message, _attachments, _id, callback) {
    if (!client.messages.room_id) return false;
    socket.emit('send-message', ({ id: client.messages.room_id, _message, _id, _attachments }), (response) => {
        if (response.success) callback(response);
        else if (response.join_room) socket.emit('join-room', client.messages.room_id, () => send_message(_message, _attachments, _id, callback));
        else if (response.error) callback({ error: response.error });
    });
}

function messages_info_header_text(chat_data) {
    if (chat_data.is_private) {
        let other_member = chat_data.members.find(x => x.id !== client.id); is_private = other_member ? other_member.id : false;
        if (other_member) $('.messages-info-text').html(other_member ?
            other_member.status == 'online' ?
                `<span style="color: green;">online</span>` :
                other_member.last_online ? 
                `active ${active_ago(other_member.last_online)}` :
                `offline`
            : `offline`).parent().show();
    }
}

function active_ago(time_) {
    let _time = new Date(time_),
        diff = Math.abs(Date.now() - _time);
    return Math.floor(diff / periods.day) ? Math.floor(diff / periods.day) + 'd ago' : Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
}

function load_more_messages() {
    if (!client.messages.room_id) {
        $('.load-more-messages .spinner').hide();
        return false;
    }
    socket.emit('load-more-messages', $('.message')[0].getAttribute('data-id'), (response) => {
        if (!response) socket.emit('join-room', client.messages.room_id, () => load_more_messages());
        else {
            let { id, messages, mm } = response;
            loading_more_messages = false;
            if (client.messages.room_id == id && messages.length) {
                let html = [], lm = {};
                for (let i = 0; i < messages.length; i++) {
                    let m = messages[i];
                    html.push(m.user == '61d001de9b64b8c435985da9' ? `<div class="system-message" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">${m.message}</div>` : `
                        <div class="message${client.id == m.user ? ' outgoing' : lm.user == m.user ? ' stack-message' : ''}${m.deleted ? ' message-deleted' : ''}" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">
                            <div class="message-img">
                                <img src="/uploads/users/${m.user}/profile.png" onclick="$.fn.navigateTo('/spa/profile/${m.user}');">
                            </div>
                            <div class="message-content">
                                ${!m.deleted ? `
                                    ${m.attachments ? m.attachments.filter(x => x.type.match('image')).map(x => `<img src="${x.url}" data-name="${x.name}" />`).join('') : ''}
                                    ${m.message ? '<p>' + m.message.replace(/[&<>]/g, (t) => ttr[t] || t) + '</p>' : ''}
                                ` : `<p><i>This message was deleted</i>`}
                            </div>
                        </div>
                    `);
                    lm = m;
                }
                message_time(html, (_html) => {
                    $('.messages-list').prepend(_html);
                    $('.load-more-messages .spinner').hide();
                }, {});
            } else $('.load-more-messages .spinner').hide();
            if (!mm) $('.load-more-messages').hide();
        }
    });
}
