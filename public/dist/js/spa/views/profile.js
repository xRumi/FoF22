import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Profile");
        $.fn.nav('#nav__link__profile', true);
    }

    async getHtml() {
        return `this is profile page`;
    }
}
