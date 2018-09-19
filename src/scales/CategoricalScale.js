import { descending as d3_descending } from "d3-array";
import { scaleOrdinal as d3_scaleOrdinal } from 'd3-scale';
import AbstractScale from './AbstractScale.js';

export default class CategoricalScale extends AbstractScale {

    /**
     * Create a categorical scale.
     * @param {string} id The ID for the scale.
     * @param {string} name The name for the scale.
     * @param {array} domain The domain for the scale.
     * @param {array} humanDomain The humanDomain for the scale.
     */
    constructor(id, name, domain, humanDomain) {
        super(id, name, domain);
        if(Array.isArray(humanDomain) && domain.length === humanDomain.length) {
            this._humanDomain = humanDomain;
        } else {
            this._humanDomain = domain;
        }
    }

    get type() {
        return AbstractScale.types.DISCRETE;
    }
    /**
     * Human-readable domain values
     * - Example domain:        [0, 1, 2]
     * - Example humanDomain:   ["string0", "string1", "string2"]
     * @returns {array} The human-readable domain values
     */
    get humanDomain() {
        // implementation example:
        // return ["string0", "string1", "string2"];
        return this._humanDomain;
    }
    
    /**
     * @returns {function} Function that converts domain value -> humanDomain value
     */
    get humanScale() {
        return d3_scaleOrdinal()
            .domain(this.domain)
            .range(this.humanDomain);
    }

    /**
     * Convert a domain value to a humanDomain value
     * @param {*} domainValue A domain value
     * @returns {*} The corresponding humanDomain value
     */
    toHuman(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return "Unknown";
        }
        return this.humanScale(domainValue);
    }

    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        return this.colorScale(this.domain.findIndex((el) => (el === domainValue)) / parseFloat(this.domain.length - 1));
    }

    comparator(a, b) {
        return d3_descending(
            (a == "nan" ? -1 : this.domain.indexOf(a)), 
            (b == "nan" ? -1 : this.domain.indexOf(b))
        );
    }

}