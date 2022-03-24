import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Home");
        navbar('#nav__link__home', true);
    }

    async render() {
        return `this is home page`;
    }
}
