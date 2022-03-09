import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Messages");
        const nm = $('#nav__link__messages');
        if (!nm.hasClass('nav__active')) {
            $('.nav__active').removeClass('nav__active');
            nm.addClass('nav__active');
        }
    }

    async getHtml() {
        return `this is messages page`;
    }
}
