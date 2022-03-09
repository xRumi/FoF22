import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Home");
        const nh = $('#nav__link__home');
        if (!nh.hasClass('nav__active')) {
            $('.nav__active').removeClass('nav__active');
            nh.addClass('nav__active');
        }
    }

    async getHtml() {
        return `this is home page`;
    }
}
