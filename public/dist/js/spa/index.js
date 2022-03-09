import Index from "./views/index.js";
import Profile from "./views/profile.js";
import Messages from "./views/messages.js";
import Search from "./views/search.js";
import Menu from "./views/menu.js";


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
        { path: "/spa/menu", view: Menu }
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

    const view = new match.route.view(getParams(match));

    document.querySelector("#app").innerHTML = await view.getHtml();
};

window.addEventListener("popstate", router);

$('a[data-link]').click(e => {
    e.preventDefault();
    navigateTo($(e.currentTarget).attr('href'));
});

$(document).ready(() => router());
