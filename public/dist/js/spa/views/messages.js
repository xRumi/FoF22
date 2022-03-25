import Constructor from "./constructor.js";

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
        this.onsubmit = () => {
            let input = this.querySelector('#message-input');
            let _message = input ? input.value : false;
            if (!_message || !client.messages.room_id) return false;
            socket.emit('send-message', ({ id: client.messages.room_id, _message, _id: Math.random().toString(36).substring(2, 15) }));
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

customElements.define('people-list', People_List);
customElements.define('messages-bottom', Messages_Bottom);
customElements.define('messages-header-back', Messages_Header_Back);

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

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle('Messages');
        navbar('#nav__link__messages', true);
        $.ajax({
            type: 'GET',
            url: `/messages/fetch`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                people_list(result);
            },
            error: function(xhr, textStatus, errorThrown) {
                /* do something */
            },
        });
    }

    async render() {
        return `
            <div class="chat">
                <div class="people">
                    <div class="people-header"></div>
                    <div class="people-list scrollbar"></div>
                </div>
                <div class="messages">
                    <div class="messages-header">
                        <messages-header-back class="messages-header-back">
                            <i class='bx bx-chevron-left'></i>
                        </messages-header-back>
                        <p class="messages-header-text"></p>
                    </div>
                    <div class="messages-list scrollbar"></div>
                    <messages-bottom class="messages-bottom">
                        <form autocomplete="off">
                            <input type="text" name="message-input" id="message-input" placeholder="type your message...">
                            <button type="submit" class="message-submit">Send</button>
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

socket.on('receive-messages', ({ user, messages, id, name }) => {
    if (client.messages.room_id == id) {
        document.title = name;
        $('.messages-header-text').text(name);
        $('.messages-list').html(messages.map(x => {
            return `
                <div class="message${user == x.user ? ' outgoing' : ''}">
                    <div class="message-img">
                        <img src="/dist/img/profile/${x.user}.png">
                    </div>
                    <div class="message-content">
                        <p>${x.message}</p>
                        <span class="message-info">12:43 PM</span>
                    </div>
                </div>
            `
        }));
    }
});

socket.on('receive-message', ({ user, id, chat, _id }) => {
    if (client.messages.room_id == id) {
        $('.messages-list').append(`
            <div class="message${user == chat.user ? ' outgoing' : ''}">
                <div class="message-img">
                    <img src="/dist/img/profile/${chat.user}.png">
                </div>
                <div class="message-content">
                    <p>${chat.message}</p>
                    <span class="message-info">12:43 PM</span>
                </div>
            </div>
        `);
    }
});

socket.on('join-room-error', ({ id, message }) => {
    if (client.messages.room_id == id) $('.messages-list').append(message);
});