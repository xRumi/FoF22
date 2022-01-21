var socket = io(), chat_page, chat_id, chat_form;

function join_room (room_id, name) {
    $('.header').fadeOut();
    $('.main').html(`<div class="msg__main ${room_id}">
        <div class="msg__head">
            <div class="msg__head__back">
                <i class="bx bx-arrow-back"></i>
            </div>
            <div class="msg__head__opt">
                <i class="bx bx-dots-vertical"></i>
            </div>
            <div class="msg__head__txt">
                <p>${name}</p><span>●</span>
            </div>
        </div>
    </div>`);
    $('.loader__center').fadeIn(100);
    window.history.pushState({}, '', `/messages/${room_id}`);
    document.title = name;
    socket.emit('join_room', room_id);
}

socket.on('redirect', url => {
    window.location.replace(url);
});

socket.on('messages', ({ messages, room_id, title }) => {
    if (current_page == 'messages') {
        $('.msgs__head__txt').text(title);
        $('.loader__center').fadeOut(100);
        chat_id = room_id;
        let html = ['<div class="chat__msgs">'];
        messages.forEach(x => {
	        html.push(`<div class="chat__wrapper">
	            <div class="chat__container ${current_user == x.user ? 'chat__own' : 'chat__other'}">
	                ${current_user !== x.user ? `<img class="chat__icon" src="/dist/img/profile/${x.user}.png">` : ``}
	                <div class="${current_user == x.user ? 'chat__own__bubble chat__own' : 'chat__other__bubble chat__other'}">
	                    ${x.message}
	                </div>
	            </div><span class="${current_user == x.user ? 'chat__own' : 'chat__other'}">18:00</span>
	        </div>`);
        });
        html.push(`</div>
            <div class="chat__input">
                <form class="chat__form">
                    <input type="text" id="chat__input" placeholder="enter your message">
                </form>
            </div>`);
        $(`.${room_id}`).append(html.join(''));
        chat_form = $('.chat__form').submit(function(e) {
            e.preventDefault();
            let message = $('#chat__input').val();
            $('#chat__input').val('');
            if (message) socket.emit('send_message', ({ room_id: chat_id, message }));
        });
    }
});

socket.on('message', x => {
    $('.chat__msgs').append(`<div class="chat__wrapper">
        <div class="chat__container ${current_user == x.user ? 'chat__own' : 'chat__other'}">
            ${current_user !== x.user ? `<img class="chat__icon" src="/dist/img/profile/${x.user}.png">` : ``}
            <div class="${current_user == x.user ? 'chat__own__bubble chat__own' : 'chat__other__bubble chat__other'}">
                ${x.message}
            </div>
        </div><span class="${current_user == x.user ? 'chat__own' : 'chat__other'}">18:00</span>
    </div>`);
});

