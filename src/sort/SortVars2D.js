import AbstractSortVars from "./AbstractSortVars";

/*
Think of SortBy with a 2D "on" like this:
{
    'data': 'exposures_data', 
    'on': { 
        'type': '2D', 
        'variables': {
            'exposure': [
                { 
                    'type': '1D', 
                    'variables':{
                        'signature': ["COSMIC 1"] 
                    }
                }
            ]
        } 
    }
}
*/

/**
 * Represents a list of variables that can be used with the SortBy class.
 */
export default class SortVars2D extends AbstractSortVars {
    /**
     * Create a SortVars2D object (can be passed to on= param of SortBy constructor).
     * @param {object} variables Object mapping variable keys to SortVars1D objects.
     */
    constructor(variables) {
        super();
        this._variables = variables;
    }

    /**
     * The variables on which to sort.
     * @returns {object} Object mapping variable keys to SortVars1D objects.
     */
    get variables() {
        return this._variables;
    }
}