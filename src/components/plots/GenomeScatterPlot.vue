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
                <tr>
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Two from '../../two.js';
import { scaleLinear as d3_scaleLinear, scaleLog as d3_scaleLog } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getDelaunay } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import GenomeScale from './../../scales/GenomeScale.js';

import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} g The genome-scale variable key.
 * @prop {string} y The y-scale variable key.
 * @prop {string} c The color-scale variable key.
 * @prop {string} chromosomeVariable The axis chromosome variable key. Default: "chromosome"
 * @prop {string} positionVariable The axis position variable key. Default: "position"
 * @prop {boolean} logY Whether to have log scaled y. Default: false
 * @extends mixin
 * 
 * @example
 * <GenomeScatterPlot
 *      data="rainfall_data"
 *      g="genome" 
 *      y="mut_dist"
 *      c="category"
 *      :pWidth="500"
 *      :pHeight="300"
 *      :pMarginTop="10"
 *      :pMarginLeft="120"
 *      :pMarginRight="10"
 *      :pMarginBottom="150"
 *      :getData="getData"
 *      :getScale="getScale"
 *      :clickHandler="myClickHandler"
 * />
 */
export default {
    name: 'GenomeScatterPlot',
    mixins: [mixin],
    props: {
        'g': {
            type: String // genome
        },
        'y': {
            type: String
        },
        'c': {
            type: String // color
        },
        'chromosomeVariable': {
            type: String,
            default: "chromosome"
        },
        'positionVariable': {
            type: String,
            default: "position"
        },
        'logY': {
            type: Boolean,
            default: false
        }
        // TODO: allow optional dot size, dot shape variable
        // TODO: allow specification of filled dots, static dot stroke/fill, etc...
    },
    data() {
        return {
            tooltipInfo: {
                chromosome: '',
                position: '',
                y: '',
                c: ''
            },
            highlightGScales: null,
            highlightYScale: null,
            highlightX1: null,
            highlightY1: null
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
        this._cScale = this.getScale(this.c);
        console.assert(this._gScale instanceof GenomeScale);
        console.assert(this._yScale instanceof AbstractScale);
        console.assert(this._cScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._gScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        this._cScale.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._gScale.onHighlight(this.uuid, this.highlightG);
        this._gScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

        this._yScale.onHighlight(this.uuid, this.highlightY);
        this._yScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

        // TODO: subscribe to color scale highlights??
    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._yScale.onUpdate(this.uuid, null);
        this._gScale.onUpdate(this.uuid, null);
        this._cScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._yScale.onHighlight(this.uuid, null);
        this._yScale.onHighlightDestroy(this.uuid, null);

        this._gScale.onHighlight(this.uuid, null);
        this._gScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        logY() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, chromosome, position, y, c) {
            // Set values
            this.tooltipInfo.chromosome = chromosome;
            this.tooltipInfo.position = position.toLocaleString();

            this.tooltipInfo.y = this._yScale.toHuman(y);
            this.tooltipInfo.c = this._cScale.toHuman(c);

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._gScale.emitHighlight(chromosome, position);
            this._yScale.emitHighlight(y);
            this._cScale.emitHighlight(c);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._gScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
            this._cScale.emitHighlightDestroy();
        },
        highlightG(chromosome, position) {
            this.highlightX1 = this.highlightGScales[chromosome](position);
        },
        highlightY(value) {
            this.highlightY1 = this.highlightYScale(value);
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightY1 = null;
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._cScale.isLoading || vm._yScale.isLoading) {
                return;
            }
            
            let data = vm._dataContainer.dataCopy;

            const cScale = vm._cScale;
            const yScale = vm._yScale;
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

            let yScaleFunc = d3_scaleLinear;
            if(vm.logY) {
                yScaleFunc = d3_scaleLog;
            }
            
            const y = yScaleFunc()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            // TODO: figure out option for scale log

            vm.highlightYScale = y;
            
            
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

            if(!canvasNode) {
                return;
            }

            const two = new Two({ 
                width: vm.pWidth, 
                height: vm.pHeight, 
                domElement: canvasNode
            });

            if(!d3Node && data.length === 0) {
                canvas.on("mousemove", () => {});
                canvas.on("mouseleave", () => {});
                return;
            }


            /*
             * Draw the points
             */
            data.forEach((d) => {
                const circle = two.makeCircle(g[d[vm.chromosomeVariable]](d[vm.positionVariable]), y(d[vm.y]), 3);
                circle.fill = cScale.color(d[vm.c]);
                circle.noStroke();
            });

            two.update();

            if(d3Node) {
                /* Ignore interactivity if SVG was passed in (for download). */
                return;
            }

            /*
             * Prepare for interactivity
             */
            const points = data.map((d) => [g[d[vm.chromosomeVariable]](d[vm.positionVariable]), y(d[vm.y])]);
            const delaunay = getDelaunay(points, false);
            
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
                    vm.tooltip(mouseViewportX, mouseViewportY, node[vm.chromosomeVariable], node[vm.positionVariable], node[vm.y], node[vm.c]); 
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