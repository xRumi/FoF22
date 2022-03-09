import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Profile");
        const np = $('#nav__link__profile');
        if (!np.hasClass('nav__active')) {
            $('.nav__active').removeClass('nav__active');
            np.addClass('nav__active');
        }
    }

    async getHtml() {
        return `this is profile page`;
    }
}
