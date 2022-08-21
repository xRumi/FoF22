let socket_connected = true,
    on_socket_connect = {},
    on_socket_disconnect = {},
    on_socket_reconnect = {},
    nanobar = new Nanobar(),
    socket = io.connect().on('connect', () => {
        for (let key in on_socket_connect)
            if (on_socket_connect.hasOwnProperty(key) && on_socket_connect[key]) on_socket_connect[key]();
        if (!socket_connected) {
            socket_connected = true;
            $('.top-status').text('Connected')
                .css('background-color', 'green').show();
            setTimeout(() => $('.top-status').hide(), 2000);
            for (let key in on_socket_reconnect)
                if (on_socket_reconnect.hasOwnProperty(key) && on_socket_reconnect[key]) on_socket_reconnect[key]();
        }
    }).on('disconnect', () => {
        for (let key in on_socket_disconnect)
            if (on_socket_disconnect.hasOwnProperty(key)) on_socket_disconnect[key]();
        socket_connected = false;
        $('.top-status').text(`Disonnected${!navigator.onLine ? `, No internet` : ''}`)
            .css('background-color', 'red').show();
    });

const body = $('body');
const client = {
    messages: {
        room_id: null,
        npr: false,
        room_name: null,
        should_mute_video: true,
        should_mute_audio: false
    },
    id: body.data('id'),
    username: body.data('username'),
    name: body.data('name'),
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
let today = new Date();

let months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

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
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

const _alert = new Alert();

socket.on('unread', unread => {
    Object.keys(unread).forEach(key => {
        $(`#nav__link__${key} .nav__alart`).text(unread[key].count || '');
        if (key == 'messages') {
            if (unread[key].unread) unread[key].unread.forEach(m => $(`._people[data-id=${m}]`).addClass('_people-unread'));
            if (unread[key].read) unread[key].read.forEach(m => $(`._people[data-id=${m}]`).removeClass('_people-unread'));
            if (unread[key].npr && !client.messages.npr) client.messages.npr;
        } else if (key == 'notifications') {
            if (unread[key].unread) unread[key].unread.forEach(unread_info => _alert.render({
                head: unread_info.header,
                content: unread_info.title,
                click_to_close: true,
                delay: 5000
            }));
            if (unread[key].read) unread[key].read.forEach(x => $(`.notifications-item.nic-unread[data-id="${x}"]`).removeClass('nic-unread'));
        }
    });
});

$('.model-view').on('click', e => {
    let close_class = ['model-view', 'model-actions', 'model-content'];
    for (let i = 0; i < close_class.length; i++) {
        if (e.target.classList.contains(close_class[i])) {
            history.back();
            break;
        }
    }
});

function shuffle_array(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

$(window).on('click', e => {
    let target = $(e.target);
    if (client.messages.room_id &&
        !target.hasClass('messages-options') &&
        !target.parent().hasClass('messages-options') &&
        !target.parent().parent().hasClass('messages-options') &&
        !target.hasClass('bx-dots-vertical')
    ) $('.messages-options').hide();
});
