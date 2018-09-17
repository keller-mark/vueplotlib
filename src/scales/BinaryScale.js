import * as d3 from 'd3';
import CategoricalScale from './CategoricalScale.js';

export default class BinaryScale extends CategoricalScale {
    /**
     * Create a binary scale.
     * @param {string} id The ID for the scale.
     * @param {string} name The name for the scale.
     */
    constructor(id, name) {
        super(id, name, [1, 0], ["Yes", "No"]);
    }

    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        return this.colorScale(1 - domainValue);
    }

    comparator(a, b) {
        return d3.descending(
            (a == "nan" ? -1 : +a), 
            (b == "nan" ? -1 : +b)
        );
    }

}