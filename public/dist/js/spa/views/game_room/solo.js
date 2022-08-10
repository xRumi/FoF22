import Constructor from "../constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Solo Game");
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
                    <p class="header-back-text">Play Game Solo</p>
                </div>
                <div class="game-list">
                    <div class="game-item">
                        <img src="/dist/img/games/tictactoe/icon.png">
                        <h3>Tic Tac Toe</h3>
                        <p>Play tic tac toe with a robot</p>
                        <a href="/spa/game-room/solo/tictactoe" data-link>Play</a>
                    </div>
                <div>
            </div>
        `);
    }

    async after_render() {
    }
}
