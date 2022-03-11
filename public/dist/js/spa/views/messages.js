import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Messages");
        $.fn.nav('#nav__link__messages', true);
    }

    async getHtml() {
        return `this is messages page`;
    }
}
