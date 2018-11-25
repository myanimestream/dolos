export default class Page {
    static get singleton() {
        if (!this._singleton) {
            this._singleton = new this();
        }
        return this._singleton;
    }

    static async show() {
        const page = this.singleton;
        await page.render();
    }

    async render() {

    }
}