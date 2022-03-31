import Constructor from "./constructor.js";

var lmm = 1;

class People_List extends HTMLElement {
    static get observedAttributes() {
        return ['rid'];
    }
    attributeChangedCallback(attrName, oldVal, newVal) {
        if (oldVal !== newVal) {
            this.innerHtml = '';
            this.rid = newVal;
        }
    }
    constructor() {
        super();
        this.innerHTML = `<div class="_people">${this.innerHTML}</div>`;
        this.onclick = () => {
            lmm = 1;
            $('.load-more-messages .lds-dual-ring').hide();
            $('.load-more-messages').hide();
            $('.messages-list').html('');
            $('.chat').addClass('chat-active');
            $('.navbar').addClass('chat-active');
            client.messages.room_id = this.rid;
            socket.emit('join-room', this.rid);
            history.pushState(null, null, `/spa/messages/${this.rid}`);
            let name = this.querySelector('._people-name');
            if (name && name.innerHTML) {
                document.title = name.innerHTML;
                $('.messages-header-text').text(name.innerHTML);
            }
        };
    }
}

class Messages_Bottom extends HTMLElement {
    constructor() {
        super();
        document.onkeyup = (e) => {
            let input = this.querySelector('#message-input');
            if (e.key >= 'a' && e.key <= 'z' && input && document.activeElement != input) {
                input.focus();
                input.value += e.key;
            }
        };
        this.onsubmit = () => {
            let input = this.querySelector('#message-input');
            let _message = input ? input.value : false;
            if (!_message || !client.messages.room_id) return false;
            let _id = Math.random().toString(36).substring(2, 15);
            socket.emit('send-message', ({ id: client.messages.room_id, _message, _id }));
            $('.messages-list').append(`
                <div class="message outgoing">
                    <div class="message-content">
                        <p id="${_id}" style="background-color: lightblue;">${_message}</p>
                        <p class="message-time">12:43 PM</p>
                    </div>
                    <div class="message-info" style="display: none">
                        <span>${client.username}</span>
                    </div>
                </div>
            `);
            input.value = '';
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
            socket.emit('load-more-messages', lmm + 1);
        };
    }
}

customElements.define('people-list', People_List);
customElements.define('messages-bottom', Messages_Bottom);
customElements.define('messages-header-back', Messages_Header_Back);
customElements.define('load-more-messages', Load_More_Messages);

var old_people_list = [];

const people_list = (new_people_list) => {
    if (new_people_list && JSON.stringify(new_people_list) == JSON.stringify(old_people_list)) return false;
    if (new_people_list) old_people_list = new_people_list;
    if (old_people_list && old_people_list.length && Array.isArray(old_people_list)) $('.people-list').html(old_people_list.map(x => {
        return `
            <people-list rid="${x.id}">
                <div class="_people-img">
                    <img src="${x.image}">
                </div>
                <div class="_people-content">
                    <span class="_people-time">1 day</span>
                    <span class="_people-name">${x.name}</span>
                    <p>${x.last_message}</p>
                </div>
            </people-list>
        `
    }).join(''));
}

var fpip = false;

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle('Messages');
        navbar('#nav__link__messages', true);
        if (!fpip) {
            fpip = true;
            $.ajax({
                type: 'GET',
                url: `/messages/fetch`,
                timeout: 30000,
                success: function(result, textStatus, xhr) {
                    people_list(result);
                    fpip = false;
                },
                error: function(xhr, textStatus, errorThrown) {
                    /* do something */
                    fpip = false;
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
                    <div class="messages-header">
                        <messages-header-back class="messages-header-back">
                            <i class='bx bx-chevron-left'></i>
                        </messages-header-back>
                        <p class="messages-header-text"></p>
                    </div>
                    <load-more-messages class="load-more-messages" style="display: none;">load more messages...<div class="lds-dual-ring" style="display: none;"></div></load-more-messages>
                    <div class="messages-list scrollbar">
                        <div class="lds-dual-ring"></div>
                    </div>
                    <messages-bottom class="messages-bottom">
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
            socket.emit('join-room', this.id);
        }
    }
}

socket.on('receive-messages', ({ messages, id, name, mm }) => {
    if (client.messages.room_id == id) {
        document.title = name;
        $('.messages-header-text').text(name);
        let html = [], lmu;
        for (var i = 0; i < messages.length; i++) {
            let m = messages[i];
            html.push(`
                <div class="message${client.id == m.user ? ' outgoing' : lmu == m.user ? ' stack-messages' : ''}${m.user == '61d001de9b64b8c435985da9' ? 'system-message' : ''}">
                    <div class="message-img">
                        <img src="/dist/img/profile/${m.user}.png">
                    </div>
                    <div class="message-content">
                        <p>${m.message}</p>
                        <p class="message-time">12:43 PM</p>
                    </div>
                    <div class="message-info" style="display: none">
                        <span>${m.username}</span>
                    </div>
                </div>
            `);
            lmu = m.user;
        }
        $('.messages-list').html(html.join(''));
        if (mm) $('.load-more-messages').show();
    }
});

socket.on('receive-message', ({ id, chat, _id }) => {
    let m = $('.message'),
        lm = m[m.length - 1],
        lu = lm.querySelector('span').innerText;
    if (client.messages.room_id == id) {
        if ($(`#${_id}`).length) $(`#${_id}`).css('background-color', '#007bff');
        else $('.messages-list').append(`
            <div id="user_${chat.user}" class="message${client.id == chat.user ? ' outgoing' : lu == chat.username ? ' stack-messages' : ''}">
                <div class="message-img">
                    <img src="/dist/img/profile/${chat.user}.png">
                </div>
                <div class="message-content">
                    <p>${chat.message}</p>
                    <p class="message-time">12:43 PM</p>
                </div>
                <div class="message-info" style="display: none">
                    <span>${chat.username}</span>
                </div>
            </div>
        `);
    }
});

socket.on('receive-more-messages', ({ id, num, messages, mm }) => {
    if (client.messages.room_id == id && messages.length && num == (lmm + 1)) {
        let html = [], lmu;
        for (var i = 0; i < messages.length; i++) {
            let m = messages[i];
            html.push(`
                <div class="message${client.id == m.user ? ' outgoing' : lmu == m.user ? ' stack-messages' : ''}${m.user == '61d001de9b64b8c435985da9' ? 'system-message' : ''}">
                    <div class="message-img">
                        <img src="/dist/img/profile/${m.user}.png">
                    </div>
                    <div class="message-content">
                        <p>${m.message}</p>
                        <p class="message-time">12:43 PM</p>
                    </div>
                    <div class="message-info" style="display: none">
                        <span>${m.username}</span>
                    </div>
                </div>
            `);
            lmu = m.user;
        }
        $('.messages-list').prepend(html.join(''));
        lmm++;
        $('.load-more-messages .lds-dual-ring').hide();
    } else $('.load-more-messages .lds-dual-ring').hide();
    if (!mm) $('.load-more-messages').hide();
});

socket.on('join-room-error', ({ id, message }) => {
    if (client.messages.room_id == id) $('.messages-list').append(message);
});