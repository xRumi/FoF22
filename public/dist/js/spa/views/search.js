import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Search");
        navbar('#nav__link__search', true);
    }

    async render() {
        return `this is search page`;
    }
}
