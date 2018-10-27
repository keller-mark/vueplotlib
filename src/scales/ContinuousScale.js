import { descending as d3_descending } from 'd3-array';
import AbstractScale from './AbstractScale.js';

/**
 * Scale class for continuous variables.
 */
export default class ContinuousScale extends AbstractScale {

    /** @inheritdoc */
    get type() {
        return AbstractScale.types.CONTINUOUS;
    }


    /** @inheritdoc */
    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        return this.colorScale((domainValue - this.domain[0]) / parseFloat(this.domain[1] - this.domain[0]));
    }

    /** @inheritdoc */
    comparator(a, b) {
        return d3_descending(
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
        this._domainFiltered = [newMin, newMax];
        this.emitUpdate();
    }

}