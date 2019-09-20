import { descending as d3_descending } from "d3-array";
import CategoricalScale from './CategoricalScale.js';
import AbstractScale from './AbstractScale.js';

/**
 * Scale class for binary variables.
 */
export default class BinaryScale extends CategoricalScale {
    /**
     * Create a binary scale.
     * @param {string} id The ID for the scale.
     * @param {string} name The name for the scale.
     * @param {Expected} expected An object on which to subscribe to data.
     */
    constructor(id, name, expected) {
        super(id, name, [1, 0], ["Yes", "No"], expected);
    }

    /** @inheritdoc */
    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        return this.colorScale(1 - domainValue);
    }

    /** @inheritdoc */
    comparator(a, b) {
        return d3_descending(
            (a == "nan" ? -1 : +a), 
            (b == "nan" ? -1 : +b)
        );
    }

}