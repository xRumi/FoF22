import Constructor from "../constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Settings");
        $.fn.nav__back(true, 'Settings', '/spa/menu');
    }

    async getHtml() {
        return `
            <div>
                <div class="card">
                    <div class="card-header">Personal Settings</div>
                    <div class="card-body no-padding">
                        <div class="list-group list-group-flush">
                            <a href="/spa/menu/settings/account" class="list-group-item list-group-item-action" data-link><i class="bx bx-user menu__icon"></i> Account</a>
                            <a href="/spa/menu/settings/change-password" class="list-group-item list-group-item-action" data-link><i class="bx bx-lock menu__icon"></i> Change Password</a>
                            <a href="#" class="list-group-item list-group-item-action" data-link><i class="bx bx-trash menu__icon"></i> Delete</a>
                        </div>
                    <div>
                </div>
            </div>
        `;
    }
}
