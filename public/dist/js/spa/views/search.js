import Constructor from "./constructor.js";

var acrip = false;
let debounce;

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Search");
        navbar('#nav__link__search', true);
    }

    async render() {
        return `
            <div class="search">
                <div class="search-input">
                    <input type="text" placeholder="Type to search.." spellcheck="false">
                    <div class="autocom-box"></div>
                    <div class="search-icon"><i class="bx bx-search"></i></div>
                </div>
            </div>
        `;
    }

    async after_render() {
        const search_input = document.querySelector(".search-input"),
            search_input_box = search_input.querySelector("input"),
            autocom_box = search_input.querySelector(".autocom-box"),
            icon = search_input.querySelector(".search-icon");
        search_input_box.onkeyup = (e)=> {
            if (e.code == 37 || e.code == 38 || e.code == 39 || e.code == 40 || e.code == 13) return;
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                let text = e.target.value;
                if (text) {
                    icon.onclick = ()=>{
                        console.log(`search for ${text}`);
                    }
                    socket.emit('autocomplete', text, (result) => {
                        let names = result.names ? result.names.map(x => x = `<a href="/spa/profile/${x.id == client.id ? 'me' : x.id}" data-link><li><div><img src="/dist/img/users/${x.id}/profile.png"></div><p>${x.name}</p></li></a>`) : false;
                        if (names) {
                            $('.search-input').addClass("active-search");
                            $('.search-input .autocom-box').html(names);
                        } else {
                            $('.search-input').removeClass("active-search");
                            $('.search-input .autocom-box').html('');
                        }
                    });
                } else $('.search-input').removeClass("active-search");
            }, 500);
        }
    }
}