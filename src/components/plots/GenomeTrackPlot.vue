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
        <canvas 
            :id="this.hiddenPlotElemID" 
            class="vdp-plot-hidden" 
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': (this.pWidth) + 'px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft) + 'px'
            }"
        ></canvas>
        <div :style="{
                'display': (showHighlight ? 'inline-block' : 'none'),
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX1) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div :style="{
                'display': (showHighlight ? 'inline-block' : 'none'),
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX2) + 'px'
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
                <tr v-if="this.hasC">
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
                <tr v-if="this.hasT">
                    <th>{{ this._tScale.name }}</th>
                    <td>{{ this.tooltipInfo.t }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import GenomeScale from './../../scales/GenomeScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} g The genome-scale variable key.
 * @prop {string} c The event color-scale variable key.
 * @prop {string} t The track background color-scale variable key.
 * @prop {string} chromosomeVariable The axis chromosome variable key. Default: "chromosome"
 * @prop {string} positionVariable The axis position variable key. Default: "position"
 * @extends mixin
 * 
 * @example
 * <GenomeTrackPlot
 *      data="rand_genome_data"
 *      g="genome" 
 *      c="event_type"
 *      t="proj_id"
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
    name: 'GenomeTrackPlot',
    mixins: [mixin],
    props: {
        'g': {
            type: String // genome
        },
        'c': {
            type: String // event color
        },
        't': {
            type: String // track background color
        },
        'chromosomeVariable': {
            type: String,
            default: "chromosome"
        },
        'positionVariable': {
            type: String,
            default: "position"
        }
    },
    data() {
        return {
            hasT: true,
            hasC: true,
            tooltipInfo: {
                chromosome: '',
                position: '',
                c: '',
                t: ''
            },
            highlightGScales: null,
            highlightX1: 0,
            highlightX2: 0,
            eventWidth: 0
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
        this._tScale = this.getScale(this.t);
        this._cScale = this.getScale(this.c);
        // Make assertions, but keep c and t scales optional
        if(this._tScale === undefined) {
            this.hasT = false;
        } else {
            console.assert(this._tScale instanceof AbstractScale);
            this._tScale.onUpdate(this.uuid, this.drawPlot);
        }
        if(this._cScale === undefined) {
            this.hasC = false;
        } else {
            console.assert(this._cScale instanceof AbstractScale);
            this._cScale.onUpdate(this.uuid, this.drawPlot);
        }
        console.assert(this._gScale instanceof GenomeScale);
        

        // Subscribe to event publishers here
        this._gScale.onUpdate(this.uuid, this.drawPlot);


        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._gScale.onHighlight(this.uuid, this.highlightG);
        this._gScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

        // TODO subscribe to other highlights?
    },
    mounted() {
        this.drawPlot();
    },
    methods: {
        tooltip: function(mouseX, mouseY, chromosome, position, c, t) {
            // Set values
            this.tooltipInfo.chromosome = chromosome;
            this.tooltipInfo.position = position.toLocaleString();

            if(this.hasC) {
                this.tooltipInfo.c = this._cScale.toHuman(c);
            }
            if(this.hasT) {
                this.tooltipInfo.t = this._tScale.toHuman(t);
            }

            // Set position
            this.tooltipPosition.left = mouseX + this.pMarginLeft;
            this.tooltipPosition.top = mouseY + this.pMarginTop;
            
            // Dispatch highlights
            this._gScale.emitHighlight(chromosome, position);
            if(this.hasT) {
                this._tScale.emitHighlight(t);
            }
            if(this.hasC) {
                this._cScale.emitHighlight(c);
            }
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._gScale.emitHighlightDestroy();
            if(this.hasT) {
                this._tScale.emitHighlightDestroy();
            }
            if(this.hasC) {
                this._cScale.emitHighlightDestroy();
            }
        },
        highlightG(chromosome, position) {
            this.highlightX1 = this.highlightGScales[chromosome](position);
            this.highlightX2 = this.highlightGScales[chromosome](position) + this.eventWidth; 
            this.showHighlight = true;
        },
        highlightDestroy() {
            this.showHighlight = false;
        },
        drawPlot() {
            const vm = this;
            
            let data = this._dataContainer.dataCopy;
            let tScale, cScale;
            if(this.hasT) {
                tScale = this._tScale;
            }
            if(this.hasC) {
                cScale = this._cScale;
            }
            const gScale = this._gScale;

            let chromosomes = gScale.chromosomesFiltered;

            data = data.filter((d) => chromosomes.includes(d[vm.chromosomeVariable]));


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

            const eventWidth = 5;
            vm.eventWidth = eventWidth;
              
            
            /*
             * Scale up the canvas
             */
            const canvas = d3_select(this.plotSelector);
            const context = canvas.node().getContext('2d');

            const canvasHidden = d3_select(this.hiddenPlotSelector);
            const contextHidden = canvasHidden.node().getContext('2d');

            const ratio = getRetinaRatio(context);
            const scaledWidth = vm.pWidth * ratio;
            const scaledHeight = vm.pHeight * ratio;

            canvas
                .attr("width", scaledWidth)
                .attr("height", scaledHeight);
            context.scale(ratio, ratio);

            canvasHidden
                .attr("width", scaledWidth)
                .attr("height", scaledHeight);
            contextHidden.scale(ratio, ratio);

            /*
             * Set up the color mappings
             */
            const colToNode = {};

            /*
             * Generates the next color in the sequence, 
             * going from 0,0,0 to 255,255,255.
             */
            let nextCol = 1;
            const genColor = () => {
                let ret = [];
                // via http://stackoverflow.com/a/15804183
                if(nextCol < 16777215){
                    ret.push(nextCol & 0xff); // R
                    ret.push((nextCol & 0xff00) >> 8); // G 
                    ret.push((nextCol & 0xff0000) >> 16); // B

                    nextCol += 20;
                }
                let col = "rgb(" + ret.join(',') + ")";
                return col;
            }

            /*
             * Draw the track
             */

            // TODO fill the background rect for the track

            data.forEach((d) => {
                const col = genColor();
                colToNode[col] = { 
                    "chromosome": d[vm.chromosomeVariable], 
                    "position": d[vm.positionVariable], 
                    "c": d[vm.c],
                    "t": d[vm.t]
                };

                contextHidden.fillStyle = col;
                if(this.hasC) {
                    context.fillStyle = cScale.color(d[vm.c]);
                } else {
                    context.fillStyle = "#000000";
                }

            

                const xVal = g[d[vm.chromosomeVariable]](d[vm.positionVariable]);
                context.fillRect(xVal, 0, eventWidth, vm.pHeight);
                contextHidden.fillRect(xVal, 0, eventWidth, vm.pHeight);
            });
            
            /*
             * Listen for mouse events
             */
            const canvasNode = canvas.node();

            const getDataFromMouse = (mouseX, mouseY) => {
                // Get the corresponding pixel color on the hidden canvas
                const col = contextHidden.getImageData(mouseX * ratio, mouseY * ratio, scaledWidth, scaledHeight).data;
                const colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
                // Look up the node in our map
                return colToNode[colString];
            };

            const debouncedTooltipDestroy = debounce(vm.tooltipDestroy, TOOLTIP_DEBOUNCE);
            canvas.on("mousemove", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                const node = getDataFromMouse(mouseX, mouseY);

                if(node) {
                    vm.tooltip(mouseX, mouseY, node["chromosome"], node["position"], node["c"], node["t"]); 
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
                        vm.clickHandler(node["chromosome"], node["position"], node["c"], node["t"]);
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