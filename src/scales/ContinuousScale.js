import { interpolateYlOrRd as d3_interpolateYlOrRd } from 'd3-scale-chromatic';
import { descending as d3_descending } from 'd3-array';
import AbstractScale from './AbstractScale.js';

export default class ContinuousScale extends AbstractScale {

    get type() {
        return AbstractScale.types.CONTINUOUS;
    }

    get colorScale() {
        return d3_interpolateYlOrRd;
    }

    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        return this.colorScale((domainValue - this.domain[0]) / parseFloat(this.domain[1] - this.domain[0]));
    }

    comparator(a, b) {
        return d3_descending(
            (a == "nan" ? -1 : +a), 
            (b == "nan" ? -1 : +b)
        );
    }

    /**
     * Zooms the scale.
     * @param {int} newMin New minimum domain element value.
     * @param {int} newMax New maximum domain element value.
     */
    zoom(newMin, newMax) {
        this._domainFiltered = [newMin, newMax];
        this.emitUpdate();
    }

}