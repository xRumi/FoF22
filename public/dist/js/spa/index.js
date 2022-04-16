import Index from "./views/index.js";
import Profile from "./views/profile.js";
import Friends from "./views/friends.js";
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
        { path: "/spa/friends", view: Friends },
        { path: "/spa/messages", view: Messages },
        { path: "/spa/messages/:id", view: Messages },
        { path: "/spa/search", view: Search },
        { path: "/spa/menu", view: Menu },
        { path: "/spa/menu/settings", view: Settings },
        { path: "/spa/menu/settings/account", view: AccountSettings },
        { path: "/spa/menu/settings/change-password", view: ChangePassword },

        { path: "/spa/profile", view: Profile },
        { path: "/spa/profile/:id", view: Profile },

    ];

    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname.replace(/\/$/, "").match(pathToRegex(route.path))
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);

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

    const view = new match.route.view(getParams(match));

    if (view.before_render) await view.before_render();

    document.querySelector(view.target || "#app").innerHTML = await view.render();

    if (view.after_render) await view.after_render();
    if (view.before_new_render) before_new_render = view.before_new_render;
};

window.addEventListener("popstate", router);

$('body').on('click', 'a[data-link]', e => {
    e.preventDefault();
    navigateTo($(e.currentTarget).attr('href'));
});

$.fn.navigateTo = navigateTo;
$.fn.router = router;

$(window).resize(() => {
    if ($.fn.hide_nav_in_mobile && $(window).width() < 801) $('.navbar').hide();
});

$(document).ready(() => router());