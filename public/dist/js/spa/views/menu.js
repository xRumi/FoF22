import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Menu");
        navbar('#nav__link__menu', true);
    }
    async render() {
        return `
            <div class="menu">
                <div class="menu-user">
                    <div class="menu-user-top">
                        <div class="menu-user-img">
                            <img src="/dist/img/users/${client.id}/profile.png">
                        </div>
                        <div class="menu-user-content">
                            <div>${client.name}</div>
                            <span>@${client.username}</span>
                        </div>
                    </div>
                    <div class="menu-user-actions">
                        hello
                    </div>
                </div>
            </div>
        `;
    }
}
