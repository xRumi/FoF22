import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Search");
        $.fn.nav('#nav__link__search', true);
    }

    async getHtml() {
        return `this is search page`;
    }
}
