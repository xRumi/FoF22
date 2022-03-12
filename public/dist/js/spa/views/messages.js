import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.id = params.id;
        this.setTitle("Messages");
        $.fn.nav('#nav__link__messages', true);
    }

    async getHtml() {
        return `this is message page`;
    }
}
