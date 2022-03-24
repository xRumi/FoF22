import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Profile");
        navbar('#nav__link__profile', true);
    }

    async render() {
        return `this is profile page`;
    }
}
