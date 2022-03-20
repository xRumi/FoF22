import Constructor from "./constructor.js";

var data = {};

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle("Messages");
        $.fn.nav('#nav__link__messages', true);
        $.fn.cleanup = () => {
            $('#app').off('submit.send_message');
        }
        $.fn.messages = () => {
            let data = $.fn.cache?.messages;
            if (data?.length) $('.chat .people').html(data.map(x => {
                return `
                    <div class="people_list" onclick="$.fn.join_room('${x.id}');">
                        <div class="people_pic"><img src="${x.image}"></div>
                        <div class="people_info">
                            <div class="name_section">
                                <div class="name">${x.name}</div>
                            </div>
                            <div class="last_msg_section">
                            <div class="last_msg">${x.last_message}</div>
                        </div>
                        </div>
                        
                    </div>
                `
            }).join(''));
        }
        $.ajax({
            type: 'GET',
            url: `/messages/fetch`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                $.fn.cache.messages = result;
                $.fn.messages();
            },
            error: function(xhr, textStatus, errorThrown) {
                /* do something */
            },
        });
        $.fn.join_room = (id) => {
            $.fn.socket.emit('join-room', id);
            data.room_id = id;
        }
        $.fn.socket.on('receive-messages', ({ user, messages, id }) => {
            if (data.room_id == id) {
                $('.message .chat_section').html(messages.map(x => {
                    return `
                        <div class="chat_list ${user == x.user ? 'me' : 'opposite'}">
                            <div class="chat_people_section"><img src="/dist/img/profile/${x.user}.png"></div>
                            <div class="chat_msg_section">
                                <div class="chat_name_time">
                                    <div class="chat_name">${x.user}</div>
                                </div>
                                <div class="chat_message">${x.message}</div>
                            </div>
                        </div>
                    `
                }));
            }
        });
        $.fn.socket.on('receive-message', ({ id, chat, _id }) => {
            if (data.room_id == id) {
                $('.message .chat_section').append(`
                    <div class="chat_list ${user == chat.user ? 'me' : 'opposite'}">
                        <div class="chat_people_section"><img src="/dist/img/profile/${chat.user}.png"></div>
                        <div class="chat_msg_section">
                            <div class="chat_name_time">
                                <div class="chat_name">${chat.user}</div>
                            </div>
                            <div class="chat_message">${chat.message}</div>
                        </div>
                    </div>
                `);
            }
        });
        $('#app').on('submit.send_message', '#send_message', (e) => {
            e.preventDefault();
            if (!$("#text_input").val() || !data.room_id) return false;
            $.fn.socket.emit('send-message', ({ id: data.room_id, _message: $("#text_input").val(), _id: Math.random().toString(36).substring(2, 15) }));
            $("#text_input").val('');
        });
    }

    async getHtml() {
        $.fn.messages();
        let html = `
            <div class="chat">
                <div class="people"></div>
                <div class="message">
                    <div class="top_bar">
                        <div class="back">
                            <img src="/dist/img/icon/back.png">
                        </div>
                        <div class="profile_container">
                            <div class="call">
                                <img src="/dist/img/icon/video-call.png" class="video-call">
                            </div>
                            <div class="top_profile">
                                <img src="/dist/img/icon/Charmander.jpg">
                            </div>
                        </div>
                    </div>
                    <div class="chat_section"></div>
                    <div class="input_section" id="input_section">
                        <img src="/dist/img/icon/picture3.png">
                        <img src="/dist/img/icon/add-button.png">
                        <img src="/dist/img/icon/attachment.png">
                        <img src="/dist/img/icon/right_arrow.png" id="right_arrow">
                        <form id="send_message">
                            <input id="text_input" onclick="inputStyle()" onblur="inputStyle2()" type="text" placeholder="Type here...">
                        </form>
                        <img src="/dist/img/icon/send-message.png">
                        <img src="/dist/img/icon/thumb-up.png" class="feather-thumbs-up">
                    </div>
                </div>
            </div>`;
        return html;
    }
}
