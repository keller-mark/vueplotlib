import AbstractScaleDispatcher from './AbstractScaleDispatcher.js';
import { 
    interpolateBrBG as d3_interpolateBrBG,
    interpolatePRGn as d3_interpolatePRGn,
    interpolatePiYG as d3_interpolatePiYG,
    interpolatePuOr as d3_interpolatePuOr,
    interpolateRdBu as d3_interpolateRdBu,
    interpolateRdGy as d3_interpolateRdGy,
    interpolateRdYlBu as d3_interpolateRdYlBu,
    interpolateRdYlGn as d3_interpolateRdYlGn,
    interpolateSpectral as d3_interpolateSpectral,
    interpolateBlues as d3_interpolateBlues,
    interpolateGreens as d3_interpolateGreens,
    interpolateGreys as d3_interpolateGreys,
    interpolateOranges as d3_interpolateOranges,
    interpolatePurples as d3_interpolatePurples,
    interpolateReds as d3_interpolateReds,
    interpolateViridis as d3_interpolateViridis,
    interpolateInferno as d3_interpolateInferno,
    interpolateMagma as d3_interpolateMagma,
    interpolatePlasma as d3_interpolatePlasma,
    interpolateWarm as d3_interpolateWarm,
    interpolateCool as d3_interpolateCool,
    interpolateCubehelixDefault as d3_interpolateCubehelixDefault,
    interpolateBuGn as d3_interpolateBuGn,
    interpolateBuPu as d3_interpolateBuPu,
    interpolateGnBu as d3_interpolateGnBu,
    interpolateOrRd as d3_interpolateOrRd,
    interpolatePuBuGn as d3_interpolatePuBuGn,
    interpolatePuBu as d3_interpolatePuBu,
    interpolatePuRd as d3_interpolatePuRd,
    interpolateRdPu as d3_interpolateRdPu,
    interpolateYlGnBu as d3_interpolateYlGnBu,
    interpolateYlGn as d3_interpolateYlGn,
    interpolateYlOrBr as d3_interpolateYlOrBr,
    interpolateYlOrRd as d3_interpolateYlOrRd,
    interpolateRainbow as d3_interpolateRainbow,
    interpolateSinebow as d3_interpolateSinebow
} from "d3-scale-chromatic";


/**
 * Abstract class representing a scale.
 * @interface
 */
export default class AbstractScale extends AbstractScaleDispatcher {

    /**
     * @enum
     * @readonly
     */
    static colorScales = Object.freeze({
        "BrBG": d3_interpolateBrBG,
        "PRGn": d3_interpolatePRGn,
        "PiYG": d3_interpolatePiYG,
        "PuOr": d3_interpolatePuOr,
        "RdBu": d3_interpolateRdBu,
        "RdGy": d3_interpolateRdGy,
        "RdYlBu": d3_interpolateRdYlBu,
        "RdYlGn": d3_interpolateRdYlGn,
        "Spectral": d3_interpolateSpectral,
        "Blues": d3_interpolateBlues,
        "Greens": d3_interpolateGreens,
        "Greys": d3_interpolateGreys,
        "Oranges": d3_interpolateOranges,
        "Purples": d3_interpolatePurples,
        "Reds": d3_interpolateReds,
        "Viridis": d3_interpolateViridis,
        "Inferno": d3_interpolateInferno,
        "Magma": d3_interpolateMagma,
        "Plasma": d3_interpolatePlasma,
        "Warm": d3_interpolateWarm,
        "Cool": d3_interpolateCool,
        "CubehelixDefault": d3_interpolateCubehelixDefault,
        "BuGn": d3_interpolateBuGn,
        "BuPu": d3_interpolateBuPu,
        "GnBu": d3_interpolateGnBu,
        "OrRd": d3_interpolateOrRd,
        "PuBuGn": d3_interpolatePuBuGn,
        "PuBu": d3_interpolatePuBu,
        "PuRd": d3_interpolatePuRd,
        "RdPu": d3_interpolateRdPu,
        "YlGnBu": d3_interpolateYlGnBu,
        "YlGn": d3_interpolateYlGn,
        "YlOrBr": d3_interpolateYlOrBr,
        "YlOrRd": d3_interpolateYlOrRd,
        "Rainbow": d3_interpolateRainbow,
        "Sinebow": d3_interpolateSinebow
    });
    static unknownColor = "#E3E3E3";
    static unknownString = "Unknown";

    static defaultColorScale = d3_interpolateRdYlBu;

    /**
     * Create a scale.
     * @param {*} id The ID for the scale.
     * @param {*} name The name for the scale.
     * @param {*} domain The domain for the scale.
     */
    constructor(id, name, domain, colorScaleKey) {
        super();
        this._id = id;
        this._name = name;
        
        if(colorScaleKey === undefined) {
            this._colorScaleOriginal = AbstractScale.defaultColorScale;
            this._colorScale = AbstractScale.defaultColorScale;
        } else {
            this._colorScaleOriginal = AbstractScale.colorScales[colorScaleKey];
            this._colorScale = AbstractScale.colorScales[colorScaleKey];
        }

        this._domain = [];
        this._domainFiltered = [];
        this._domainOriginal = [];
        
        this._isLoading = true;
        Promise.resolve(domain).then((d) => {
            this._domain = d.slice();
            this._domainFiltered = d.slice();
            this._domainOriginal = d.slice();
            this._isLoading = false;
            this.emitUpdate();
        });
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
     * @returns {boolean} The loading status.
     */
    get isLoading() {
        return this._isLoading;
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
        return this._colorScale;
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
     * @returns {number} Comparison result of -1, 0, or 1.
     */
    comparator(a, b, ascending) {
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

    /**
     * Set the domain directly.
     * @param {array} newDomain An array of new domain values, or a promise that will return the array.
     */
    setDomain(newDomain) {
        this._isLoading = true;
        this.emitUpdate();
        Promise.resolve(newDomain).then((d) => {
            this._domain = d.slice();
            this._isLoading = false;
            this.emitUpdate();
        });
    }

    /**
     * Set the filtered domain directly.
     * @param {array} newDomainFiltered An array of new filtered domain values.
     */
    setDomainFiltered(newDomainFiltered) {
        this._isLoading = true;
        this.emitUpdate();
        Promise.resolve(newDomainFiltered).then((d) => {
            this._domainFiltered = d.slice();
            this._isLoading = false;
            this.emitUpdate();
        });
    }

    /**
     * Set the color scale function by its name.
     * @param {string} scaleKey The string key for the color scale.
     */
    setColorScaleByKey(scaleKey) {
        if(Object.keys(AbstractScale.colorScales).includes(scaleKey)) {
            this._colorScale = AbstractScale.colorScales[scaleKey];
            this.emitUpdate();
        }
    }

    /**
     * Resets the color scale.
     */
    resetColorScale() {
        this._colorScale = this._colorScaleOriginal;
        this.emitUpdate();
    }

    /**
     * Resets the filtered domain, using the full domain.
     */
    resetFilter() {
        this.setDomainFiltered(this._domain.slice());
    }

}