import { descending as d3_descending, ascending as d3_ascending } from "d3-array";
import { scaleOrdinal as d3_scaleOrdinal } from 'd3-scale';
import { hierarchy as d3_hierarchy } from 'd3-hierarchy';
import AbstractScale from './AbstractScale.js';
import DataContainer from './../data/DataContainer.js';
import { filterHierarchy } from './../helpers.js';

/**
 * Scale class for categorical variables.
 */
export default class CategoricalScale extends AbstractScale {

    /**
     * Create a categorical scale.
     * @param {string} id The ID for the scale.
     * @param {string} name The name for the scale.
     * @param {array} domain The domain for the scale, or a promise.
     * @param {array} humanDomain The humanDomain for the scale, or a promise. Optional.
     * @param {object} colorOverrides The default colorOverrides for the scale. Optional.
     * @param {Expected} expected An object on which to subscribe to data.
     */
    constructor(id, name, domain, humanDomain, colorOverrides, colorScaleKey, expected) {
        super(id, name, domain, colorScaleKey, expected);

        this._humanDomain = undefined;

        if(humanDomain !== undefined) {
            Promise.resolve(humanDomain).then((d) => {
                this._humanDomain = d;
                this.emitUpdate();
            });
        }
        if(colorOverrides !== undefined) {
            this._colorOverrides = colorOverrides;
            this._colorOverridesOriginal = Object.assign({}, colorOverrides); // shallow copy
        } else {
            this._colorOverrides = {};
            this._colorOverridesOriginal = {};
        }
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
        if(this.humanDomain !== undefined && this.humanDomain.length > 0) {
            return d3_scaleOrdinal()
                .domain(this.domain)
                .range(this.humanDomain);
        }
    }

    /**
     * @returns {object} Mapping from domain value to colors for overridden values.
     */
    get colorOverrides() {
        return this._colorOverrides;
    }

    /** @inheritdoc */
    toHuman(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownString;
        }
        if(this.humanScale !== undefined) {
            return this.humanScale(domainValue);
        }
        return domainValue;
    }

    /** @inheritdoc */
    color(domainValue) {
        if(AbstractScale.isUnknown(domainValue)) {
            return AbstractScale.unknownColor;
        }
        if(Object.keys(this._colorOverrides).includes(domainValue)) {
            return this._colorOverrides[domainValue];
        }
        return this.colorScale(this.domain.findIndex((el) => (el === domainValue)) / parseFloat(this.domain.length - 1));
    }

    /**
     * Set overridden values for colors.
     * @param {object} colorOverrides Mapping of domain values to colors.
     */
    setColorOverrides(colorOverrides) {
        this._colorOverrides = colorOverrides;
        this.emitUpdate();
    }

    /** @inheritdoc */
    comparator(a, b, ascending=true) {
        let compareFunc = d3_ascending;
        if(!ascending) {
            compareFunc = d3_descending;
        }
        return compareFunc(
            (a == "nan" ? -1 : this.domain.indexOf(a)), 
            (b == "nan" ? -1 : this.domain.indexOf(b))
        );
    }

    /**
     * Zooms the scale.
     * @param {number} newMinIndex Index of the new minimum element (inclusive)
     * @param {number} newMaxIndex Index of the new maximum element (exclusive)
     */
    zoom(newMinIndex, newMaxIndex) {
        let elementsFiltered = this._domain.slice(newMinIndex, newMaxIndex);
        this.setDomainFiltered(elementsFiltered);
    }

    /**
     * Filters the scale.
     * @param {array} indicesToKeep Array of indices of elements to include.
     */
    filter(indicesToKeep) {
        let elementsFiltered = indicesToKeep.map(index => this._domain[index]);
        this.setDomainFiltered(elementsFiltered);
    }

    /**
     * Sort the domain based on the data passed.
     * @param {object} dataContainer DataContainer instance holding the data used to sort.
     * @param {string} var1D
     * @param {boolean} ascending Whether to sort ascending or descending.
     */
    sort(dataContainer, var1D, comparatorScale, ascending=true) {
        console.assert(dataContainer instanceof DataContainer);
        if(dataContainer.isLoading) {
            return;
        }
        let data = dataContainer.dataCopy;
        console.assert(Array.isArray(data));


        let comparator = (domainA, domainB) => {
            let dataA = data.find((el) => el[this.id] === domainA);
            let dataB = data.find((el) => el[this.id] === domainB);
            
            let a, b;
            if(dataA === undefined || dataA[var1D] === "nan") {
                a = -1;
            } else {
                a = dataA[var1D];
            }
            if(dataB === undefined || dataB[var1D] === "nan") {
                b = -1;
            } else {
                b = dataB[var1D];
            }

            return comparatorScale.comparator(a, b, ascending)
        };
        
        let domainCopy = this.domain.slice();
        let domainFilteredCopy = this.domainFiltered.slice();

        let newDomain = domainCopy.sort(comparator);
        this.setDomain(newDomain);

        // Set filtered domain
        let newDomainFiltered = domainFilteredCopy.sort(comparator);
        this.setDomainFiltered(newDomainFiltered);

    }

    /**
     * Sort the domain based on the hierarchy passed.
     * @param {object} dataContainer DataContainer instance holding the hierarchy data.
     */
    sortByHierarchy(dataContainer) {
        console.assert(dataContainer instanceof DataContainer);
        if(dataContainer.isLoading) {
            return;
        }
        const hierarchyData = dataContainer.dataCopy;
        console.assert(typeof hierarchyData === "object");
        
        const cleanedHierarchyData = filterHierarchy(hierarchyData, this.domain);
        
        const root = d3_hierarchy(cleanedHierarchyData);
        const leaves = root.leaves().map((el) => el.data.name);
        // Set domain
        this.setDomain(leaves);
        // Set domain filtered
        this.setDomainFiltered(leaves.slice());
    }

    /**
     * Filter the domain based on the hierarchy passed.
     * @param {object} dataContainer DataContainer instance holding the hierarchy data.
     * @param {string} newParentKey Key of the node that will be used as the parent of the filtered nodes.
     */
    filterByHierarchy(dataContainer, newParentKey) {
        console.assert(dataContainer instanceof DataContainer);
        if(dataContainer.isLoading) {
            return;
        }
        const hierarchyData = dataContainer.dataCopy;
        console.assert(typeof hierarchyData === "object");
        
        const getParent = (node) => {
            if(node.name === newParentKey) {
                return node;
            } else {
                for(let child of node.children) {
                    let possibleParent = getParent(child);
                    if(possibleParent !== undefined) {
                        return possibleParent;
                    }
                }
            }
        }
        const cleanedHierarchyData = filterHierarchy(hierarchyData, this.domain);
        
        const filteredParent = getParent(cleanedHierarchyData);
        const filteredRoot = d3_hierarchy(filteredParent);
        const filteredLeaves = filteredRoot.leaves().map((el) => el.data.name);
        // Set filtered domain
        this.setDomainFiltered(filteredLeaves);
    }

    /**
     * Resets the color override object.
     */
    resetColorOverride() {
        this.setColorOverrides(this._colorOverridesOriginal);
    }

    /**
     * Resets the color override object.
     */
    resetSort() {
        this.setDomain(this._domainOriginal.slice());
        const newDomainFiltered = this._domainOriginal.slice().filter((el) => this._domainFiltered.includes(el));
        this.setDomainFiltered(newDomainFiltered);
    }
    

}