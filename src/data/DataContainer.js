import { dispatch as d3_dispatch } from "d3-dispatch";

const DISPATCH_EVENT_UPDATE = "update";

export default class DataContainer {

    /**
     * Create a data container.
     * @param {string} id The ID for the data.
     * @param {string} name The name for the data.
     * @param {array} data The data to hold.
     */
    constructor(id, name, data) {
        this._id = id;
        this._name = name;
        this._data = data;
        this._dispatch = d3_dispatch(DISPATCH_EVENT_UPDATE);
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
     * @returns {array} The data copied.
     */
    get dataCopy() {
        if(this.data instanceof Array) {
            // Shallow copy
            return Array.from(this.data);
        }
        console.error("The data is not an array, unsure how to copy");
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