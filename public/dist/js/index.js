var current_page, current_user, route_histroy = [], retry_function;
var socket = io(), chat_page, chat_id, chat_form;

function init (route_str, username, args) {
    current_user = username;
    router(route_str, args);
}

function pre_render (url, title, nav = false) {
    history.pushState({}, title, url);
    if (nav && !$(`._${current_page}`).hasClass('nav__active')) {
        $(".nav__active").removeClass('nav__active');
        $(`._${current_page}`).addClass('nav__active');
    }
    $('.loader__center').fadeIn(100);
    document.title = title;
}

function after_render (title, loader = true) {
    $('.nav').css('transform', 'unset');
    $('.cover').fadeOut();
    if (loader) $('.loader__center').fadeOut(100);
    document.title = title;
}

const routes = {
    home: {
        name: 'home',
        cache: null,
        render: () => {
            pre_render('/', 'home', true);
            ajax('home', '/fetch', true).then(x => {
                if (current_page == 'home') {
                    if (x.xhr.status == 200) {
                        after_render('home');
                        $('.main').html(x.data);
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
            pre_render('/profile', 'profile', true);
            ajax('profile', '/profile/fetch', true).then(x => {
                if (current_page == 'profile') {
                    if (x.xhr.status == 200) {
                        after_render('profile');
                        $('.main').html(x.data);
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
            pre_render('/messages', 'messages', true);
            ajax('messages', '/messages/fetch', true).then(x => {
                if (current_page == 'messages') {
                    if (x.xhr.status == 200) {
                        after_render('messages');
                        let html = [];
                        x.data.forEach(y => {
                            html.push(`<div class="msgs__item" onclick="router('messages.private', { room_id: '${y.id}', name: '${y.name}'})">
                                <div class="msgs__image">
                                    <img src="${y.image}">
                                </div>
                                <div class="msgs__title">
                                    <h4>${y.name.includes('.') ? y.name.split('.')[0] === current_user ? y.name.split('.')[1] : y.name.split('.')[0] : y.name}</h4>
                                    <p>${y.last_message}</p>
                                </div>
                            </div>`);
                        });
                        $('.main').html(html.join(''));
                    }
                }
            }).catch(() => {
            
            });
        },
        private: {
            name: 'private',
            render: (args) => {
                $('.nav').css('transform', 'unset');
                pre_render(`/messages/private/${args.room_id}`, 'messages', true);
                $('.main').html(`<div class="msg__main ${args.room_id}">
                    <div class="msg__head">
                        <div class="msg__head__opt">
                            <i class="bx bx-dots-vertical"></i>
                        </div>
                        <div class="msg__head__txt">
                            <h4>${args.name}</h4><span>●</span><p>online</p>
                        </div>
                    </div>
                </div>`);
                $('.loader__center').fadeIn(100);
                socket.emit('join_room', args.room_id);
                after_render(args.name, false);
            }
        }
    },
    search: {
        name: 'search',
        cache: null,
        render: () => {
            pre_render('/search', 'search', true);
            ajax('search', '/search/fetch', true).then(x => {
                if (current_page == 'search') {
                    if (x.xhr.status == 200) {
                        after_render('search');
                        $('.main').html(x.data);
                    }
                }
            }).catch(() => {
            
            });
        }
    },
    settings: {
        name: 'settings',
        cache: null,
        render: () => {
            pre_render('/settings', 'settings', true);
            ajax('settings', '/settings/fetch', true).then(x => {
                if (current_page == 'settings') {
                    if (x.xhr.status == 200) {
                        after_render('settings');
                        $('.main').html(x.data);
                    }
                }
            }).catch(() => {
            
            });
        }
    }
}

function ajax (page, url, retry = false, type = 'GET') {
    return new Promise((resolve, reject) => {
        let ajax_ = () => {
            $.ajax({
                type,
                url,
                timeout: 30000,
                success: function (data, textStatus, xhr) {
                    resolve({ data, textStatus, xhr });
                },
                error: function (xhr, textStatus, errorThrown) {
                    if (xhr.status == 403) {
                        window.location.replace(`/login?ref=${page}`);
                        reject({ });
                    } else {
                        if (retry && current_page == page) {
                            retry_function = setTimeout(function() {
                                if (current_page == page) ajax_();
                            }, 5000);
                        } else reject({ });
                    }
                }
            });
        }
        ajax_();
    });
}

function router (route_str, args) {
    const route = route_str.split('.').reduce((v, k) => (v || {})[k], routes);
    if (route) {
        if (route_histroy[route_histroy.length - 1] !== route_str) route_histroy.push(route_str);
        current_page = route.name;
        route.render(args);
    }
}