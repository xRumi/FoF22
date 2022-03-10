import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Home");
        $.fn.nav('#nav__link__home', true);
    }

    async getHtml() {
        return `this is home page`;
    }
}
