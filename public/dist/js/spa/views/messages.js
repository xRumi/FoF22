import Constructor from "./constructor.js";

class People_List extends HTMLElement {
    static get observedAttributes() {
        return ['rid'];
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (oldVal !== newVal) {
            this.innerHtml = '';
            this.rid = newVal;
            if (client.messages.room_id == this.rid) {
                this.querySelector('._people').className += " _people-active";
            }
        }
    }
    constructor() {
        super();
        this.innerHTML = `<div class="_people">${this.innerHTML}</div>`;
        this.onclick = () => {
            $('.load-more-messages .lds-dual-ring').hide();
            $('.load-more-messages').hide();
            $('.messages-list').html('');
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            $('._people-active').removeClass('_people-active');
            this.querySelector('._people').className += " _people-active";
            client.messages.room_id = this.rid;
            socket.emit('join-room', this.rid, (response) => {
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
                            if ($(".message:last-child")[0]) $(".message:last-child")[0].scrollIntoView();
                        });
                        if (mm) $('.load-more-messages').show();
                        nanobar.go(100);
                    }
                }
            });
            history.pushState(null, null, `/spa/messages/${this.rid}`);
            let name = this.querySelector('._people-name');
            if (name && name.innerHTML) {
                document.title = name.innerHTML;
                $('.messages-header-back-text').text(name.innerHTML);
            }
            nanobar.go(40);
        };
    }
}

class Messages_Bottom extends HTMLElement {
    constructor() {
        super();
        this.onsubmit = () => {
            let input = this.querySelector('#message-input');
            let _message = input ? input.value : false;
            if (!_message || !client.messages.room_id) return false;
            let _id = Math.random().toString(36).substring(2, 15);
            socket.emit('send-message', ({ id: client.messages.room_id, _message, _id }));
            $('.messages-list').append(`
                <div class="message outgoing" data-username="${client.username}">
                    <div class="message-content">
                        <p id="${_id}" style="background-color: lightblue;">${_message.replace(/[&<>]/g, (t) => ttr[t] || t)}</p>
                    </div>
                </div>
            `);
            input.value = '';
            $(".message:last-child")[0].scrollIntoView();
            return false;
        };
    }
}

class Messages_Header_Back extends HTMLElement {
    constructor() {
        super();
        this.onclick = () => {
            history.pushState(null, null, `/spa/messages`);
            document.title = 'Messages';
            $('.chat').removeClass('chat-active');
            $('.navbar').removeClass('chat-active');
        };
    }
}

class Load_More_Messages extends HTMLElement {
    constructor() {
        super();
        this.onclick = () => {
            this.querySelector('.lds-dual-ring').style.display = "inline-block";
            socket.emit('load-more-messages', $('.message')[0].getAttribute('data-id'));
        };
    }
}

customElements.define('people-list', People_List);
customElements.define('messages-bottom', Messages_Bottom);
customElements.define('messages-header-back', Messages_Header_Back);
customElements.define('load-more-messages', Load_More_Messages);

var old_people_list = [];

const periods = {
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};

const days = ["Sunday", "Monday", "Tuesday", "Wednesday ", "Thursday", "Friday", "Saturday"];

const people_list = (new_people_list) => {
    if (!new_people_list || new_people_list.length) return $('.people-list').html(`<span style="position: absolute; margin: 25px; color: red;">Empty</span>`);
    if (new_people_list && JSON.stringify(new_people_list) == JSON.stringify(old_people_list)) return false;
    if (new_people_list) old_people_list = new_people_list;
    if (old_people_list && old_people_list.length && Array.isArray(old_people_list)) $('.people-list').html(old_people_list.map(x => {
        let diff = Date.now() - x.time, time;
        if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
        else {
            let _time = new Date(x.time);
            if (diff < periods.week) time = days[_time.getDay()];
            else time = _time.toLocaleDateString();
        }
        return `
            <people-list rid="${x.id}">
                <div class="_people-img">
                    <img src="${x.image}">
                </div>
                <div class="_people-content">
                    <span class="_people-time">${time}</span>
                    <span class="_people-name">${x.name}</span>
                    <p>${x.last_message}</p>
                </div>
            </people-list>
        `
    }).join(''));
}

var _ajax0 = false;

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
                    people_list(result);
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
        return `
            <div class="chat">
                <div class="people">
                    <div class="people-header"></div>
                    <div class="people-list scrollbar">
                        <div class="lds-dual-ring"></div>
                    </div>
                </div>
                <div class="messages">
                    <div class="messages-header header-back">
                        <messages-header-back class="header-back-icon">
                            <i class='bx bx-chevron-left'></i>
                        </messages-header-back>
                        <p class="messages-header-back-text header-back-text"></p>
                    </div>
                    <load-more-messages class="load-more-messages" style="display: none;">load more messages...<div class="lds-dual-ring" style="display: none;"></div></load-more-messages>
                    <div class="messages-list scrollbar">
                        <div class="lds-dual-ring"></div>
                    </div>
                    <messages-bottom class="messages-bottom">
                        <div class="message-input-note" style="margin-left: 10px; display: none;"><div style="color: orangered;">Reply to</div><span onclick="$('.message-input-note').hide()">x</span></div>
                        <form autocomplete="off">
                            <input type="text" name="message-input" id="message-input" placeholder="type your message...">
                            <button type="submit" class="message-submit" style="display: none;">Send</button>
                        </form>
                    </messages-bottom>
                </div>
            </div>
        `;
    }

    async after_render() {
        people_list();
        if (this.id) {
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            client.messages.room_id = this.id;
            socket.emit('join-room', this.id, (response) => {
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
                            if ($(".message:last-child")[0]) $(".message:last-child")[0].scrollIntoView();
                        });
                        if (mm) $('.load-more-messages').show();
                        nanobar.go(100);
                    }
                }
            });
        }
    }

    async before_new_render() {
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
            if (prev_message_time && prev_message_time.innerText && (parseInt(prev_message.dataset.time) - parseInt(chat.time)) < 2 * 60 * 1000) {
                prev_message_time.remove();
                let diff = Date.now() - chat.time, time;
                time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
                message[0].querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${time}</div>`);
            }
        } else {
            // not tested
            let prev_message = $('.message:last-child:not(.outgoing)')[0], time;
            let prev_message_time = prev_message ? prev_message.querySelector('.message-time') : false;
            if (prev_message_time && prev_message_time.innerText && (parseInt(prev_message.dataset.time) - parseInt(chat.time)) < 2 * 60 * 1000) {
                prev_message_time.remove();
                let diff = Date.now() - chat.time;
                time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
            }
            // not tested
            $('.messages-list').append(`
                <div class="message${client.id == chat.user ? ' outgoing' : $('.message:last-child').data('user-id') == chat.user ? ' stack-message' : ''}${!chat.message ? ' message-deleted' : ''}" data-username="${chat.username}" data-user-id="${chat.user}" data-id="${chat.id}" data-time="${chat.time}">
                    <div class="message-img">
                        <img src="/dist/img/users/${chat.user}/profile.png">
                    </div>
                    <div class="message-content">
                        <p>${chat.message ? chat.message.replace(/[&<>]/g, (t) => ttr[t] || t) : '<i>This message was deleted</i>'}</p>
                        ${time ? `<div class="message-time">${time}</div>` : ''}
                    </div>
                </div>
            `)
        }
    }
});

socket.on('receive-more-messages', ({ id, messages, mm }) => {
    if (client.messages.room_id == id && messages.length) {
        let html = [], lm = {};
        for (let i = 0; i < messages.length; i++) {
            let m = messages[i];
            html.push(m.user == '61d001de9b64b8c435985da9' ? `<div class="system-message" data-username="${m.username}" data-user-id="${m.user} data-id="${m.id}" data-time="${m.time}">${m.message}</div>` : `
                <div class="message${client.id == m.user ? ' outgoing' : lm.user == m.user ? ' stack-message' : ''}${!m.message ? ' message-deleted' : ''}" data-id="${m.id}">
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
        $('.messages-list').prepend(html.join(''));
        $('.load-more-messages .lds-dual-ring').hide();
    } else $('.load-more-messages .lds-dual-ring').hide();
    if (!mm) $('.load-more-messages').hide();
});

$.contextMenu({
    selector: '.message:not(.outgoing, .message-deleted) p', 
    callback: function(key, options) {
        let message_content = options.$trigger.parent();
        let message = message_content.parent();
        if (key == 'reply') {
            $('.message-input-note div').html(`You are replying to a <a href="#">message</a> from ${message.data('username')}`);
            $('.message-input-note').show();
        }
    },
    items: {
        "reply": { name: "Reply", icon: "add" },
    }
});

$.contextMenu({
    selector: '.message.outgoing:not(.message-deleted) p', 
    callback: function(key, options) {
        let message_content = options.$trigger.parent();
        let message = message_content.parent();
        if (key == 'reply') {
            $('.message-input-note div').html(`You are replying to a <a href="#">message</a> from ${message.data('username')}`);
            $('.message-input-note').show();
        } else if (key == 'delete') {
            if (!message.data('id')) return false;
            options.$trigger.css('background-color', 'lightblue');
            socket.emit('delete-message', { id: message.data('id'), _id: client.messages.room_id}, ({ id, done }) => {
                let message = $(`[data-id="${id}"]`);
                let message_content_p = message.find('.message-content p');
                if (done) {
                    message.addClass('message-deleted');
                    message_content_p.css('background-color', '').text('This message was deleted');
                } else message.find('.message-content p').css('background-color', '');
            });
        }
    },
    items: {
        "reply": { name: "Reply", icon: "add" },
        "delete": { name: "Delete", icon: "delete" },
    }
});

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

function message_time (html, callback) {

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
            let message = messages_group[i][0],
                message_time = parseInt(message.dataset.time),
                _time = new Date(message_time),
                diff = Date.now() - message_time, time;
            if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
            else if (diff < periods.day && _time.getDate() === today.getDate()) time = `Today at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
            else {
                if (diff < periods.week) time = `${days[_time.getDay()]} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
                else time = `${_time.toLocaleDateString()} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
            }
            message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${time}</div>`);
        } else {
            for (let j = 0; j < messages_group[i].length; j++) {
                let message = messages_group[i][j];
                let next_message = messages_group[i][j + 1] ? messages_group[i][j + 1] : false;
                if (next_message) {
                    if (Math.abs(parseInt(message.dataset.time) - parseInt(next_message.dataset.time)) > 60 * 1000) {
                        let message_time = parseInt(message.dataset.time),
                            _time = new Date(message_time),
                            diff = Date.now() - message_time, time;
                        if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
                        else if (diff < periods.day && _time.getDate() === today.getDate()) time = `Today at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
                        else {
                            if (diff < periods.week) time = `${days[_time.getDay()]} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
                            else time = `${_time.toLocaleDateString()} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
                        }
                        message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${time}</div>`);
                    }
                } else {
                    let message_time = parseInt(message.dataset.time),
                        _time = new Date(message_time),
                        diff = Date.now() - message_time, time;
                    if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
                    else if (diff < periods.day && _time.getDate() === today.getDate()) time = `Today at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
                    else {
                        if (diff < periods.week) time = `${days[_time.getDay()]} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
                        else time = `${_time.toLocaleDateString()} at ${_time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`
                    }
                    message.querySelector('.message-content').insertAdjacentHTML('beforeend', `<div class="message-time">${time}</div>`);
                }
            }
        }
    }

    callback(Array.prototype.concat.apply([], messages_group));
}