<template>
    <div>
        <canvas 
            :id="this.plotElemID" 
            class="vdp-plot" 
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': (this.pWidth) + 'px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft) + 'px'
            }"
        ></canvas>
        <div v-show="this.highlightX1 !== null"  
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX1 - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightY1 !== null"  
            :style="{
                'height': '1px',
                'width': (this.pWidth) + 'px',
                'top': (this.pMarginTop + this.highlightY1 - 0.5) + 'px',
                'left': (this.pMarginLeft) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightY2 !== null"  
            :style="{
                'height': '1px',
                'width': (this.pWidth) + 'px',
                'top': (this.pMarginTop + this.highlightY2 - 0.5) + 'px',
                'left': (this.pMarginLeft) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
                <tr>
                    <th>Chromosome</th>
                    <td>{{ this.tooltipInfo.chromosome }}</td>
                </tr>
                <tr>
                    <th>Position</th>
                    <td>{{ this.tooltipInfo.position }}</td>
                </tr>
                <tr>
                    <th>{{ this._yScale.name }}</th>
                    <td>{{ this.tooltipInfo.y }}</td>
                </tr>
                <tr v-if="this.hasC">
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import { scaleLinear as d3_scaleLinear, scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE, BAR_HEIGHT_MIN, BAR_MARGIN_Y_DEFAULT } from './../../constants.js';
import { getRetinaRatio, getDelaunay } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import GenomeScale from './../../scales/GenomeScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} g The genome-scale variable key.
 * @prop {string} c The event color-scale variable key. Takes precedence over eventColor prop.
 * @prop {string} y The y-scale variable key.
 * @prop {string} chromosomeVariable The axis chromosome variable key. Default: "chromosome"
 * @prop {string} positionVariable The axis position variable key. Default: "position"
 * @prop {number} eventWidth The width of each observation rectangle. Default: 4
 * @prop {string} eventColor The color of each observation. Default: "#000000". 
 * @prop {string} backgroundColor The background color of the track. Optional.
 * @prop {string} lineColor The background color of the track. Optional.
 * @prop {number} barMarginY The value for the vertical margin between bars. Default: 2
 * // TODO: bar padding
 * @extends mixin
 * 
 * @example
 * <GenomeMultiTrackPlot
 *      data="rand_genome_multi_data"
 *      g="genome" 
 *      y="sample_id"
 *      c="event_type"
 *      :pWidth="500"
 *      :pHeight="40"
 *      :pMarginTop="10"
 *      :pMarginLeft="10"
 *      :pMarginRight="10"
 *      :pMarginBottom="150"
 *      :getData="getData"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *      :clickHandler="myClickHandler"
 * />
 */
export default {
    name: 'GenomeMultiTrackPlot',
    mixins: [mixin],
    props: {
        'g': { // genome
            required: true,
            type: String
        },
        'y': {
            required: true,
            type: String
        },
        'c': { // event color
            required: false,
            type: String
        },
        'chromosomeVariable': {
            type: String,
            default: "chromosome"
        },
        'positionVariable': {
            type: String,
            default: "position"
        },
        'eventWidth': {
            type: Number,
            default: 4
        },
        'eventColor': {
            type: String,
            default: "#aaa"
        },
        'backgroundColor': {
            required: false,
            type: String
        },
        'lineColor': {
            required: false,
            type: String
        },
        'barMarginY': {
            type: Number, 
            default: BAR_MARGIN_Y_DEFAULT
        }
    },
    data() {
        return {
            hasC: false,
            tooltipInfo: {
                chromosome: '',
                position: '',
                c: '',
                y: ''
            },
            highlightGScales: null,
            highlightYScale: null,
            highlightX1: null,
            highlightY1: null,
            highlightY2: null,
            barHeight: 0
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        // Set data
        this._dataContainer = this.getData(this.data);
        console.assert(this._dataContainer instanceof DataContainer);
        // Set scale variables
        this._gScale = this.getScale(this.g);
        this._yScale = this.getScale(this.y);

        console.assert(this._gScale instanceof GenomeScale);
        console.assert(this._yScale instanceof AbstractScale);
        
        // Make assertions, but keep c scale optional
        if(this.c !== undefined) {
            this.hasC = true;
            this._cScale = this.getScale(this.c);
            console.assert(this._cScale instanceof AbstractScale);
            this._cScale.onUpdate(this.uuid, this.drawPlot);
        }
        
        // Subscribe to event publishers here
        this._gScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._gScale.onHighlight(this.uuid, this.highlightG);
        this._gScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

        this._yScale.onHighlight(this.uuid, this.highlightY);
        this._yScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._yScale.onUpdate(this.uuid, null);
        this._gScale.onUpdate(this.uuid, null);
        if(this.hasC) {
            this._cScale.onUpdate(this.uuid, null);
        }

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._yScale.onHighlight(this.uuid, null);
        this._yScale.onHighlightDestroy(this.uuid, null);

        this._gScale.onHighlight(this.uuid, null);
        this._gScale.onHighlightDestroy(this.uuid, null);
    },
    methods: {
        tooltip: function(mouseX, mouseY, chromosome, position, y, c) {
            // Set values
            this.tooltipInfo.chromosome = chromosome;
            this.tooltipInfo.position = position.toLocaleString();
            this.tooltipInfo.y = this._yScale.toHuman(y);

            if(this.hasC) {
                this.tooltipInfo.c = this._cScale.toHuman(c);
            }
            // Set position
            this.tooltipPosition.left = mouseX + this.pMarginLeft;
            this.tooltipPosition.top = mouseY + this.pMarginTop;
            
            // Dispatch highlights
            this._gScale.emitHighlight(chromosome, position);
            this._yScale.emitHighlight(y);
            if(this.hasC) {
                this._cScale.emitHighlight(c);
            }
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._gScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
            if(this.hasC) {
                this._cScale.emitHighlightDestroy();
            }
        },
        highlightG(chromosome, position) {
            this.highlightX1 = this.highlightGScales[chromosome](position);
        },
        highlightY(val) {
            this.highlightY1 = this.highlightYScale(val);
            this.highlightY2 = this.highlightYScale(val) + this.barHeight;
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightY1 = null;
            this.highlightY2 = null;
        },
        drawPlot() {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._yScale.isLoading || (vm.hasC && vm._cScale.isLoading)) {
                return;
            }
            
            let data = vm._dataContainer.dataCopy;

            let cScale;
            if(this.hasC) {
                cScale = this._cScale;
            }
            const gScale = this._gScale;
            const yScale = this._yScale;

            let chromosomes = gScale.chromosomesFiltered;

            data = data.filter((d) => chromosomes.includes(d[vm.chromosomeVariable]));
            data = data.filter((d) => yScale.domainFiltered.includes(d[vm.y]));

            const g = {};
            
            let domains = gScale.getDomainsFiltered();
            let chromosomeRatios = gScale.getChromosomeRatiosFiltered();
            let chromosomeRatiosCumulative = gScale.getChromosomeRatiosCumulativeFiltered();

            for(let i = 0; i < chromosomeRatios.length; i++) {
                let currChromosome = chromosomes[i];
                let currDomain = domains[i];
                let currRatio = chromosomeRatios[i];
                let currRatioCumulative = chromosomeRatiosCumulative[i];
                g[currChromosome] = d3_scaleLinear()
                    .domain(currDomain)
                    .range([vm.pWidth * currRatioCumulative, vm.pWidth * (currRatioCumulative + currRatio)]);
            }

            vm.highlightGScales = g;

            const y = d3_scaleBand()
                .domain(yScale.domainFiltered.slice().reverse())
                .range([vm.pHeight, 0]);

            vm.highlightYScale = y;

            const barHeight = vm.pHeight / yScale.domainFiltered.length;
            vm.barHeight = barHeight;
              
            
            /*
             * Scale up the canvas
             */
            const canvas = d3_select(this.plotSelector);
            const context = canvas.node().getContext('2d');

          
            const ratio = getRetinaRatio(context);
            const scaledWidth = vm.pWidth * ratio;
            const scaledHeight = vm.pHeight * ratio;

            canvas
                .attr("width", scaledWidth)
                .attr("height", scaledHeight);
            context.scale(ratio, ratio);

   
           
            /*
             * Draw the track
             */
            let barMarginY = vm.barMarginY;
            if(barHeight - vm.barMarginY <= BAR_HEIGHT_MIN) {
                barMarginY = 0;
            }
            // Draw track backgrounds
            yScale.domainFiltered.forEach((yVal) => {
                if(vm.backgroundColor !== undefined) {
                    context.fillStyle = vm.backgroundColor;
                    context.fillRect(0, y(yVal) + (barMarginY/2), vm.pWidth, barHeight - barMarginY);
                }
                if(vm.lineColor !== undefined) {
                    context.fillStyle = vm.lineColor;
                    context.fillRect(0, y(yVal) + (barHeight/2) - 0.5, vm.pWidth, 1);
                }
            });
            // Draw events
            data.forEach((d) => {
                if(this.hasC) {
                    context.fillStyle = cScale.color(d[vm.c]);
                } else {
                    context.fillStyle = vm.eventColor;
                }

                const xVal = g[d[vm.chromosomeVariable]](d[vm.positionVariable]) - (vm.eventWidth/2);
                const yVal = y(d[vm.y]);
                context.fillRect(xVal, yVal + (barMarginY/2), vm.eventWidth, barHeight - barMarginY);
            });

            /*
             * Prepare for interactivity
             */
            // TODO: remove this offset thing once delaunay library is fixed
            const points = data.map((d) => [g[d[vm.chromosomeVariable]](d[vm.positionVariable]), y(d[vm.y])]);
            const delaunay = getDelaunay(points, true);
            
            /*
             * Listen for mouse events
             */
            const canvasNode = canvas.node();

            const getDataFromMouse = (mouseX, mouseY) => {
                const i = delaunay.find(mouseX, mouseY);
                return data[i];
            };

            const debouncedTooltipDestroy = debounce(vm.tooltipDestroy, TOOLTIP_DEBOUNCE);
            canvas.on("mousemove", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                const node = getDataFromMouse(mouseX, mouseY);

                if(node) {
                    vm.tooltip(mouseX, mouseY, node[vm.chromosomeVariable], node[vm.positionVariable], node[vm.y], node[vm.c]); 
                } else {
                    debouncedTooltipDestroy();
                }
            })
            .on("mouseleave", vm.tooltipDestroy);

            if(vm.clickHandler !== undefined) {
                canvas.on("click", () => {
                    const mouse = d3_mouse(canvasNode);
                    const mouseX = mouse[0];
                    const mouseY = mouse[1];

                    const node = getDataFromMouse(mouseX, mouseY);

                    if(node) {
                        vm.clickHandler(node[vm.chromosomeVariable], node[vm.positionVariable], node[vm.y], node[vm.c]);
                    }
                });
            }
            
        }
    }
}
</script>

<style>
@import '../../style/plot-style.css';
</style>