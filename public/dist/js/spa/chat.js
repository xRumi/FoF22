const socket = io();
$.fn.socket = socket;

var room_id;

const fetch_messages = (id) => {
    room_id = id;
    socket.emit('join-room', id);
}

socket.on('receive-messages', ({ user, messages, id }) => {
    if (room_id == id) {
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
    if (room_id == id) {
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
    socket.emit('send-message', ({ id: data.room_id, _message: $("#message-input").val(), _id: Math.random().toString(36).substring(2, 15) }));
    $("#message-input").val('');
});
