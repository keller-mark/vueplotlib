import { dispatch as d3_dispatch } from "d3-dispatch";

const DISPATCH_EVENT_UPDATE = "update";
/**
 * Represents a container of a data array.
 */
export default class DataContainer {

    /**
     * Create a data container.
     * @param {string} id The ID for the data.
     * @param {string} name The name for the data.
     * @param {*} data The data to hold, or a promise that will return the data.
     * @param {Expected} expected An object on which to subscribe to data.
     */
    constructor(id, name, data, expected) {
        this._id = id;
        this._name = name;
        this._isLoading = true;
        this._data = null;
        this._dispatch = d3_dispatch(DISPATCH_EVENT_UPDATE);

        if(data) {
            Promise.resolve(data).then((d) => {
                this._data = d;
                this._isLoading = false;
                this.emitUpdate();
            });
        }

        if(expected) {
            expected.onData(this.constructor.name, this._id, (expectedData) => {
                if(expectedData.hasOwnProperty("data") && expectedData["data"].hasOwnProperty(this._id)) {
                    const d = expectedData["data"][this._id];
                    this._data = d;
                    this._isLoading = false;
                    this.emitUpdate();
                }
            });
        }
    }
    
    /**
     * @returns {string} The ID for the data.
     */
    get id() {
        return this._id;
    }

    /**
     * @returns {string} The name for the data.
     */
    get name() {
        return this._name;
    }
    
    /**
     * @returns {array} The data.
     */
    get data() {
        return this._data;
    }

    /**
     * @returns {*} The data copied.
     */
    get dataCopy() {
        if(this.data instanceof Array) {
            // Shallow copy
            // TODO: change to deep copy
            return Array.from(this.data);
        }
        // TODO: deep copy if object
        return this.data;
    }

    /**
     * @returns {boolean} The loading status.
     */
    get isLoading() {
        return this._isLoading;
    }

    /**
     * Set the data variable.
     * @param {*} newData The data to be set, or a promise that will return the data to be set..
     */
    setData(newData) {
        this._isLoading = true;
        this.emitUpdate();
        Promise.resolve(newData).then((d) => {
            this._data = d;
            this._isLoading = false;
            this.emitUpdate();
        });
    }
    
    /**
     * Subscribe to update events.
     * @param {string} componentId 
     * @param {function} callback 
     */
    onUpdate(componentId, callback) {
        this._dispatch.on(DISPATCH_EVENT_UPDATE + "." + componentId, callback);
    }

    /**
     * Emit the update event.
     */
    emitUpdate() {
        this._dispatch.call(DISPATCH_EVENT_UPDATE);
    }
}