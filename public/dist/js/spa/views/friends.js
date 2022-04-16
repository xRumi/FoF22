import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Friends");
        navbar('#nav__link__friends', true);
    }

    async render() {
        return `this is friends page`;
    }
}
