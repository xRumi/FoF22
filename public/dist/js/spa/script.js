const nanobar = new Nanobar(),
    socket = io();

const body = $('body');
    
const client = {
    messages: {
        room_id: null,
    },
    id: body.data('id'),
    username: body.data('username'),
    name: body.data('name')
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

function init(id, username, name) {
    client.id = id;
    client.username = username;
    client.name = name;
}

let n_time = new Date();

const periods = {
    year: 12 * 30 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ttr = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

setTimeout(() => setInterval(() => {
    if (client.messages.room_id) $('.messages-list .message .message-time').toArray().forEach(x => {
        let message = x.parentNode.parentNode,
            diff = Date.now() - parseInt(message.dataset.time), time;
        if (diff < 2 * 60 * 60 * 1000) time = Math.floor(diff / periods.hour) ? Math.floor(diff / periods.hour) + "h ago" : Math.floor(diff / periods.minute) ? Math.floor(diff / periods.minute) + "m ago" : Math.floor(diff / periods.second) ? Math.floor(diff / periods.second) + "s ago" : 'just now';
        if (time) x.innerText = time;
    });
}, 60000), (60 - n_time.getSeconds()) * 1000);

const alert = new Alert();

socket.on('unread', unread => {
    Object.keys(unread).forEach(key => {
        $(`#nav__link__${key} .nav__alart`).text(unread[key].count || '');
        if (key == 'messages') {
            if (unread[key].unread) unread[key].unread.forEach(m => $(`._people[data-id=${m}]`).addClass('_people-unread'));
            if (unread[key].read) unread[key].read.forEach(m => $(`._people[data-id=${m}]`).removeClass('_people-unread'));
        } else if (key == 'notifications') {
            let unreads = unread[key].unread;
            unreads.forEach(unread_info => alert.render({
                head: unread_info.header,
                content: unread_info.title,
                click_to_close: true,
                delay: 5000
            }));
        }
    });
});

socket.on('messages-typing-response', ({ room_id, typing }) => {
    if (room_id == client.messages.room_id) {
        if (typing.length) $('.messages-typing').show().find('.message-content p').html(typing.map(x => `<b>${x}</b>`).join(', ') + ' is typing..');
        else $('.messages-typing').hide().find('.message-content p').html('');
    }
});
