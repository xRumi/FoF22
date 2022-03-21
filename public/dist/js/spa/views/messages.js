import Constructor from "./constructor.js";

var data = {
    cache: {},
    room_id: null
};

const people_list = () => {
    if (data.cache.people_list?.length) $('.people-list').html(data.cache.people_list.map(x => {
        return `
            <div class="_people" onclick="$.fn.message('${x.id}');">
                <div class="_people-img">
                    <img src="${x.image}">
                </div>
                <div class="_people-content">
                    <span class="_people-time">1 day</span>
                    <span class="_people-name">${x.name}</span>
                    <p>${x.last_message}</p>
                </div>
            </div>
        `
    }).join(''));
}

const join_room = (id) => {
    $.fn.socket.emit('join-room', id);
    data.room_id = id;
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle("Messages");
        $.fn.nav('#nav__link__messages', true);
        $.fn.cleanup = () => {
            $('#app').off('submit.message-submit-form');
            $.fn.join_room = null;
        }
        $.ajax({
            type: 'GET',
            url: `/messages/fetch`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                data.cache.people_list = result;
                people_list();
            },
            error: function(xhr, textStatus, errorThrown) {
                /* do something */
            },
        });

        $.fn.message = (id) => {
            join_room(id);
        }

        $('#app').on('submit.message-submit-form', '#message-submit-form', (e) => {
            console.log('5');
            e.preventDefault();
            if (!$("#message-input").val() || !data.room_id) return false;
            $.fn.socket.emit('send-message', ({ id: data.room_id, _message: $("#message-input").val(), _id: Math.random().toString(36).substring(2, 15) }));
            $("#message-input").val('');
        });

        $.fn.socket.on('receive-messages', ({ user, messages, id }) => {
            if (data.room_id == id) {
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
    
        $.fn.socket.on('receive-message', ({ user, id, chat, _id }) => {
            if (data.room_id == id) {
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
    }

    async getHtml() {
        people_list();
        return `
            <div class="chat">
                <div class="people">
                    <div class="people-search"></div>
                    <div class="people-list"></div>
                </div>
                <div class="messages">
                    <div class="messages-header">
                        <span class="messages-header-back">
                            <i class='bx bx-chevron-left'></i>
                        </span>
                    </div>
                    <div class="messages-list"></div>
                    <div class="messages-bottom">
                        <div class="messages-input">
                            <form id="message-submit-form">
                                <input type="text" name="message-input" id="message-input">
                                <button type="submit" class="message-submit">Send</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}