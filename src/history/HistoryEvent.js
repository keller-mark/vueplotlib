export default class HistoryEvent {

    static types = Object.freeze({ SCALE: 1 });

    /**
     * 
     * @param {integer} type Event type, such as SCALE, etc...
     * @param {string} id Event identifier, used for history
     * @param {object} details Event details.
     */
    constructor(type, id, details) {
        this._type = type;
        this._id = id;
        this._details = details;
    }

    /**
     * 
     * @param {HistoryEvent} event Another history event.
     */
    isRelated(event) {
        return (event._type === this._type && event._id === this._id);
    } 

    /**
     * @returns {object} JSON representation of the event.
     */
    toJson() {
        return {
            "type": this._type,
            "id": this._id,
            "details": this._details
        }
    }
}