import Index from "./views/index.js";
import Profile from "./views/profile.js";
import Friends from "./views/friends.js";
import Search from "./views/search.js";
import Notifications from "./views/notifications.js";

// messages
import Messages from "./views/messages.js";

// menu
import Menu from "./views/menu.js";
import Menu_Change_Password from "./views/menu/change-password.js";

const path_to_regex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const get_params = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);
    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};

const navigate_to = url => {
    if (!url) return false;
    history.pushState(null, null, url);
    router();
};

let is_first_time = true;

setTimeout(() => is_first_time = false, 5000);

const routes = [
    { path: "/spa", view: Index },
    { path: "/spa/friends", view: Friends },

    { path: "/spa/messages", view: Messages },
    { path: "/spa/messages/:id", view: Messages },

    { path: "/spa/notifications", view: Notifications },

    { path: "/spa/menu", view: Menu },
    { path: "/spa/menu/account/change-password", view: Menu_Change_Password },

    { path: "/spa/profile", view: Profile },
    { path: "/spa/profile/:id", view: Profile },
    
    { path: "/spa/search", view: Search },
];

let before_new_render, current_need_refresh = () => {
    console.log("empty need refresh");
};


const router = async () => {

    $.fn._go_back = null;

    const potential_matches = routes.map(route => {
        return {
            route,
            result: location.pathname.replace(/\/$/, "").match(path_to_regex(route.path))
        };
    });

    let match = potential_matches.find(potentialMatch => potentialMatch.result !== null);

    if (!match) {
        document.querySelector("#app").innerHTML = `
            <div class="_404">
                <h1>404</h1>
                <h2>Oops! Page Not Be Found</h2>
                <p>Sorry but the page you are looking for does not exist, have been removed. name changed or is temporarily unavailable</p>
                <a href="/spa" data-link>Back to homepage</a>
            </div>`;
        return false;
    }

    if (before_new_render) {
        await before_new_render();
        before_new_render = null;
    }

    const view = new match.route.view(get_params(match));

    if (view.need_refresh) current_need_refresh = view.need_refresh;

    if (view.wait_for_socket) {
        if (is_first_time) {
            if (socket.connected) setTimeout(() => {
                router_show(view);
                $('.top-status').hide();
            }, 500);
            else on_socket_connect.spa_index_0 = () => {
                setTimeout(() => {
                    router_show(view);
                    $('.top-status').hide();
                    on_socket_connect.spa_index_0 = null;
                }, 1000);
            };
            is_first_time = false;
            $('.top-status').text('Waiting for connection')
                .css('background-color', 'darkred').show();
        } else {
            if (socket.connected) router_show(view);
            else {
                on_socket_connect.spa_index_0 = () => {
                    setTimeout(() => {
                        router_show(view);
                        $('.top-status').hide();
                        on_socket_connect.spa_index_0 = null;
                    }, 1000);
                };
                $('.top-status').text('Waiting for connection')
                    .css('background-color', 'darkred').show();
            }
        }
    } else router_show(view);
};

async function router_show(view) {
    if (view.before_render) await view.before_render();
    let html = await view.render();
    $(view.target || "#app").html(html);
    if (view.after_render) await view.after_render();
    if (view.before_new_render) before_new_render = view.before_new_render;
}

window.addEventListener("popstate", (e) => {
    let model_view = $('.model-view');
    if (model_view.is(':visible')) {
        model_view.hide(); e.preventDefault();
        $('.model-view .model-actions a').hide();
    } else if ($.fn._go_back) {
        $.fn._go_back();
        $.fn._go_back = null;
        return true;
    } else router();
});

$('body').on('click', 'a[data-link]', e => {
    e.preventDefault();
    navigate_to($(e.currentTarget).attr('href'));
});

$.fn.navigate_to = navigate_to;
$.fn.routes = routes;
$.fn.router = router;
$.fn.shortcuts = {};

$.fn.go_back = (fallback) => {
    if ($.fn._go_back) {
        $.fn._go_back();
        $.fn._go_back = null;
        return true;
    }
    let prev_page = window.location.href;
    history.back();
    setTimeout(() => { 
        if (window.location.href == prev_page) $.fn.navigate_to(fallback);
    }, 200);
}

$(window).resize(() => {
    if ($.fn.hide_nav_in_mobile && $(window).width() < 801) $('.navbar').hide();
});

$(document).ready(() => router());

jQuery.fn.shake = function(interval,distance,times){
   interval = typeof interval == "undefined" ? 100 : interval;
   distance = typeof distance == "undefined" ? 10 : distance;
   times = typeof times == "undefined" ? 3 : times;
   var jTarget = $(this);
   jTarget.css('position','relative');
   for(var iter=0;iter<(times+1);iter++){
      jTarget.animate({ left: ((iter%2==0 ? distance : distance*-1))}, interval);
   }
   return jTarget.animate({ left: 0},interval);
}

let hidden;
let visibility_change;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibility_change = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibility_change = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibility_change = "webkitvisibilitychange";
}

if (typeof document.addEventListener === "undefined" || hidden === undefined) {
    console.log("Your browser does not support the Page Visibility API, fallback to native api");
    window.onfocus = () => current_need_refresh();
    let temp_timesteps = Date.now();
    setInterval(() => {
        if (Date.now() - temp_timesteps > 4000) current_need_refresh();
        temp_timesteps = Date.now();
    }, 3000);
} else document.addEventListener(visibility_change, () => {
    if (!document[hidden]) current_need_refresh();
}, false);

$.fn.attachment_not_Found = (terget) => {
    $(terget).parent()
    .html(`<div class=\"msg-attachment-not-found\">
        <b>Oops! Attachment Not Be Found</b><br><br>
        Sorry but the attachment you are looking for does not exist, have been removed. id changed or is temporarily unavailable
    </div>`);
}
