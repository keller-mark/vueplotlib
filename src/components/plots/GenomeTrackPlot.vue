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
            </table>
        </div>
    </div>
</template>

<script>
import Two from 'two.js';
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE, GENOME_EVENT_COLOR_DEFAULT } from './../../constants.js';
import { getDelaunay } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import GenomeScale from './../../scales/GenomeScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} g The genome-scale variable key.
 * @prop {string} c The event color-scale variable key. Takes precedence over eventColor prop.
 * @prop {string} chromosomeVariable The axis chromosome variable key. Default: "chromosome"
 * @prop {string} positionVariable The axis position variable key. Default: "position"
 * @prop {number} eventWidth The width of each observation rectangle. Default: 4
 * @prop {string} eventColor The color of each observation. Default: "#000000". 
 * @prop {string} backgroundColor The background color of the track. Optional.
 * @prop {string} lineColor The background color of the track. Optional.
 * @extends mixin
 * 
 * @example
 * <GenomeTrackPlot
 *      data="rand_genome_data"
 *      g="genome" 
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
    name: 'GenomeTrackPlot',
    mixins: [mixin],
    props: {
        'g': { // genome
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
            default: GENOME_EVENT_COLOR_DEFAULT
        },
        'backgroundColor': {
            required: false,
            type: String
        },
        'lineColor': {
            required: false,
            type: String
        }
    },
    data() {
        return {
            hasC: true,
            tooltipInfo: {
                chromosome: '',
                position: '',
                c: ''
            },
            highlightGScales: null,
            highlightX1: null
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
        this._cScale = this.getScale(this.c);
        // Make assertions, but keep c scale optional
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
    beforeDestroy() {
        // Unsubscribe to events
        this._gScale.onUpdate(this.uuid, null);
        if(this.hasC) {
            this._cScale.onUpdate(this.uuid, null);
        }

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._gScale.onHighlight(this.uuid, null);
        this._gScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        eventWidth() {
            this.drawPlot();
        },
        eventColor() {
            this.drawPlot();
        },
        backgroundColor() {
            this.drawPlot();
        },
        lineColor() {
            this.drawPlot();
        },
    },
    methods: {
        tooltip: function(mouseX, mouseY, chromosome, position, c) {
            // Set values
            this.tooltipInfo.chromosome = chromosome;
            this.tooltipInfo.position = position.toLocaleString();

            if(this.hasC) {
                this.tooltipInfo.c = this._cScale.toHuman(c);
            }

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._gScale.emitHighlight(chromosome, position);
            if(this.hasC) {
                this._cScale.emitHighlight(c);
            }
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._gScale.emitHighlightDestroy();
            if(this.hasC) {
                this._cScale.emitHighlightDestroy();
            }
        },
        highlightG(chromosome, position) {
            this.highlightX1 = this.highlightGScales[chromosome](position);
        },
        highlightDestroy() {
            this.highlightX1 = null;
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainer.isLoading || (vm.hasC && vm._cScale.isLoading)) {
                return;
            }
            
            let data = this._dataContainer.dataCopy;

            let cScale;
            if(vm.hasC) {
                cScale = vm._cScale;
            }
            const gScale = vm._gScale;

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
              
            
            /*
             * Scale up the canvas
             */
            let canvas;
            if(d3Node) {
                canvas = d3Node;
            } else {
                canvas = d3_select(this.plotSelector);
            }

            const canvasNode = canvas.node();

            const two = new Two({ 
                width: vm.pWidth, 
                height: vm.pHeight, 
                domElement: canvasNode
            });


            /*
             * Draw the track
             */
            if(vm.backgroundColor !== undefined) {
                const trackRect = two.makeRectangle(0 + vm.pWidth/2, 0 + vm.pHeight/2, vm.pWidth, vm.pHeight);
                trackRect.fill = vm.backgroundColor;
                trackRect.noStroke();
            }

            if(vm.lineColor !== undefined) {
                const trackLineRect = two.makeRectangle(0 + vm.pWidth/2, vm.pHeight/2, vm.pWidth, 1);
                trackLineRect.fill = vm.lineColor;
                trackLineRect.noStroke();
            }

            data.forEach((d) => {
                const xVal = g[d[vm.chromosomeVariable]](d[vm.positionVariable]) - (vm.eventWidth/2);
                const eventRect = two.makeRectangle(xVal + vm.eventWidth/2, 0 + vm.pHeight/2, vm.eventWidth, vm.pHeight);
                if(this.hasC) {
                    eventRect.fill = cScale.color(d[vm.c]);
                } else {
                    eventRect.fill = vm.eventColor;
                }
                eventRect.noStroke();
            });

            two.update();

            if(d3Node) {
                /* Ignore interactivity if SVG was passed in (for download). */
                return;
            }

            /*
             * Prepare for interactivity
             */
            // TODO: remove this offset thing once delaunay library is fixed
            const points = data.map((d) => [g[d[vm.chromosomeVariable]](d[vm.positionVariable]), (vm.pHeight / 2)]);
            const delaunay = getDelaunay(points, true);
            
            /*
             * Listen for mouse events
             */
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

                const mouseViewportX = d3_event.clientX;
                const mouseViewportY = d3_event.clientY;

                if(node) {
                    vm.tooltip(mouseViewportX, mouseViewportY, node[vm.chromosomeVariable], node[vm.positionVariable], node[vm.c]); 
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
                        vm.clickHandler(node[vm.chromosomeVariable], node[vm.positionVariable], node[vm.c]);
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