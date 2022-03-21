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

$.fn.cache = {};

$('body').on('click', 'a[data-link]', e => {
    e.preventDefault();
    navigateTo($(e.currentTarget).attr('href'));
});

$.fn.nav = (id, show) => {
    if (id) {
        let nl = $(id);
        if (nl && !nl.hasClass('nav__active')) {
            $('.nav__active').removeClass('nav__active');
            nl.addClass('nav__active');
        }
    }
    if (show) $('.navbar').show();
    else if ($(window).width() < 767) $('.navbar').hide();
}

$(window).resize(() => {
    if ($(window).width() > 767 && ($('.navbar').css('display') == 'none')) $('.navbar').show();
});

$(document).ready(() => router());