import { dispatch as d3_dispatch } from "d3-dispatch";
import { sum as d3_sum } from "d3-array";

const DISPATCH_EVENT_UPDATE = "update";

export const CHROMOSOMES = [
    '1',
    '2', 
    '3', 
    '4', 
    '5', 
    '6', 
    '7', 
    '8', 
    '9', 
    '10', 
    '11', 
    '12', 
    '13', 
    '14', 
    '15', 
    '16', 
    '17', 
    '18', 
    '19', 
    '20', 
    '21', 
    '22', 
    'X', 
    'Y', 
    'M'
];

export const CHROMOSOME_LENGTHS = {
    '1': 249250621,
    '2': 243199373,
    '3': 198022430,
    '4': 191154276,
    '5': 180915260,
    '6': 171115067,
    '7': 159138663,
    '8': 146364022,
    '9': 141213431,
    '10': 135534747,
    '11': 135006516,
    '12': 133851895,
    '13': 115169878,
    '14': 107349540,
    '15': 102531392,
    '16': 90354753,
    '17': 81195210,
    '18': 78077248,
    '19': 59128983,
    '20': 63025520,
    '21': 48129895,
    '22': 51304566,
    'X': 155270560,
    'Y': 59373566,
    'M': 16571
};

/**
 * Scale class for a genome variable.
 * Note: this does NOT inherit from AbstractScale.
 */
export default class GenomeScale {

    /**
     * Create a genomic scale.
     * @param {*} id The ID for the scale.
     * @param {*} name The name for the scale.
     */
    constructor(id, name) {
        this._id = id;
        this._name = name;

        this._chromosomes = CHROMOSOMES;
        this._chromosomesFiltered = CHROMOSOMES.slice();

        this._domains = CHROMOSOMES.map((el) => [0, CHROMOSOME_LENGTHS[el]]);
        this._domainsFiltered = this._domains.slice();

        this._dispatch = d3_dispatch(DISPATCH_EVENT_UPDATE);
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
     * @returns {array} Array of chromosome names.
     */
    get chromosomes() {
        return this._chromosomes;
    }

    /**
     * @returns {array} Filtered array of chromosome names.
     */
    get chromosomesFiltered() {
        return this._chromosomesFiltered;
    }

    /**
     * @param {string} chromosome A chromosome name.
     * @returns {array} Tuple-like array of inter-chromosome domain.
     */
    getDomain(chromosome) {
        return this._domains[this._chromosomes.indexOf(chromosome)];
    }

    /**
     * @returns {array} Array of tuple-like arrays of inter-chromosome domains.
     */
    getDomains() {
        return this._domains;
    }

    /**
     * @param {string} chromosome A chromosome name.
     * @returns {array} Tuple-like array of inter-chromosome domain filtered.
     */
    getDomainFiltered(chromosome) {
        return this._domainsFiltered[this._chromosomesFiltered.indexOf(chromosome)];
    }

    /**
     * @returns {array} Array of tuple-like arrays of inter-chromosome domains filtered.
     */
    getDomainsFiltered() {
        return this._domainsFiltered;
    }

    /**
     * @returns {array} Array of ratios corresponding to chromosome length over genome length.
     */
    getChromosomeRatios() {
        let cumsum = this._domains.reduce((a, h) => (a + (h[1] - h[0])), 0);
        return this._domains.map((el) => ((el[1] - el[0]) / cumsum));
    }

    /**
     * @returns {array} Array of ratios corresponding to chromosome length over genome length, for filtered chromosomes.
     */
    getChromosomeRatiosFiltered() {
        let cumsum = this._domainsFiltered.reduce((a, h) => (a + (h[1] - h[0])), 0);
        return this._domainsFiltered.map((el) => ((el[1] - el[0]) / cumsum));
    }

    /**
     * @returns {array} Array of cumulative ratios corresponding to chromosome length over genome length.
     */
    getChromosomeRatiosCumulative() {
        let ratios = this.getChromosomeRatios();
        let ratiosCumulative = [];
        let curr = 0;
        for(let ratio of ratios) {
            ratiosCumulative.push(curr);
            curr += ratio;
        }
        return ratiosCumulative;
    }

    /**
     * @returns {array} Array of cumulative ratios corresponding to chromosome length over genome length, for filtered chromosomes.
     */
    getChromosomeRatiosCumulativeFiltered() {
        let ratios = this.getChromosomeRatiosFiltered();
        let ratiosCumulative = [];
        let curr = 0;
        for(let ratio of ratios) {
            ratiosCumulative.push(curr);
            curr += ratio;
        }
        return ratiosCumulative;
    }

    /**
     * Converts a genomic position to a proportion over the whole genome
     * @param {string} chromosome The chromosome
     * @param {number} position The position on the 
     * @returns {float} Ratio of position to total genome length
     */
    convertPositionToRatio(chromosome, position) {
        let genomeLength = d3_sum(this._domains.map((el) => (el[1] - el[0])));
        let chromosomeIndex = this._chromosomes.indexOf(chromosome);
        return this._chromosomes.reduce((a, h) => {
            let curr = a;
            let currChromosomeIndex = this._chromosomes.indexOf(h);
            let currChromosomeDomain = this._domains[currChromosomeIndex];
            if(currChromosomeIndex == chromosomeIndex) {
                curr += (position - currChromosomeDomain[0]);
            } else if(currChromosomeIndex < chromosomeIndex) {
                curr += (currChromosomeDomain[1] - currChromosomeDomain[0]);
            }
            return curr;
        }, 0) / genomeLength;
    }

    /**
     * Converts a genomic position to a proportion over the whole genome
     * @param {string} chromosome The chromosome
     * @param {number} position The position on the 
     * @returns {float} Ratio of position to total genome length
     */
    convertPositionToRatioFiltered(chromosome, position) {
        let genomeLength = d3_sum(this._domainsFiltered.map((el) => (el[1] - el[0])));
        let chromosomeIndex = this._chromosomesFiltered.indexOf(chromosome);
        return this._chromosomesFiltered.reduce((a, h) => {
            let curr = a;
            let currChromosomeIndex = this._chromosomesFiltered.indexOf(h);
            let currChromosomeDomain = this._domainsFiltered[currChromosomeIndex];
            if(currChromosomeIndex == chromosomeIndex) {
                curr += (position - currChromosomeDomain[0]);
            } else if(currChromosomeIndex < chromosomeIndex) {
                curr += (currChromosomeDomain[1] - currChromosomeDomain[0]);
            }
            return curr;
        }, 0) / genomeLength;
    }
    
    /**
     * Convert a domain value to a human-readable value.
     * @param {string} chromosome A chromosome value.
     * @param {number} position A chromosome position value.
     * @returns {string} The corresponding humanDomain value.
     */
    toHuman(chromosome, position) {
        // TODO: number format for commas, etc...
        return "chr" + chromosome + ":" + position; 
    }
    
    /**
     * Filter by limiting to a single chromosome.
     * @param {string} selectedChromosome The chromosome to select.
     */
    filterByChromosome(selectedChromosome) {
        let chromosomeIndex = this._chromosomes.indexOf(selectedChromosome);
        this._chromosomesFiltered = [selectedChromosome];
        this._domainsFiltered = [this._domains[chromosomeIndex]];
        this.emitUpdate();
    }

    /**
     * Filter by limiting to a single chromosome and specific position.
     * @param {string} selectedChromosome The chromosome to select.
     * @param {number} start The start position.
     * @param {number} end The end position.
     */
    filterByChromosomeAndPosition(selectedChromosome, start, end) {
        this._chromosomesFiltered = [selectedChromosome];
        this._domainsFiltered = [[start, end]];
        this.emitUpdate();
    }

    /**
     * Subscribe to update events.
     * @param {string} componentId 
     * @param {function} callback 
     */
    onUpdate(componentId, callback) {
        this._dispatch.on(DISPATCH_EVENT_UPDATE + "." + componentId, callback);
    }

    /**
     * Emit the update event.
     */
    emitUpdate() {
        this._dispatch.call(DISPATCH_EVENT_UPDATE);
    }

    /**
     * Resets the filtered domain, using the full original domain.
     */
    reset() {
        this._domainsFiltered = this._domains.slice();
        this._chromosomesFiltered = this._chromosomes.slice();
        this.emitUpdate();
    }

   
}