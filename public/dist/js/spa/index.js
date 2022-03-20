import Index from "./views/index.js";
import Profile from "./views/profile.js";
import Search from "./views/search.js";

// messages
import Messages from "./views/messages.js";

// menu
import Menu from "./views/menu.js";
import Settings from "./views/menu/settings.js";
import AccountSettings from "./views/menu/settings/account.js";
import ChangePassword from "./views/menu/settings/change-password.js"

const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);

    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        { path: "/spa", view: Index },
        { path: "/spa/profile", view: Profile },
        { path: "/spa/messages", view: Messages },
        { path: "/spa/search", view: Search },

        { path: "/spa/menu", view: Menu },
        { path: "/spa/menu/settings", view: Settings },
        { path: "/spa/menu/settings/account", view: AccountSettings },
        { path: "/spa/menu/settings/change-password", view: ChangePassword }
    ];

    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path))
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

    if (!match) {
        match = {
            route: routes[0],
            result: [location.pathname]
        };
    }
    if ($.fn.cleanup) {
        $.fn.cleanup();
        $.fn.cleanup = null;
    }
    const view = new match.route.view(getParams(match));

    document.querySelector(view.target || "#app").innerHTML = await view.getHtml();
};

window.addEventListener("popstate", router);

const socket = io();
$.fn.socket = socket;

socket.on('redirect', url => window.location.replace(url));
socket.on('debug', text => console.log(text));

$.fn.cache = {};

$('body').on('click', 'a[data-link]', e => {
    e.preventDefault();
    navigateTo($(e.currentTarget).attr('href'));
});

$.fn.nav__back = (show, title, url) => {
    if (title) $('.nav__back a span').text(title);
    if (show) {
        $('#nav').hide();
        $('#nav__back').show();
        $('.nav__back a').attr('href', url);
    } else {
        $('#nav__back').hide();
        $('#nav').show();
    }
}

$.fn.nav = (id, show) => {
    const nl = $(id);
    if (nl && !nl.hasClass('nav__active')) {
        $('.nav__active').removeClass('nav__active');
        nl.addClass('nav__active');
    }
    if (show) $.fn.nav__back(false);
}

$(document).ready(() => router());
