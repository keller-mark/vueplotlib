
/**
 * Represents options that specify how to sort a dataset.
 */
export default class SortBy {
    /**
     * Create a SortBy object (can be passed to SortOptions component by= prop).
     * @param {string} data The key for the data.
     * @param {array} variables An array of variable key strings.
     */
    constructor(data, variables) {
        this._data = data;
        this._variables = variables;
    }

    /**
     * @returns The key for the data.
     */
    get data() {
        return this._data;
    }

    /**
     * @returns The array of variable key strings.
     */
    get variables() {
        return this._variables;
    }
}