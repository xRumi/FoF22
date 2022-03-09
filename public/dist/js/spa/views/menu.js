import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Menu");
        const nm = $('#nav__link__menu');
        if (!nm.hasClass('nav__active')) {
            $('.nav__active').removeClass('nav__active');
            nm.addClass('nav__active');
        }
    }

    async getHtml() {
        return `
            <div id="menu__app">
                <div class="card">
                    <div class="card-header">Helps & Settings</div>
                    <div class="card-body">
                        <div class="list-group">
                            <a href="#" class="list-group-item list-group-item-action"><i class="bx bx-info-circle menu__icon"></i> Help</a>
                            <a href="#" class="list-group-item list-group-item-action"><i class="bx bx-cog menu__icon"></i> Settings</a>
                            <a href="#" class="list-group-item list-group-item-action"><i class="bx bx-log-out menu__icon"></i> Log Out</a>
                        </div>
                    <div>
                </div>
            </div>
        `;
    }
}
