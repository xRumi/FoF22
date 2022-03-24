import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Menu");
        navbar('#nav__link__menu', true);
    }
    async render() {
        return `
            <div>
                <div class="card">
                    <div class="card-header">Helps & Settings</div>
                    <div class="card-body no-padding">
                        <div class="list-group list-group-flush">
                            <a href="#" class="list-group-item list-group-item-action"><i class="bx bx-info-circle menu__icon"></i> Help</a>
                            <a href="/spa/menu/settings" class="list-group-item list-group-item-action" data-link><i class="bx bx-cog menu__icon"></i> Settings</a>
                            <a href="/logout" class="list-group-item list-group-item-action"><i class="bx bx-log-out menu__icon"></i> Log Out</a>
                        </div>
                    <div>
                </div>
            </div>
        `;
    }
}
