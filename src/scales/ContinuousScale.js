import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import AbstractScale from './AbstractScale.js';

/**
 * Scale class for continuous variables.
 */
export default class ContinuousScale extends AbstractScale {

    /** @inheritdoc */
    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        return this.colorScale((domainValue - this.domain[0]) / parseFloat(this.domain[1] - this.domain[0]));
    }

    /** @inheritdoc */
    comparator(a, b, ascending=true) {
        let compareFunc = d3_ascending;
        if(!ascending) {
            compareFunc = d3_descending;
        }
        return compareFunc(
            (a == "nan" ? -1 : +a), 
            (b == "nan" ? -1 : +b)
        );
    }

    /**
     * Zooms the scale.
     * @param {number} newMin New minimum domain element value.
     * @param {number} newMax New maximum domain element value.
     */
    zoom(newMin, newMax) {
        this.setDomainFiltered([newMin, newMax]);
    }

}