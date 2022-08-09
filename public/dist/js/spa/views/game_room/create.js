import Constructor from "../constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Game Room Create");
        this.wait_for_socket = true;
        navbar(null, false);
    }

    async before_render() {}

    async render() {
        return $(`
            <div>
                <div class="header-back">
                    <div class="header-back-icon" onclick="$.fn.go_back('/spa/game-room');">
                        <i class='bx bx-chevron-left'></i>
                    </div>
                    <p class="header-back-text">Game Room Create</p>
                </div>
                <div class="center-content game-room-create">
                    <div class="center-content-item">
                        <form>
                            <input type="text" id="game-room-name" minlength="4" maxlength="32" required placeholder="Enter Room Name">
                            <div class="game-room-options">
                                <div>
                                    <input id="game-room-private" type="checkbox">
                                    <label for="game-room-private">Private game</label>
                                </div>
                            </div>
                            <button type="submit">Create</button>
                            <div class="game-room-create-error" style="word-wrap: break-word; display: none; color: red; border: solid 1px lightgrey; margin-top: 80px; padding: 10px;"></div>
                        </form>
                    </div>
                </div>
            </div>
        `).on('submit', '.game-room-create form', e => {
            e.preventDefault();
            $('.game-room-create > form > button')
            .attr('disabled', true)
            .html(`
                <svg class="spinner" style="height: 15px; width: 25px; position: relative; margin-top: 3px;" viewBox="0 0 50 50">
                    <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                </svg>
            `);
            const room_name = $('#game-room-name').val();
            socket.emit('game-room-create', room_name, {}, (response) => {
                if (response.error) {
                    $('.game-room-create-error').html(response.error).show();
                    $('.game-room-create > form > button')
                        .attr('disabled', false).text('Create');
                } else $.fn.navigate_to(`/spa/game-room/${response.id}`);
            });
        });
    }

    async after_render() {
    }
}
