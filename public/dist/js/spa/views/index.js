import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Home");
        navbar('#nav__link__home', true);
    }

    async render() {
        return `this is home page`;
    }
}
