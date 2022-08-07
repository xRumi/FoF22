import Constructor from "../constructor.js";

let _ajax0 = false,
    old_room_list = [];

const room_list = (new_room_list) => {
    if (new_room_list && JSON.stringify(new_room_list) == JSON.stringify(old_room_list)) return false;
    if (new_room_list) old_room_list = new_room_list;
    if (old_room_list && old_room_list.length && Array.isArray(old_room_list))
        $('#game-room-list-join').html(old_room_list.map(x => {
        return $(`
            <a href="/spa/game-room/${x.id}" class="game-room-item" data-room-id="${x.id}" data-link>
                <div class="game-room-item-name">${x.name}</div>
                <span>${x.player_count}/${x.player_limit}</span>
            </a>
        `);
    }));
}

function fetch_rooms() {
    if (!_ajax0) {
        _ajax0 = true;
        nanobar.go(30);
        $.ajax({
            type: 'GET',
            url: `/game-room/list`,
            timeout: 30000,
            success: function(result, textStatus, xhr) {
                if (!result.length) $('.game-room-list').html(`<div style="color: darkred;">empty</div>`);
                else room_list(result);
                _ajax0 = false;
                nanobar.go(100);
            },
            error: function(xhr, textStatus, errorThrown) {
                /* do something */
                _ajax0 = false;
            },
        });
    }
}

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Game Room Join");
        this.wait_for_socket = true;
        navbar(null, false);
        fetch_rooms();
    }

    async before_render() {}

    async render() {
        return $(`
            <div>
                <div class="header-back">
                    <div class="header-back-icon" onclick="$.fn.go_back('/spa/game-room');">
                        <i class='bx bx-chevron-left'></i>
                    </div>
                    <p class="header-back-text">Game Room Join</p>
                </div>
                <div class="center-content game-room-join">
                    <div class="center-content-item">
                        <form>
                            <input type="text" id="game-room-code-input" minlength="8" maxlength="12" required placeholder="Enter Game Code">
                        </form>
                        <div class="game-rooms">
                            <div class="game-rooms-header">Public Game Rooms</div>
                            <div class="game-room-list" id="game-room-list-join">
                                <svg class="spinner" style="width: 30px; margin-left: 30px; margin-top: 20px;" viewBox="0 0 50 50">
                                    <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                                </svg>
                            </div>
                            <button class="game-rooms-show-more">Show More</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    async after_render() {
        room_list();
        // fetch_rooms();
    }
}
