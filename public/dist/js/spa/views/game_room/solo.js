import Constructor from "../constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Solo Game");
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
                this is solo page
            </div>
        `);
    }

    async after_render() {
    }
}
