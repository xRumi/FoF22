import Constructor from "../constructor.js";
import Messages from "./messages.js";

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

        if (this.id) {
            $.fn.socket.emit('join-room', this.id);
            $.fn.data.messages.room_id = id;
            $.fn.hide_nav_in_mobile = true;
        } else {
            $.fn.hide_nav_in_mobile = false;
        }

        if (!$.fn.socket.hasListeners('receive-messages')) $.fn.socket.on('receive-messages', ({ user, messages, id }) => {
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
    
        if (!!$.fn.socket.hasListeners('receive-message')) $.fn.socket.on('receive-message', ({ user, id, chat, _id }) => {
            if ($.fn.data.messages.room_id == id) {
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

        $('#app').on('submit.message-submit-form', '#message-submit-form', (e) => {
            e.preventDefault();
            if (!$("#message-input").val() || !data.room_id) return false;
            $.fn.socket.emit('send-message', ({ id: data.room_id, _message: $("#message-input").val(), _id: Math.random().toString(36).substring(2, 15) }));
            $("#message-input").val('');
        });
    }

    async getHtml() {
        return Messages.getHtml();
    }
}