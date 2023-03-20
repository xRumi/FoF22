import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Menu");
        navbar('#nav__link__menu', true);
    }
    async render() {
        return `
            <div class="menu">
                <div class="menu-user">
                    <div class="menu-header">Account Settings</div>
                    <a class="menu-item"><i class='bx bx-edit-alt'></i><span>Manage Personal Informations</span></a>
                    <a class="menu-item"><i class='bx bx-envelope'></i><span>Change Email Address</span></a>
                    <a href="/spa/menu/account/change-password" class="menu-item" data-link><i class='bx bx-lock'></i><span>Change Password</span></a>
                    <a class="menu-item" style="color: orangered;"><i class='bx bxs-radiation'></i><span>Danger Zone</span></a>
                </div>
                <div class="menu-support">
                    <div class="menu-header">Help & Support</div>
                    <a class="menu-item"><i class='bx bx-question-mark'></i><span>Frequently Asked Question</span></a>
                    <a class="menu-item"><i class='bx bx-support'></i><span>Live Chat Support</span></a>
                </div>
                <div class="menu-account">
                    <div class="menu-header">Account</div>
                    <a href="/logout" class="menu-item"><i class='bx bx-log-out'></i><span>Logout</span></a>
                </div>
            </div>
        `;
    }
}
