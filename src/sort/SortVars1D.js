import AbstractSortVars from "./AbstractSortVars.js";

/*
Think of SortBy with a 1D "on" like this:
{
    'data': 'exposures_data', 
    'on': { 
        'type': '1D', 
        'variables': ['exposure'] 
    }
}
*/

export default class SortVars1D extends AbstractSortVars {
    /**
     * Create a SortVars1D object (can be passed to on= param of SortBy constructor).
     * @param {array} variables Array of strings containing variable keys.
     */
    constructor(variables) {
        this._variables = variables;
    }

    /**
     * The variables on which to sort.
     * @returns {array} Array of strings containing variable keys.
     */
    get variables() {
        return this._variables;
    }
}