import { interpolateRdYlBu as d3_interpolateRdYlBu } from "d3-scale-chromatic";
import { dispatch as d3_dispatch } from "d3-dispatch";

const DISPATCH_EVENT_UPDATE = "update";
const DISPATCH_EVENT_HIGHLIGHT = "highlight";
const DISPATCH_EVENT_HIGHLIGHT_DESTROY = "highlight-destroy";


/**
 * Abstract class representing a scale.
 * @interface
 */
export default class AbstractScale {

    /**
     * @enum
     * @readonly
     */
    static types = Object.freeze({ DISCRETE: 1, CONTINUOUS: 2 });
    static unknownColor = "#E3E3E3";
    static unknownString = "Unknown";

    /**
     * Create a scale.
     * @param {*} id The ID for the scale.
     * @param {*} name The name for the scale.
     * @param {*} domain The domain for the scale.
     */
    constructor(id, name, domain) {
        this._id = id;
        this._name = name;
        this._domain = domain;
        this._domainFiltered = domain.slice();
        this._dispatch = d3_dispatch(
            DISPATCH_EVENT_UPDATE, 
            DISPATCH_EVENT_HIGHLIGHT, 
            DISPATCH_EVENT_HIGHLIGHT_DESTROY
        );
    }
    
    /**
     * @returns {string} The ID for the scale.
     */
    get id() {
        return this._id;
    }
    
    /**
     * @returns {string} The name for the scale.
     */
    get name() {
        return this._name;
    }

    /**
     * @returns {enum} An integer representing the scale type (discrete, continuous)
     */
    get type() {
        throw new Error('You have to implement the getter type!');
    }

    /**
     * @returns {array} The values that variables using this scale can take.
     */
    get domain() {
        return this._domain;
    }

    /**
     * @returns {array} The values that variables using this scale can take after filtering.
     */
    get domainFiltered() {
        return this._domainFiltered;
    }

    /**
     * @returns {function} Function that converts a value between [0, 1] to a color
     */
    get colorScale() {
        return d3_interpolateRdYlBu;
    }

    /**
     * Converts a domain value to a color
     * @param {*} domainValue A domain value
     * @returns {color} A color value
     * 
     */
    color(domainValue) {
        throw new Error('You have to implement the method color!');
    }

    /**
     * Compares two domain values
     * @param {*} a A domain value
     * @param {*} b Another domain value
     * @returns {number} Comparison result of -1, 0, or 1.
     */
    comparator(a, b) {
        throw new Error('You have to implement the method comparator!');
    }

    /**
     * Check whether a domain value should be considered unknown
     * @param {*} domainValue A domain value
     * @returns {boolean} True if the domain value should be considered unknown
     */
    static isUnknown(domainValue) {
        return (domainValue == "nan" || domainValue === undefined);
    }

    /**
     * Convert a domain value to a human-readable value.
     * @param {*} domainValue A domain value
     * @returns {*} The corresponding humanDomain value
     */
    toHuman(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownString;
        }
        // The default implementation does nothing except the unknown check
        return domainValue;
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
     * Subscribe to highlight events.
     * @param {string} componentId 
     * @param {function} callback 
     */
    onHighlight(componentId, callback) {
        this._dispatch.on(DISPATCH_EVENT_HIGHLIGHT + "." + componentId, callback);
    }

    /**
     * Subscribe to highlight destroy events.
     * @param {string} componentId 
     * @param {function} callback 
     */
    onHighlightDestroy(componentId, callback) {
        this._dispatch.on(DISPATCH_EVENT_HIGHLIGHT_DESTROY + "." + componentId, callback);
    }

    /**
     * Emit the update event.
     */
    emitUpdate() {
        this._dispatch.call(DISPATCH_EVENT_UPDATE);
    }

    /**
     * Emit the highlight event.
     */
    emitHighlight(domainValue) {
        this._dispatch.call(DISPATCH_EVENT_HIGHLIGHT, null, domainValue);
    }

    /**
     * Emit the highlight destroy event.
     */
    emitHighlightDestroy() {
        this._dispatch.call(DISPATCH_EVENT_HIGHLIGHT_DESTROY);
    }

    /**
     * Set the domain directly.
     * @param {array} newDomain An array of new domain values.
     */
    setDomain(newDomain) {
        this._domain = newDomain;
    }

    /**
     * Set the filtered domain directly.
     * @param {array} newDomainFiltered An array of new filtered domain values.
     */
    setDomainFiltered(newDomainFiltered) {
        this._domainFiltered = newDomainFiltered;
    }

    /**
     * Resets the filtered domain, using the full original domain.
     */
    reset() {
        this.setDomainFiltered(this._domain.slice());
        this.emitUpdate();
    }
}