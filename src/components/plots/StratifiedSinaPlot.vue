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
        <div v-show="this.highlightX2 !== null"
            :style="{
                'display': (showHighlight ? 'inline-block' : 'none'),
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX2 - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightY1 !== null"
            :style="{
                'display': (showHighlight ? 'inline-block' : 'none'),
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
                    <th>{{ this._xScale.name }}</th>
                    <td>{{ this.tooltipInfo.x }}</td>
                </tr>
                <tr>
                    <th>Count</th>
                    <td>{{ this.tooltipInfo.count }}</td>
                </tr>
                <tr>
                    <th>Min</th>
                    <td>{{ this.tooltipInfo.min }}</td>
                </tr>
                <tr>
                    <th>Q1</th>
                    <td>{{ this.tooltipInfo.q1 }}</td>
                </tr>
                <tr>
                    <th>Median</th>
                    <td>{{ this.tooltipInfo.median }}</td>
                </tr>
                <tr>
                    <th>Mean</th>
                    <td>{{ this.tooltipInfo.mean }}</td>
                </tr>
                <tr>
                    <th>Q3</th>
                    <td>{{ this.tooltipInfo.q3 }}</td>
                </tr>
                <tr>
                    <th>Max</th>
                    <td>{{ this.tooltipInfo.max }}</td>
                </tr>
            </table>
            <table :style="{'border-top': '1px solid #cdcdcd'}">
                <tr>
                    <th>{{ this._oScale.name }}</th>
                    <td>{{ this.tooltipInfo.o }}</td>
                </tr>
                <tr>
                    <th>{{ this._yScale.name }}</th>
                    <td>{{ this.tooltipInfo.y }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Two from 'two.js';
import { scaleLinear as d3_scaleLinear, scaleQuantile as d3_scaleQuantile, scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { min as d3_min, max as d3_max, mean as d3_mean, histogram as d3_histogram } from 'd3-array';

import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { seededRandom, getDelaunay } from './../../helpers.js';


import AbstractScale from './../../scales/AbstractScale.js';
import CategoricalScale from './../../scales/CategoricalScale.js';
import ContinuousScale from './../../scales/ContinuousScale.js';


import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} variable The key to access the values in the data array objects.
 * @prop {string} s The key for the data containing the variable to stratify by.
 * @prop {string} x The key for the scale to stratify by. Must be categorical.
 * @prop {string} y The y-scale variable key.
 * @prop {string} o The observation-scale variable key. Required in order to match with the stratification data.
 * @prop {number} pointSize The diameter of points. Default: 3
 * @prop {number} seed A random seed. Optional.
 * @prop {boolean} fillPoints Whether to fill points. Default: true
 * @prop {string} strokeColor Color for point outlines. Optional. Will override the x color scale if provided.
 * @extends mixin
 * 
 * @example
 * <StratifiedSinaPlot
 *      data="boxplot_data"
 *      variable="COSMIC 1"
 *      s="stratification_data"
 *      y="exposure"
 *      o="sample_id"
 *      x="smoking_binary"
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
    name: 'StratifiedSinaPlot',
    mixins: [mixin],
    props: {
        'variable': {
            type: String
        },
        's': { // stratification data
            type: String
        },
        'x': { // stratification variable scale
            type: String
        },
        'y': {
            type: String
        },
        'o': { // observation
            type: String
        },
        'pointSize': {
            type: Number,
            default: 3
        },
        'seed': {
            type: Number,
            default: 1
        },
        'fillPoints': {
            type: Boolean,
            default: true
        },
        'strokeColor': {
            type: String
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                count: '',
                min: '',
                q1: '',
                median: '',
                mean: '',
                q3: '',
                max: ''
            },
            highlightX1: null,
            highlightX2: null,
            highlightXScale: null,
            highlightY1: null,
            highlightYScale: null,
            barWidth: 0
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

        this._stratificationDataContainer = this.getData(this.s);
        console.assert(this._stratificationDataContainer instanceof DataContainer);

        // Set scale variables
        this._yScale = this.getScale(this.y);
        console.assert(this._yScale instanceof ContinuousScale);

        this._xScale = this.getScale(this.x);
        console.assert(this._xScale instanceof CategoricalScale);

        this._oScale = this.getScale(this.o);
        console.assert(this._oScale instanceof AbstractScale);


        // Subscribe to event publishers here
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._oScale.onUpdate(this.uuid, this.drawPlot);
        

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);
        this._stratificationDataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._xScale.onHighlight(this.uuid, this.highlightX);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

        this._yScale.onHighlight(this.uuid, this.highlightY);
        this._yScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._yScale.onUpdate(this.uuid, null);
        this._xScale.onUpdate(this.uuid, null);
        this._oScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);
        this._stratificationDataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);

        this._yScale.onHighlight(this.uuid, null);
        this._yScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        pointSize() {
            this.drawPlot();
        },
        fillPoints() {
            this.drawPlot();
        },
        strokeColor() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, node) {

            this.tooltipInfo.o = this._oScale.toHuman(node.o);
            this.tooltipInfo.y = this._yScale.toHuman(node.y);

            let xNode = node.xNode;
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(xNode.x);
            this.tooltipInfo.count = xNode.count;
            this.tooltipInfo.min = xNode.min;
            this.tooltipInfo.q1 = xNode.q1;
            this.tooltipInfo.median = xNode.median;
            this.tooltipInfo.mean = xNode.mean;
            this.tooltipInfo.q3 = xNode.q3;
            this.tooltipInfo.max = xNode.max;

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;

            // Dispatch highlights
            this._xScale.emitHighlight(xNode.x);
            this._yScale.emitHighlight(node.y);
            this._oScale.emitHighlight(node.o);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
            this._oScale.emitHighlightDestroy();
        },
        highlightX(value) {
            if(this.highlightXScale) {
                this.highlightX1 = this.highlightXScale(value);
                this.highlightX2 = this.highlightXScale(value) + this.barWidth;
            }
        },
        highlightY(value) {
            if(this.highlightYScale) {
                this.highlightY1 = this.highlightYScale(value);
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightX2 = null;
            this.highlightY1 = null;
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._stratificationDataContainer.isLoading || vm._xScale.isLoading || vm._yScale.isLoading || vm._oScale.isLoading) {
                return;
            }
            
            let data = this._dataContainer.dataCopy;
            let stratificationData = this._stratificationDataContainer.dataCopy;

            const xScale = vm._xScale;
            const yScale = vm._yScale;

            const oScale = vm._oScale;
            data = data.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            vm.highlightXScale = x;
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            vm.highlightYScale = y;

            const barWidth = vm.pWidth / xScale.domainFiltered.length;
            vm.barWidth = barWidth;
            
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
             * Get the random number generator.
             */
            const random = seededRandom(vm.seed);

            /*
             * Prepare for interactivity
             */
            const points = [];
            const pointsData = [];

            /*
             * Draw the boxes
             */

            const boxWidth = (barWidth / 2);
            const boxMargin = barWidth / 4;

            xScale.domainFiltered.forEach((boxVar) => {
                let boxData = data.filter((dEl) => {
                    let sEl = stratificationData.find((sEl) => sEl[vm.o] === dEl[vm.o]);
                    return (sEl !== undefined && sEl[vm.x] === boxVar);
                });
                let boxDataValues = boxData.map((el) => el[vm.variable] || 0);
                let quantile = d3_scaleQuantile()
                    .domain(boxDataValues)
                    .range([0, 1, 2, 3]);
                
                let quartiles = quantile.quantiles();
                
                let q1 = quartiles[0];
                let median = quartiles[1];
                let mean = d3_mean(boxDataValues);
                let q3 = quartiles[2];
                
                let boxX1 = x(boxVar) + boxMargin;
                let boxX2 = boxX1 + boxWidth;

                // Draw the points
                let histogram = d3_histogram()
                    .domain(yScale.domainFiltered)
                    .value((d) => d[vm.variable] || 0);
                
                let bins = histogram(boxData);
                let maxBinLength = d3_max(bins, (d) => d.length);
                let innerX = d3_scaleLinear().domain([-maxBinLength, maxBinLength]).range([boxX1, boxX2]);
                let innerXZero = innerX(0);

                let xNode = {
                    x: boxVar,
                    count: boxDataValues.length,
                    min: d3_min(boxDataValues), 
                    q1: q1,
                    median: median,
                    mean: mean,
                    q3: q3, 
                    max: d3_max(boxDataValues)
                };

                bins.forEach((binData) => {
                    binData.forEach((d) => {
                        const xVal = innerX(-binData.length)+random()*2*(innerX(binData.length)-innerXZero);
                        const yVal = y(d[vm.variable]);
                        
                        const circle = two.makeCircle(xVal, yVal, vm.pointSize);
                        circle.stroke = (vm.strokeColor ? vm.strokeColor : xScale.color(boxVar));
                        circle.fill = xScale.color(boxVar);
                        circle.linewidth = 0.5;

                        if(!vm.fillPoints) {
                            circle.noFill();
                        }


                        points.push([xVal, yVal]); // For Delaunay
                        pointsData.push({
                            'xNode': xNode,
                            'y': d[vm.variable],
                            'o': d[vm.o]
                        });
                    });
                });
            });

            two.update();

            if(d3Node) {
                /* Ignore interactivity if SVG was passed in (for download). */
                return;
            }
            
            const delaunay = getDelaunay(points, false);

            /*
             * Listen for mouse events
             */
            const getDataFromMouse = (mouseX, mouseY) => {
                const i = delaunay.find(mouseX, mouseY);
                return pointsData[i];
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
                    vm.tooltip(mouseViewportX, mouseViewportY, node); 
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
                        vm.clickHandler(node['o'], node['y'], node['xNode']['x']);
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