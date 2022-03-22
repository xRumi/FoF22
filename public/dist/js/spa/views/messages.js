import Constructor from "./constructor.js";

var _people_list = [];

const people_list = () => {
    if (_people_list.length && Array.isArray(people_list)) $('.people').html(_people_list.map(x => {
        return `
            <div class="_people" onclick="$.fn.join_room('${x.id}');">
                <div class="_people-img">
                    <img src="${x.image}">
                </div>
                <div class="_people-content">
                    <span class="_people-time">1 day</span>
                    <span class="_people-name">${x.name}</span>
                    <p>${x.last_message}</p>
                </div>
            </div>
        `
    }).join(''));
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle("Messages");
        $.fn.nav('#nav__link__messages', true);
        $.ajax({
            type: 'GET',
            url: `/messages/fetch`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                _people_list = result;
                people_list();
            },
            error: function(xhr, textStatus, errorThrown) {
                /* do something */
            },
        });
    }

    async getHtml() {
        people_list();
        return `
            <div class="chat">
                <div class="people">
                    <div class="people-search"></div>
                    <div class="people-list"></div>
                </div>
                <div class="messages"></div>
            </div>
        `;
    }
}