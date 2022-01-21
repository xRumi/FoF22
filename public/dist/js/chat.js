var socket = io(), chat_page, chat_id, chat_form;

function join_room (room_id) {
    $('.main').html(`<div class="msg__main">
        <div class="msgs__head">
            <div class="msgs__head__back">
                <box-icon name="arrow-back"></box-icon>
            </div>
            <div class="msgs__head__opt">
                <box-icon name="dots-vertical"></box-icon>
            </div>
            <div class="msgs__head__txt">
                <p>loading...</p><span>●</span>
            </div>
        </div>
    </div>`);
    $('.loader__center').fadeIn(100);
    chat_page = true;
    socket.emit('join_room', room_id);
}

socket.on('redirect', url => {
    window.location.replace(url);
});

socket.on('messages', ({ messages, room_id, title }) => {
    if (current_page == 'messages' && chat_page) {
        window.history.pushState({}, '', `/messages/${room_id}`);
        document.title = title;
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
        $('.msg__main').append(html.join(''));
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

