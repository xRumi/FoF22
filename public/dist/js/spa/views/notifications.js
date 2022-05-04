import Constructor from "./constructor.js";

export default class extends Constructor {
    constructor(params) {
        super(params);
        this.setTitle("Notification");
        navbar('#nav__link__notifications', true);
    }

    async render() {
        return `This is notification page`;
    }

    async after_render() {
        
    }
}
