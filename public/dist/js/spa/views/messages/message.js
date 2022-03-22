import Constructor from "./constructor.js";

const people_list = () => {
    if ($.fn.data.messages.cache.people_list?.length) $('.people').html(data.cache.people_list.map(x => {
        return `
            <div class="_people">
                <a href="/spa/messages/${x.id}">
                    <div class="_people-img">
                        <img src="${x.image}">
                    </div>
                    <div class="_people-content">
                        <span class="_people-time">1 day</span>
                        <span class="_people-name">${x.name}</span>
                        <p>${x.last_message}</p>
                    </div>
                </a>
            </div>
        `
    }).join(''));
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
            $.fn.hide_nav_in_mobile = false;
        }
        $.fn.hide_nav_in_mobile = true;
        $.ajax({
            type: 'GET',
            url: `/messages/fetch`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                $.fn.data.messages.cache.people_list = result;
                people_list();
            },
            error: function(xhr, textStatus, errorThrown) {
                /* do something */
            },
        });

        console.log('hello222');

        if (this.id) {
            $.fn.socket.emit('join-room', this.id);
            $.fn.data.messages.room_id = id;
            $.fn.hide_nav_in_mobile = true;
        } else {
            $.fn.hide_nav_in_mobile = false;
        }

        $('#app').on('submit.message-submit-form', '#message-submit-form', (e) => {
            e.preventDefault();
            if (!$("#message-input").val() || !data.room_id) return false;
            $.fn.socket.emit('send-message', ({ id: data.room_id, _message: $("#message-input").val(), _id: Math.random().toString(36).substring(2, 15) }));
            $("#message-input").val('');
        });

        $.fn.socket.on('receive-messages', ({ user, messages, id }) => {
            if ($.fn.data.messages.room_id == id) {
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
            if ($.data.messages.room_id == id) {
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
                <div class="people"></div>
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