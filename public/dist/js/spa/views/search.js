import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.set_title("Search");
    }

    async before_render() {}

    async render() {
        return `this is search page`;
    }

    async after_render() {}
}
