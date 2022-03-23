import Constructor from "./constructor.js";

var _people_list = [];

const people_list = () => {
    if (_people_list.length && Array.isArray(_people_list)) $('.people-list').html(_people_list.map(x => {
        return `
            <div class="_people" onclick="fetch_messages('${x.id}');">
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
                <div class="messages">
                    <div class="messages-header">
                        <span class="messages-header-back">
                            <i class='bx bx-chevron-left'></i>
                        </span>
                    </div>
                    <div class="messages-list"></div>
                    <div class="messages-bottom">
                        <div class="messages-input">
                            <form id="message-submit-form">
                                <input type="text" name="message-input" id="message-input">
                                <button type="submit" class="message-submit">Send</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
