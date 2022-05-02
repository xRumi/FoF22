const nanobar = new Nanobar(),
    socket = io();
    
const client = {
    messages: {
        room_id: null,
    },
    id: null,
    username: null,
};

var before_new_render = null;

const navbar = (id, show) => {
    if (id) {
        let nl = $(id);
        if (nl && !nl.hasClass('nav__active')) {
            $('.nav__active').removeClass('nav__active');
            nl.addClass('nav__active');
        }
    }
    if (show) $('.navbar').show();
    else $('.navbar').hide();
}

socket.on('redirect', url => window.location.replace(url));

function init(id, username) {
    client.id = id;
    client.username = username;
}

let n_time = new Date();

const periods = {
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};

setTimeout(() => setInterval(() => {
    if (client.messages.room_id) $('.message .message-time').toArray().forEach(x => {
        let message = x.parentNode.parentNode,
            diff = Date.now() - parseInt(message.dataset.time), time;
        if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
        if (time) x.innerText = time;
    });
}, 60000), (60 - n_time.getSeconds()) * 1000);

socket.on('notification', notification => {
    Object.keys(notification).forEach(key => {
        $(`#nav__link__${key} .nav__alart`).text(notification[key].length || '');
        if (key == 'messages') {
            let unread_messages = notification[key];
            unread_messages.forEach(m => $(`._people[data-id=${m}]`).css('background-color', 'aliceblue'));
        }
    });
});