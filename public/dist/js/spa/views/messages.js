import Constructor from "./constructor.js";

var old_people_list = [];

const periods = {
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const people_list = (new_people_list) => {
    if (new_people_list && JSON.stringify(new_people_list) == JSON.stringify(old_people_list)) return false;
    if (new_people_list) old_people_list = new_people_list;
    if (old_people_list && old_people_list.length && Array.isArray(old_people_list)) $('.people-list').html(old_people_list.map(x => {
        let diff = Date.now() - x.time, time,
            _time = new Date(parseInt(x.time));
        if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
        else if (diff < periods.day && _time.getDate() === today.getDate()) time = _time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        else {
            let _time = new Date(x.time);
            if (diff < periods.week) time = days[_time.getDay()];
            else time = _time.toLocaleDateString();
        }
        return $(`
            <div data-id="${x.id}" class="_people${client.messages.room_id == x.id ? ' _people-active' : ''}${x.unread ? ` _people-unread` : ''}">
                <div class="_people-img">
                    <img src="${x.image}">
                </div>
                <div class="_people-content">
                    <span class="_people-time">${time}</span>
                    <span class="_people-name">${x.name}</span>
                    <p>${x.last_message}</p>
                </div>
            </div>
        `).on('click', (e) => {
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            $('#message-input').prop('disabled', true);
            $('.load-more-messages .lds-dual-ring').hide();
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

var _ajax0 = false;
var typing = false;
var typing_timeout = undefined;
var loading_more_messages = false;

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
                        <div class="lds-dual-ring"></div>
                    </div>
                </div>
                <div class="messages">
                    <div class="messages-header header-back">
                        <div class="header-back-icon">
                            <i class='bx bx-chevron-left'></i>
                        </div>
                        <p class="messages-header-back-text header-back-text"></p>
                    </div>
                    <div class="load-more-messages" style="display: none;">
                        See More Messages
                        <div class="lds-dual-ring" style="display: none;"></div>
                    </div>
                    <div class="messages-list scrollbar">
                        <div class="lds-dual-ring"></div>
                    </div>
                    <div class="messages-typing message" style="display: none">
                        <div class="message-img"></div>
                        <div class="message-content">
                            <p><b>Rumi</b> is typing..</p>
                        </div>
                    </div>
                    <div class="messages-bottom">
                        <form autocomplete="off">
                            <input type="text" name="message-input" id="message-input" placeholder="type your message..." disabled>
                            <button type="submit" class="message-submit" style="display: none;">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        `).on('submit', '.messages-bottom form', (e) => {
            e.preventDefault();
            let input = $('#message-input'),
                _message = input.val();
            if (!_message || !client.messages.room_id) return false;
            input.val(''); let _id = Math.random().toString(36).substring(2, 15);
            $('.messages-list').append(`
                <div class="message outgoing" data-username="${client.username}">
                    <div class="message-content">
                        <p id="${_id}" style="background-color: lightblue;">${_message.replace(/[&<>]/g, (t) => ttr[t] || t)}</p>
                    </div>
                </div>
            `);
            send_message(_message, _id, ({ id, chat, _id }) => {
                if (client.messages.room_id == id) {
                    let message_content = $(`#${_id}`);
                    if (message_content.length) {
                        message_content.css('background-color', '#007bff');
                        let message = message_content.parent().parent();
                        message.attr({ 'data-username': chat.username, 'data-user-id': chat.user, 'data-id': chat.id, 'data-time': chat.time });
                        let prev_message = message.prev()[0];
                        let prev_message_time = prev_message ? prev_message.querySelector('.outgoing .message-time') : false;
                        if (prev_message_time && prev_message_time.innerText && (parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.remove();
                        message[0].querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${parse_message_time(chat.time)}</div>`);
                    }
                }
            });
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
            $('.load-more-messages .lds-dual-ring').css('display', 'inline-block');
            loading_more_messages = true;
            load_more_messages();
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

const ttr = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

socket.on('receive-message', ({ id, chat, _id }) => {
    if (client.messages.room_id == id) {
        let message_content = $(`#${_id}`);
        if (message_content.length) {
            message_content.css('background-color', '#007bff');
            let message = message_content.parent().parent();
            message.attr({ 'data-username': chat.username, 'data-user-id': chat.user, 'data-id': chat.id, 'data-time': chat.time });
            let prev_message = message.prev()[0];
            let prev_message_time = prev_message ? prev_message.querySelector('.outgoing .message-time') : false;
            if (prev_message_time && prev_message_time.innerText && (parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.remove();
            message[0].querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${parse_message_time(chat.time)}</div>`);
        } else {
            let prev_message = client.id == chat.user ? $('.message:last-child.outgoing')[0] : $('.message:last-child:not(.outgoing)')[0];
            let prev_message_time = prev_message ? prev_message.querySelector('.message-time') : false;
            if (prev_message_time && prev_message_time.innerText && Math.abs(parseInt(chat.time) - parseInt(prev_message.dataset.time)) < 7 * 60 * 1000) prev_message_time.remove();
            $('.messages-list').append(`
                <div class="message${client.id == chat.user ? ' outgoing' : $('.message:last-child').data('user-id') == chat.user ? ' stack-message' : ''}${!chat.message ? ' message-deleted' : ''}" data-username="${chat.username}" data-user-id="${chat.user}" data-id="${chat.id}" data-time="${chat.time}">
                    <div class="message-img">
                        <img src="/dist/img/users/${chat.user}/profile.png">
                    </div>
                    <div class="message-content">
                        <p>${chat.message ? chat.message.replace(/[&<>]/g, (t) => ttr[t] || t) : '<i>This message was deleted</i>'}</p>
                        <div class="message-time">${parse_message_time(chat.time)}</div>
                    </div>
                </div>
            `)
        }
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

let today = new Date();

let months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

function parse_message_time(message_time) {
    let _time = new Date(message_time),
        diff = Math.abs(Date.now() - message_time), time;
    if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
    else if (diff < periods.day && _time.getDate() === today.getDate()) time = `Today at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
    else {
        if (diff < periods.week) time = `${days[_time.getDay()]} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
        else time = `${_time.getDate()} ${months[_time.getMonth()]} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}${_time.getFullYear() !== today.getFullYear() ? `, ${_time.getFullYear()}` : ''}`
    }
    return time;
}

function message_time(html, callback) {

    let messages = $(html.join('')).filter('.message, .system-message').toArray();

    let messages_group = messages.reduce((p, c, i, a) => {
        if (c.classList.contains('system-message')) p.push(c);
        else if (a[i - 1] && c.classList.contains('outgoing') === a[i - 1].classList.contains('outgoing')) p[p.length - 1].constructor === Array ? p[p.length - 1].push(c) : p.push([c]);
        else p.push(a[i + 1] && c.classList.contains('outgoing') === a[i + 1].classList.contains('outgoing') ? [c] : [c]);
        return p;
    }, []);

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
                } else message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${time}</div>`);
            }
        }
    }

    callback(Array.prototype.concat.apply([], messages_group));
}

function join_room(response) {
    if (response.error) {
        let { id, error } = response;
        if (client.messages.room_id == id) $('.messages-list').append(error);
        $('.messages-list .lds-dual-ring').hide();
    } else {
        let { messages, id, name, mm } = response;
        if (client.messages.room_id == id) {
            document.title = name;
            $('.messages-header-back-text').text(name);
            let html = [], lm = {};
            for (let i = 0; i < messages.length; i++) {
                let m = messages[i];
                html.push(m.user == '61d001de9b64b8c435985da9' ? `<div class="system-message" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">${m.message}</div>` : `
                    <div class="message${client.id == m.user ? ' outgoing' : lm.user == m.user ? ' stack-message' : ''}${!m.message ? ' message-deleted' : ''}" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">
                        <div class="message-img">
                            <img src="/dist/img/users/${m.user}/profile.png">
                        </div>
                        <div class="message-content">
                            <p>${m.message ? m.message.replace(/[&<>]/g, (t) => ttr[t] || t) : '<i>This message was deleted</i>'}</p>
                        </div>
                    </div>
                `);
                lm = m;
            }
            message_time(html, (_html) => {
                $('.messages-list').html(_html);
                $('#message-input').prop('disabled', false);
                if ($(".message:last-child")[0]) $(".message:last-child")[0].scrollIntoView();
            });
            if (mm) $('.load-more-messages').show();
            $(`._people[data-id="${id}"]`).css('background-color', '');
            nanobar.go(100);
        }
    }
}

function send_message(_message, _id, callback) {
    if (!client.messages.room_id) return false;
    socket.emit('send-message', ({ id: client.messages.room_id, _message, _id }), (response) => {
        if (response) callback(response);
        else socket.emit('join-room', client.messages.room_id, () => send_message(_message, _id, callback));
    });
}

function load_more_messages() {
    if (!client.messages.room_id) {
        $('.load-more-messages .lds-dual-ring').hide();
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
                        <div class="message${client.id == m.user ? ' outgoing' : lm.user == m.user ? ' stack-message' : ''}${!m.message ? ' message-deleted' : ''}" data-username="${m.username}" data-user-id="${m.user}" data-id="${m.id}" data-time="${m.time}">
                            <div class="message-img">
                                <img src="/dist/img/users/${m.user}/profile.png">
                            </div>
                            <div class="message-content">
                                <p>${m.message ? m.message.replace(/[&<>]/g, (t) => ttr[t] || t) : '<i>This message was deleted</i>'}</p>
                            </div>
                        </div>
                    `);
                    lm = m;
                }
                message_time(html, (_html) => {
                    $('.messages-list').prepend(_html);
                    $('.load-more-messages .lds-dual-ring').hide();
                });
            } else $('.load-more-messages .lds-dual-ring').hide();
            if (!mm) $('.load-more-messages').hide();
        }
    });
}
