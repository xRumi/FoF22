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
        return `this is menu page`;
    }
}
