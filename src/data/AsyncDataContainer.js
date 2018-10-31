import DataContainer from "./DataContainer";

export default class AsyncDataContainer extends DataContainer {
    /**
     * Create an asynchronous data container.
     * @param {string} id The ID for the data.
     * @param {string} name The name for the data.
     * @param {Promise} dataPromise The data promise to hold.
     */
    constructor(id, name, dataPromise) {
        super(id, name, []);
        this._isLoading = true;

        dataPromise.then((data) => {
            this._data = data;
            this._isLoading = false;
            this.emitUpdate();
        });
    }
}