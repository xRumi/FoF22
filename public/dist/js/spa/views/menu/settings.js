import Constructor from "../constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Settings");
        $.fn.nav__back(true, '/spa/menu');
    }

    async getHtml() {
        $.fn.nav__back(true, '/spa/menu');
        return `
            <div>
                <div class="card">
                    <div class="card-header">Personal Settings</div>
                    <div class="card-body no-padding">
                        <div class="list-group list-group-flush">
                            <a href="#" class="list-group-item list-group-item-action"><i class="bx bx-info-circle menu__icon"></i> Account</a>
                            <a href="#" class="list-group-item list-group-item-action"><i class="bx bx-cog menu__icon"></i> Change Password</a>
                            <a href="#" class="list-group-item list-group-item-action"><i class="bx bx-log-out menu__icon"></i> Delete</a>
                        </div>
                    <div>
                </div>
            </div>
        `;
    }
}
