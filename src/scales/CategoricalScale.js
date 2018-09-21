import { descending as d3_descending, ascending as d3_ascending } from "d3-array";
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

    toHuman(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownString;
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

    /**
     * Zooms the scale.
     * @param {int} newMinIndex Index of the new minimum element (inclusive)
     * @param {int} newMaxIndex Index of the new maximum element (inclusive)
     */
    zoom(newMinIndex, newMaxIndex) {
        let elementsFiltered = this._domain.slice(newMinIndex, newMaxIndex + 1);
        this.setDomainFiltered(elementsFiltered);
        this.emitUpdate();
    }

    /**
     * Filters the scale.
     * @param {array} indicesToKeep Array of indices of elements to include.
     */
    filter(indicesToKeep) {
        let elementsFiltered = indicesToKeep.map(index => this._domain[index]);
        this.setDomainFiltered(elementsFiltered);
        this.emitUpdate();
    }

    /**
     * Sort the data based on the variables passed in.
     * @param {object} dataContainer DataContainer instance holding the data used to sort.
     * @param {string} var1D 
     * @param {string} var2D Optional.
     * @param {boolean} ascending Whether to sort ascending or descending.
     */
    sort(dataContainer, var1D, var2D, ascending=true) {
        // TODO: use d3_descending/ascending
        let comparator;
        let compareFunc = d3_ascending;
        if(!ascending) {
            compareFunc = d3_descending;
        }
        
        if(var1D !== undefined && var2D !== undefined) {
            comparator = (a, b) => compareFunc(
                (a[var1D][var2D] == "nan" ? -1 : +a[var1D][var2D]), 
                (b[var1D][var2D] == "nan" ? -1 : +b[var1D][var2D])
            );
        } else if(var1D !== undefined) {
            comparator = (a, b) => compareFunc(
                (a[var1D] == "nan" ? -1 : +a[var1D]), 
                (b[var1D] == "nan" ? -1 : +b[var1D])
            );
        }
        // TODO: Sort the data using the comparator, doing something like this
        let data = dataContainer.dataCopy;
        console.assert(data instanceof Array);
        data = data.sort(comparator);
        // Use map to get array of this.id, filter using those indices
        // Set overall domain
        let elementsSorted = data.map((el) => el[this.id]);
        this.setDomain(elementsSorted);

        // Set filtered domain
        let elementsSortedFiltered = elementsSorted.filter((el) => this._domainFiltered.includes(el));
        this.setDomainFiltered(elementsSortedFiltered);

        this.emitUpdate();
    }

}