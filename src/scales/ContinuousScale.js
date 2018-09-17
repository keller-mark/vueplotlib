import * as d3 from 'd3';
import AbstractScale from './AbstractScale.js';

export default class ContinuousScale extends AbstractScale {

    get type() {
        return AbstractScale.types.CONTINUOUS;
    }

    get colorScale() {
        return d3.interpolateYlOrRd;
    }

    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        return this.colorScale((domainValue - this.domain[0]) / parseFloat(this.domain[1] - this.domain[0]));
    }

    comparator(a, b) {
        return d3.descending(
            (a == "nan" ? -1 : +a), 
            (b == "nan" ? -1 : +b)
        );
    }

}