<template>
    <div 
        :id="this.axisElemID" 
        class="vdp-axis" 
        :style="{
            'height': this.computedHeight + 'px', 
            'width': this.computedWidth + 'px',
            'top': this.computedTop + 'px',
            'left': this.computedLeft + 'px'
        }"
    >
        <svg :width="this.computedWidth" :height="this.computedHeight" xmlns="http://www.w3.org/2000/svg"></svg>
        <div class="vdp-genome-input" :style="{ 'left': this.computedTranslateX + 'px' }">
            <label>Chromosome</label>&nbsp;
            <select @change="onChromosomeChange">
                <option value="*" :selected="isWholeGenome">*</option>
                <option v-for="chromosomeName in allChromosomes" 
                    :key="chromosomeName"
                    :selected="selectedChromosome === chromosomeName"
                >{{ chromosomeName }}</option>
            </select>&nbsp;
            <span v-if="isSingleChromosome">
                <input type="text" :value="selectedChromosomeStart.toLocaleString()" @change="onChromosomeStartChange"/>
                &nbsp;-&nbsp;
                <input type="text" :value="selectedChromosomeEnd.toLocaleString()" @change="onChromosomeEndChange"/>
                &nbsp;
                <button @click="onChromosomeShiftLeft">&lt;&lt;</button>
                <button @click="onChromosomeShiftRight">&gt;&gt;</button>
                &nbsp;
                <button @click="onChromosomeZoomIn">+</button>
                <button @click="onChromosomeZoomOut">-</button>
            </span>
        </div>
    </div>
</template>

<script>
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { axisTop as d3_axisTop, axisLeft as d3_axisLeft, axisRight as d3_axisRight, axisBottom as d3_axisBottom } from 'd3-axis';
import { zip as d3_zip } from 'd3-array';

import GenomeScale from './../../scales/GenomeScale.js';
import HistoryEvent from './../../history/HistoryEvent.js';
import HistoryStack from './../../history/HistoryStack.js';

import { EVENT_TYPES, EVENT_SUBTYPES } from './../../history/base-events.js';

const SIDES = Object.freeze({ "TOP": 1, "LEFT": 2, "RIGHT": 3, "BOTTOM": 4 });
const ORIENTATIONS = Object.freeze({ "VERTICAL": 1, "HORIZONTAL": 2 }); // vertical = left/right, horizontal = top/bottom

let uuid = 0;
/**
 * @prop {string} scaleKey The key for the genome scale instance, passed to getScale.
 * @prop {string} side The side for the scale.
 * @prop {number} pWidth The plot width.
 * @prop {number} pHeight The plot height.
 * @prop {number} pMarginTop The plot top margin.
 * @prop {number} pMarginLeft The plot left margin.
 * @prop {number} pMarginRight The plot right margin.
 * @prop {number} pMarginBottom The plot bottom margin.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} getStack Function that returns a HistoryStack instance.
 * 
 * @example
 * <GenomeAxis
 *      :scaleKey="genome_scale"
 *      side="bottom" 
 *      :pWidth="500"
 *      :pHeight="300"
 *      :pMarginTop="10"
 *      :pMarginLeft="120"
 *      :pMarginRight="10"
 *      :pMarginBottom="150"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *  />
 */
export default {
    name: 'GenomeAxis',
    props: {
        'scaleKey': {
            type: String
        },
        'side': {
            type: String
        },
        'pWidth': {
            type: Number
        },
        'pHeight': {
            type: Number
        },
        'pMarginTop': {
            type: Number
        },
        'pMarginLeft': {
            type: Number
        },
        'pMarginRight': {
            type: Number
        },
        'pMarginBottom': {
            type: Number
        },
        'getScale': {
            type: Function
        },
        'getStack': {
            type: Function
        }
    },
    data() {
        return {
            isSingleChromosome: false,
            isWholeGenome: false,
            selectedChromosome: null,
            selectedChromosomeStart: null,
            selectedChromosomeEnd: null
        }
    },
    computed: {
        axisElemID: function() {
            return 'g_axis_' + this.uuid;
        },
        axisSelector: function() {
            return "#" + this.axisElemID;
        },
        computedWidth: function() {
            if(this._side === SIDES.BOTTOM || this._side === SIDES.TOP) {
                return this.pMarginLeft + this.pWidth + this.pMarginRight;
            } else if(this._side === SIDES.LEFT) {
                return this.pMarginLeft + 1;
            } else if(this._side === SIDES.RIGHT) {
                return this.pMarginRight;
            }
        },
        computedHeight: function() {
            if(this._side === SIDES.LEFT || this._side === SIDES.RIGHT) {
                return this.pMarginTop + this.pHeight + this.pMarginBottom;
            } else if(this._side === SIDES.TOP) {
                return this.pMarginTop + 1;
            } else if(this._side === SIDES.BOTTOM) {
                return this.pMarginBottom;
            }
        },
        computedTop: function() {
            if(this._side === SIDES.BOTTOM) {
                return this.pMarginTop + this.pHeight;
            }
            return 0;
        },
        computedLeft: function() {
            if(this._side === SIDES.RIGHT) {
                return this.pMarginLeft + this.pWidth;
            }
            return 0;
        },
        computedTranslateX: function() {
            if(this._side === SIDES.LEFT) {
                return this.pMarginLeft;
            } else if(this._side === SIDES.BOTTOM || this._side === SIDES.TOP) {
                return this.pMarginLeft;
            }
            return 0;
        },
        computedTranslateY: function() {
            if(this._side === SIDES.LEFT) {
                return this.pMarginTop;
            } else if(this._side === SIDES.RIGHT) {
                return this.pMarginTop;
            } else if(this._side === SIDES.TOP) {
                return this.pMarginTop;
            }
            return 0;
        },
        allChromosomes: function() {
            return this._varScale.chromosomes;
        }
    },
    watch: {
        pWidth: function () {
            this.drawAxis();
        },
        pHeight: function () {
            this.drawAxis();
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        // Set side and orientation enum values from side prop
        let sideString = this.side.toUpperCase();
        console.assert(Object.keys(SIDES).includes(sideString));
        this._side = SIDES[sideString];
        this._orientation = (this._side === SIDES.TOP || this._side === SIDES.BOTTOM ? ORIENTATIONS.HORIZONTAL : ORIENTATIONS.VERTICAL);

        console.assert(this._side === SIDES.BOTTOM); // TODO: implement for other sides
        
        // Set the scale variable
        this._varScale = this.getScale(this.scaleKey);
        console.assert(this._varScale instanceof GenomeScale);
        // Subscribe to event publishers
        this._varScale.onUpdate(this.uuid, this.drawAxis);

        this._stack = this.getStack();
        console.assert(this._stack instanceof HistoryStack);
    },
    mounted() {
        this.drawAxis();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._varScale.onUpdate(this.uuid, null);
        this.removeAxis();
    },
    methods: {
        onChromosomeChange(e) {
            if(e.target.value && e.target.value !== "*") {
                this._varScale.filterByChromosome(e.target.value);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                    this.scaleKey, 
                    "filterByChromosome", 
                    [e.target.value]
                ));
            } else {
                this._varScale.resetFilter();
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER,
                    this.scaleKey, 
                    "resetFilter"
                ));
            }
        },
        onChromosomeStartChange(e) {
            let val = e.target.value;
            val = parseInt(val.replace( /[^0-9]+/g, ''));

            let chromosomeDomain = this._varScale.getDomain(this.selectedChromosome);
            if(val !== this.selectedChromosomeStart && val >= chromosomeDomain[0] && val <= chromosomeDomain[1]) {
                this._varScale.filterByChromosomeAndPosition(this.selectedChromosome, val, this.selectedChromosomeEnd);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                    this.scaleKey, 
                    "filterByChromosomeAndPosition", 
                    [this.selectedChromosome, val, this.selectedChromosomeEnd]
                ));
            }
        },
        onChromosomeEndChange(e) {
            let val = e.target.value;
            val = parseInt(val.replace( /[^0-9]+/g, ''));

            let chromosomeDomain = this._varScale.getDomain(this.selectedChromosome);
            if(val !== this.selectedChromosomeEnd && val >= chromosomeDomain[0] && val <= chromosomeDomain[1]) {
                this._varScale.filterByChromosomeAndPosition(this.selectedChromosome, this.selectedChromosomeStart, val);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                    this.scaleKey, 
                    "filterByChromosomeAndPosition", 
                    [this.selectedChromosome, this.selectedChromosomeStart, val]
                ));
            }
        },
        onChromosomeShiftLeft() {
            let chromosomeDomain = this._varScale.getDomain(this.selectedChromosome);
            let chromosomeDomainFiltered = this._varScale.getDomainFiltered(this.selectedChromosome);
            let chromosomeRangeFiltered = chromosomeDomainFiltered[1] - chromosomeDomainFiltered[0];
            let newStart = Math.max(chromosomeDomain[0], this.selectedChromosomeStart - Math.floor(chromosomeRangeFiltered / 2));
            let newEnd = Math.max(chromosomeDomain[0] + 1, this.selectedChromosomeEnd - Math.floor(chromosomeRangeFiltered / 2));
            if(this.selectedChromosomeStart > 0) {
                this._varScale.filterByChromosomeAndPosition(this.selectedChromosome, newStart, newEnd);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                    this.scaleKey, 
                    "filterByChromosomeAndPosition", 
                    [this.selectedChromosome, newStart, newEnd]
                ));
            }
        },
        onChromosomeShiftRight() {
            let chromosomeDomain = this._varScale.getDomain(this.selectedChromosome);
            let chromosomeDomainFiltered = this._varScale.getDomainFiltered(this.selectedChromosome);
            let chromosomeRangeFiltered = chromosomeDomainFiltered[1] - chromosomeDomainFiltered[0];
            let newStart = Math.min(chromosomeDomain[1] - 1, this.selectedChromosomeStart + Math.floor(chromosomeRangeFiltered / 2));
            let newEnd = Math.min(chromosomeDomain[1], this.selectedChromosomeEnd + Math.floor(chromosomeRangeFiltered / 2));
            if(this.selectedChromosomeEnd < chromosomeDomain[1]) {
                this._varScale.filterByChromosomeAndPosition(this.selectedChromosome, newStart, newEnd);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                    this.scaleKey, 
                    "filterByChromosomeAndPosition", 
                    [this.selectedChromosome, newStart, newEnd]
                ));
            }
        },
        onChromosomeZoomIn() {
            let chromosomeDomainFiltered = this._varScale.getDomainFiltered(this.selectedChromosome);
            let chromosomeRangeFiltered = chromosomeDomainFiltered[1] - chromosomeDomainFiltered[0];
            let offset = Math.floor(chromosomeRangeFiltered / 4);
            let newStart = this.selectedChromosomeStart + offset;
            let newEnd = this.selectedChromosomeEnd - offset;
            if(newStart !== this.selectedChromosomeStart || newEnd !== this.selectedChromosomeEnd) {
                this._varScale.filterByChromosomeAndPosition(this.selectedChromosome, newStart, newEnd);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                    this.scaleKey, 
                    "filterByChromosomeAndPosition", 
                    [this.selectedChromosome, newStart, newEnd]
                ));
            }
        },
        onChromosomeZoomOut() {
            let chromosomeDomain = this._varScale.getDomain(this.selectedChromosome);
            let chromosomeDomainFiltered = this._varScale.getDomainFiltered(this.selectedChromosome);
            let chromosomeRangeFiltered = chromosomeDomainFiltered[1] - chromosomeDomainFiltered[0];
            let offset = Math.floor(chromosomeRangeFiltered / 2);
            let newStart = Math.max(chromosomeDomain[0], this.selectedChromosomeStart - offset);
            let newEnd = Math.min(chromosomeDomain[1], this.selectedChromosomeEnd + offset);
            if(newStart !== this.selectedChromosomeStart || newEnd !== this.selectedChromosomeEnd) {
                this._varScale.filterByChromosomeAndPosition(this.selectedChromosome, newStart, newEnd);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                    this.scaleKey, 
                    "filterByChromosomeAndPosition", 
                    [this.selectedChromosome, newStart, newEnd]
                ));
            }
        },
        removeAxis() {
            d3_select(this.axisSelector).select("svg").selectAll("g").remove();
        },
        drawAxis(d3Node) {
            const vm = this;
            vm.removeAxis();
            
            const varScale = vm._varScale;

            vm.isSingleChromosome = (vm._varScale.chromosomesFiltered.length === 1);
            if(vm.isSingleChromosome) {
                vm.selectedChromosome = vm._varScale.chromosomesFiltered[0];
                let chromosomeDomain = vm._varScale.getDomainFiltered(vm.selectedChromosome);
                vm.selectedChromosomeStart = chromosomeDomain[0];
                vm.selectedChromosomeEnd = chromosomeDomain[1];
            } else {
                vm.selectedChromosome = null;
                vm.selectedChromosomeStart = null;
                vm.selectedChromosomeEnd = null;
            }
            vm.isWholeGenome = (vm._varScale.chromosomesFiltered.length === 25);
            
            
            
            let range;
            if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                range = [0, vm.pWidth];
            } else if(vm._orientation === ORIENTATIONS.VERTICAL) {
                range = [vm.pHeight, 0];
            }

            let axisFunction;
            if(vm._side === SIDES.TOP) {
                axisFunction = d3_axisTop;
            } else if(vm._side === SIDES.LEFT) {
                axisFunction = d3_axisLeft;
            } else if(vm._side === SIDES.RIGHT) {
                axisFunction = d3_axisRight;
            } else if(vm._side === SIDES.BOTTOM) {
                axisFunction = d3_axisBottom;
            }

            //let chromosomeRatiosCumulative = varScale.getChromosomeRatiosCumulative();
            let chromosomeRatiosCumulativeFiltered = varScale.getChromosomeRatiosCumulativeFiltered();


            //let chromosomeRatioZip = d3_zip(chromosomeRatiosCumulative, varScale.chromosomes);
            let chromosomeRatioZipFiltered = d3_zip(chromosomeRatiosCumulativeFiltered, varScale.chromosomesFiltered);

            const zipToMap = (zip) => {
                let obj = {};
                zip.forEach(function(data){
                    obj[data[0]] = data[1]
                });
                return obj;
            };

            //let chromosomeRatioMap = zipToMap(chromosomeRatioZip);
            let chromosomeRatioMapFiltered = zipToMap(chromosomeRatioZipFiltered);            
            
            let scaleZoomedIn = d3_scaleLinear()
                .domain([0, 1])
                .range(range);

            /*
             * Create the SVG elements
             */
            let container;
            if(d3Node) {
                container = d3Node;
            } else {
                container = d3_select(vm.axisSelector).select("svg");
            }
                        
            const containerZoomedIn = container.append("g")
                    .attr("class", "axis-zoomed-in")
                    .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");
            
            /*
             * The zoomed-in axis
             */
            const ticksZoomedIn = containerZoomedIn.call(
                axisFunction(scaleZoomedIn)
                    .tickValues(chromosomeRatiosCumulativeFiltered)
                    .tickFormat((d) => chromosomeRatioMapFiltered[d])
            );

            ticksZoomedIn.selectAll("text")	
                    .style("text-anchor", "middle");
            
            // Get the width/height of the zoomed-in axis, before removing the text
            
            let axisBboxZoomedIn;
            try {
                axisBboxZoomedIn = container.select(".axis-zoomed-in").node().getBBox();
                if(d3Node) {
                    throw new Error("no bbox, use catch block");
                }
            } catch(e) {
                axisBboxZoomedIn = {
                    width: 0,
                    height: vm.computedHeight/2,
                };
            }

            if(vm.isSingleChromosome) {
                let selectedChromosome = vm._varScale.chromosomesFiltered[0];
                let chromosomeDomain = vm._varScale.getDomainFiltered(selectedChromosome);
                
                let scaleChromosome = d3_scaleLinear()
                    .domain(chromosomeDomain)
                    .range(range);
                
                const containerChromosome = container.append("g")
                    .attr("class", "axis-zoomed-in")
                    .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");
                
                containerChromosome.call(
                    axisFunction(scaleChromosome)
                );
                ticksZoomedIn.selectAll("text")
                    .style("display", "none")
            }
            

            /*
             * The zoomed-out axis
             */
            const betweenAxisMargin = 8;

            let zoomedOutTranslateX = vm.computedTranslateX;
            let zoomedOutTranslateY = vm.computedTranslateY;

          
            /*
             * Axis label text
             */

            const containerLabel = container.append("g")
                    .attr("class", "axis-label")
                    .attr("transform", "translate(" + zoomedOutTranslateX + "," + zoomedOutTranslateY + ")");
            
            const labelText = containerLabel.append("text")
                .style("font-family", "Avenir")
                .style("text-anchor", "middle")
                .text(varScale.name);

            let labelTextBbox;
            try {
                labelTextBbox = labelText.node().getBBox();
            } catch(e) {
                labelTextBbox = {
                    width: 0,
                    height: 0,
                };
            }


            let labelX, labelY, labelRotate;
            if(vm._side === SIDES.LEFT) {
                labelY = -(axisBboxZoomedIn.width + (labelTextBbox.height / 2));
                labelX = -(vm.pHeight / 2);
                labelRotate = -90;
            } else if(vm._side === SIDES.BOTTOM) {
                labelX = (vm.pWidth / 2);
                labelY = (axisBboxZoomedIn.height + (labelTextBbox.height / 2) + betweenAxisMargin);
                labelRotate = 0;
            } else if(vm._side === SIDES.TOP) {
                labelX = (vm.pWidth / 2);
                labelY = -(axisBboxZoomedIn.height + (labelTextBbox.height / 2));
                labelRotate = 0;
            } else if(vm._side === SIDES.RIGHT) {
                labelY = -(axisBboxZoomedIn.width + (labelTextBbox.height / 2));
                labelX = (vm.pHeight / 2);
                labelRotate = 90;
            }

            labelText
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("transform", "rotate(" + labelRotate + ")");
            
        }
    }
}
</script>

<style>
@import '../../style/axis-style.css';

.vdp-genome-input {
    position: absolute;
    bottom: 4px;
}
</style>