import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Search");
        const ns = $('#nav__link__search');
        if (!ns.hasClass('nav__active')) {
            $('.nav__active').removeClass('nav__active');
            ns.addClass('nav__active');
        }
    }

    async getHtml() {
        return `thia is search page`;
    }
}
