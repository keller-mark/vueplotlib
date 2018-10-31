/**
 * Represents a single event in the application's history.
 * Given an event type, ID, action, and parameters,
 * the event will be able to be executed in the following way:
 * - the history stack will use the type (e.g. SCALE) to identify a function that it knows about (e.g. getScale)
 * - the event-type-specific function will be called using the provided ID (e.g. getScale(ID) ), which will return an object
 * - the function specified by `action` will be invoked on the returned object, using the array of params as parameters
 */
export default class HistoryEvent {

    /**
     * 
     * @param {number} type Event type, such as SCALE, etc...
     * @param {number} subtype Event subtype, such as SCALE_DOMAIN, etc...
     * @param {string} id Event identifier, used for history
     * @param {string} action Method to call on the object.
     * @param {array} params Parameters with which to call the method.
     */
    constructor(type, subtype, id, action, params) {
        this._type = type;
        this._subtype = subtype;
        this._id = id;
        this._action = action;
        this._params = params || [];
    }

    /**
     * @returns {number} The event type.
     */
    get type() {
        return this._type;
    }

    /**
     * @returns {number} The event subtype.
     */
    get subtype() {
        return this._subtype;
    }

    /**
     * @returns {string} The event identifier.
     */
    get id() { 
        return this._id;
    }

    /**
     * @returns {string} The name of the method to call on the target object.
     */
    get action() {
        return this._action;
    }

    /**
     * @returns {array} The params to pass to the method specified by `action`.
     */
    get params() {
        return this._params;
    }

    /**
     * 
     * @param {HistoryEvent} event Another history event.
     * @returns {boolean} Whether the other history event is related to this.
     */
    isRelated(event) {
        return (event._type === this._type && event._subtype === this._subtype && event._id === this._id);
    } 

    /**
     * @returns {object} JSON representation of the event.
     */
    toJson() {
        return {
            "type": this._type,
            "subtype": this._subtype,
            "id": this._id,
            "action": this._action,
            "params": this._params
        }
    }
}