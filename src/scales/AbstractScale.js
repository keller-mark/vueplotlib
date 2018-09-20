import { interpolateRdYlBu as d3_interpolateRdYlBu } from "d3-scale-chromatic";

export default class AbstractScale {

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
     * @returns {int} Comparison result of -1, 0, or 1.
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
}