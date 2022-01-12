var current_page, current_user, route_histroy = [], retry_function;

// init function
function init (route_str, username) {
    current_user = username;
    router(route_str);
    console.log('init function');
}

function pre_render_main (url, title) {
    history.pushState({}, title, url);
    $('.loader__home').fadeIn();
    document.title = title;
    console.log('pre render main')
}

const routes = {
    home: {
        name: 'home',
        cache: null,
        render: () => {
            console.log('rendering home page');
            ajax('home', '/fetch').then((data, textStatus, xhr) => {
                console.log(current_page);
                if (current_page == 'home') {
                    console.log('rendering home page');
                    if (xhr.status == 200) {
                        console.log(data)
                        $('.main').html(data);
                    }
                }
            }).catch(() => {
                
            });
        }
    },
    profile: {
        name: 'profile',
        cache: null,
        render: () => {
            ajax('profile', '/profile/fetch').then((data, textStatus, xhr) => {
                if (current_page == 'profile') {
                    if (xhr.status == 200) {
                        $('.main').html(data);
                    }
                }
            }).catch(() => {
            
            });
        }
    },
    messages: {
        name: 'messages',
        cache: null,
        render: () => {
            ajax('messages', '/messages/fetch').then((data, textStatus, xhr) => {
                if (current_page == 'messages') {
                    if (xhr.status == 200) {
                        $('.main').html(data);
                    }
                }
            }).catch(() => {
            
            });
        }
    },
    search: {
        name: 'search',
        cache: null,
        render: () => {
            ajax('search', '/search/fetch').then((data, textStatus, xhr) => {
                if (current_page == 'search') {
                    if (xhr.status == 200) {
                        $('.main').html(data);
                    }
                }
            }).catch(() => {
            
            });
        }
    },
    menu: {
        name: 'menu',
        cache: null,
        render: () => {
            ajax('menu', '/menu/fetch').then((data, textStatus, xhr) => {
                if (current_page == 'menu') {
                    if (xhr.status == 200) {
                        $('.main').html(data);
                    }
                }
            }).catch(() => {
            
            });
        }
    }
}

function ajax (page, url, retry = false, type = 'GET') {
    console.log('sending ajax request')
    return new Promise((resolve, reject) => {
        let ajax_ =$.ajax({
            type,
            url,
            timeout: 30000,
            success: function (data, textStatus, xhr) {
                console.log('request success')
                resolve(data, textStatus, xhr);
            },
            error: function (xhr, textStatus, errorThrown) {
                if (xhr.status == 403) {
                    window.location.replace(`/login?ref=${page}`);
                    reject();
                } else {
                    if (retry && current_page == page) {
                        retry_function = setTimeout(function() {
                            if (current_page == page) ajax_();
                        }, 5000);
                    } else reject(xhr, textStatus, errorThrown);
                }
            }
        })
    });
}

function router (route_str) {
    const route = route_str.split('.').reduce((v, k) => (v || {})[k], routes);
    console.log(route_str)
    console.log(route);
    if (route) {
        if (route_histroy[route_histroy.length - 1] !== route.name) route_histroy.push(route.name);
        current_page = route.name;
        route.render();
    }
}

/*
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
var current_page, previous_page, retry_function, chat__id, current_user, chat__form;

var socket = io();

socket.on('redirect', url => {
    window.location.replace(url);
});

function go_back() {
    if (previous_page) {
        load_page(previous_page == 'home' ? null : previous_page);
    }
}

function join_room (room_id) {
    $('.main').html(`<div class="message__main"></div>`);
    $('.loader__home').fadeIn(100);
    socket.emit('join_room', room_id);
}

socket.on('messages', ({ messages, room_id }) => {
    if (current_page == 'messages') {
        window.history.pushState('messages', '', '/messages');
        $('.loader__home').fadeOut(100);
        hide_nav(true);
        $('.nav__title').html('<i class="bx bx-arrow-back nav__back" onclick="go_back()"></i>');
        chat__id = room_id;
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
        $('.message__main').html(html.join(''));
        chat__form = $('.chat__form').submit(function(e) {
            e.preventDefault();
            let message = $('#chat__input').val();
            $('#chat__input').val('');
            if (message) socket.emit('send_message', ({ room_id: chat__id, message }));
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

function init(page, username) {
    current_page = page; current_user = username;
    if (current_page == 'home') load_page(null, true);
    else load_page(current_page, true);
}

function load_page(page, init) {
    $('.nav__title').html('<span onclick="hide_nav()">F<sub>o</sub>F<sub>22</sub></span>');
    current_page = page ? page : 'home';
    if (!init) $('.main').html('');
    $('.loader__home').fadeIn();
    document.title = 'loading ...' ;
    window.history.pushState({ current_page }, '', page ? `/${page}` : '/');
    $(".active-link").removeClass('active-link');
    $(`.${page ? page : 'home'}`).addClass('active-link');
    $.ajax({
        type: 'GET',
        url: `/${page ? `${page}/` : ''}fetch`,
        timeout: 30000,
        success: function(result, textStatus, xhr) {
            if (init) $('.cover').fadeOut(100);
            $('.nav__menu').css('transform', 'unset');
            previous_page = current_page; clearTimeout(retry_function);
            if (current_page == (page ? page : 'home')) {
                if (!$(`.${current_page}`).hasClass('active-link')) {
                    $(".active-link").removeClass('active-link');
                    $(`.${current_page}`).addClass('active-link');
                }
                $('.loader__home').fadeOut(100);
                document.title = current_page;
                if (xhr.status == 200) format(current_page, result);
                else window.location.reload();
            }
        },
        error: function(xhr, textStatus, errorThrown) {
            if (xhr.status == 403) window.location.replace(`/login?ref=${current_page == 'home' ? '' : current_page}`);
            else {
                retry_function = setTimeout(function() {
                    if (current_page == (page ? page : 'home')) load_page(page);
                }, 5000);
            }
        },
        fail: function(xhr, textStatus, errorThrown) {
            console.log('nope 2');
        }
    });
}

function format(type, data) {
    let html = [];
    if (type == 'messages') {
        data.forEach(x => {
            html.push(`<div class="messages__item" onclick="join_room('${x.id}')">
                <div class="messages__image">
                    <img src="${x.image}">
                </div>
                <div class="messages__title">
                    <h4>${x.name.includes('.') ? x.name.split('.')[0] === current_user ? x.name.split('.')[1] : x.name.split('.')[0] : x.name}</h4>
                    <p>${x.last_message}</p>
                </div>
            </div>`)
        });
        $('.main').html(html.join(''));
    } else $('.main').html(data);
}

window.onpopstate = function (event) {
    //if (event.state.current_page) load_page(event.state.current_page == 'home' ? null : event.state.current_page);
}

function url_handler() {
    
}
*/