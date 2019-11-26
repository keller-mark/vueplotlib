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
        <div v-show="this.highlightX1Secondary !== null"
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX1Secondary - 0.5) + 'px'
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
                    <th>{{ this._oScale.name }}</th>
                    <td>{{ this.tooltipInfo.o }}</td>
                </tr>
                <tr>
                    <th>{{ this._xScale.name }}</th>
                    <td>{{ this.tooltipInfo.x }}</td>
                </tr>
                <tr>
                    <th>{{ this._x2Scale.name }}</th>
                    <td>{{ this.tooltipInfo.x2 }}</td>
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
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio, getDelaunay } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import ContinuousScale from './../../scales/ContinuousScale.js';

import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} variable The key to access the values in the data array objects.
 * @prop {string} s The key for the data containing the variable to stratify by.
 * @prop {string} x The x-scale variable key. Must be continuous.
 * @prop {string} s2 The key for the data containing the secondary variable to stratify by.
 * @prop {string} x2 The secondary x-scale variable key.
 * @prop {string} y The y-scale variable key. Must be continuous.
 * @prop {string} o The observation-scale variable key. Required in order to match with the stratification data.
 * @prop {boolean} fillPoints Whether or not to fill points. Default: false
 * @prop {number} pointSize Default size for points. Default: 3
 * @prop {string} strokeColor Color for point outlines. Optional. Will override the x color scale if provided.
 * @extends mixin
 * 
 * @example
 * <StratifiedScatterPlot
 *      data="exposures_data"
 *      variable="COSMIC 1"
 *      s="clinical_data"
 *      y="cosmic_1_exposure"
 *      o="sample_id"
 *      x="age"
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
    name: 'DoubleStratifiedScatterPlot',
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
        's2': { // stratification data 2
            type: String
        },
        'x2': { // stratification variable scale 2
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
        'fillPoints': {
            type: Boolean,
            default: false
        },
        'strokeColor': {
            type: String
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                x2: '',
                y: '',
                o: ''
            },
            highlightX1: null,
            highlightX1Secondary: null,
            highlightY1: null,
            highlightXScale: null,
            highlightXScaleSecondary: null,
            highlightXScaleSecondaryAll: null,
            highlightYScale: null
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

        this._stratificationDataContainer2 = this.getData(this.s2);
        console.assert(this._stratificationDataContainer2 instanceof DataContainer);

        // Set scale variables
        this._yScale = this.getScale(this.y);
        console.assert(this._yScale instanceof ContinuousScale);

        this._xScale = this.getScale(this.x);
        console.assert(this._xScale instanceof ContinuousScale);

        this._x2Scale = this.getScale(this.x2);
        console.assert(this._x2Scale instanceof AbstractScale);

        this._oScale = this.getScale(this.o);
        console.assert(this._oScale instanceof AbstractScale);


        // Subscribe to event publishers here
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._x2Scale.onUpdate(this.uuid, this.drawPlot);
        this._oScale.onUpdate(this.uuid, this.drawPlot);
        

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);
        this._stratificationDataContainer.onUpdate(this.uuid, this.drawPlot);
        this._stratificationDataContainer2.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._xScale.onHighlight(this.uuid, this.highlightX);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

        this._x2Scale.onHighlight(this.uuid, this.highlightXSecondary);
        this._x2Scale.onHighlightDestroy(this.uuid, this.highlightDestroy);

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
        this._x2Scale.onUpdate(this.uuid, null);
        this._oScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);
        this._stratificationDataContainer.onUpdate(this.uuid, null);
        this._stratificationDataContainer2.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);

        this._x2Scale.onHighlight(this.uuid, null);
        this._x2Scale.onHighlightDestroy(this.uuid, null);

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
        tooltip: function(mouseX, mouseY, o, x, x2, y) {
            // Set values
            this.tooltipInfo.o = this._oScale.toHuman(o);
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.x2 = this._x2Scale.toHuman(x2);
            this.tooltipInfo.y = this._yScale.toHuman(y);

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;

            // Dispatch highlights
            this._oScale.emitHighlight(o);
            this._xScale.emitHighlight(x);
            this._x2Scale.emitHighlight(x2);
            this._yScale.emitHighlight(y);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._x2Scale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
            this._oScale.emitHighlightDestroy();
        },
        highlightX(value) {
            if(this.highlightXScale) {
                this.highlightX1 = this.highlightXScale(value);
            }
        },
        highlightXSecondary(value) {
            if(this.highlightXScaleSecondary) {
                this.highlightX1Secondary = this.highlightXScaleSecondary(value);
            }
        },
        highlightY(value) {
            if(this.highlightYScale) {
                this.highlightY1 = this.highlightYScale(value);
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightX1Secondary = null;
            this.highlightY1 = null;
        },
        drawPlot() {
            const vm = this;

            if(vm._dataContainer.isLoading || 
                vm._stratificationDataContainer.isLoading || 
                vm._stratificationDataContainer2.isLoading || 
                vm._xScale.isLoading || vm._x2Scale.isLoading || vm._yScale.isLoading || vm._oScale.isLoading) {
                return;
            }
            
            let data = this._dataContainer.dataCopy;
            let stratificationData = this._stratificationDataContainer.dataCopy;
            let stratificationData2 = this._stratificationDataContainer2.dataCopy;

            const xScale = vm._xScale;
            const x2Scale = vm._x2Scale;
            const yScale = vm._yScale;

            const oScale = vm._oScale;
            data = data.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            stratificationData = stratificationData.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            stratificationData2 = stratificationData2.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            

            const x = d3_scaleLinear()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);
            
            vm.highlightXScale = x;
            vm.highlightYScale = y;
              

            
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
             * Prepare for interactivity
             */
            const points = [];
            const pointsData = [];

            /*
             * Draw the points
             */
            if(vm.strokeColor !== undefined) {
                context.strokeStyle = vm.strokeColor;
            }
            data.forEach((d) => {
                let sEl = stratificationData.find((sEl) => sEl[vm.o] === d[vm.o]);
                let sEl2 = stratificationData2.find((sEl) => sEl[vm.o] === d[vm.o]);
                if(sEl !== undefined && sEl2 !== undefined && !AbstractScale.isUnknown(sEl[vm.x]) && !AbstractScale.isUnknown(sEl2[vm.x2])) {
                    
                    context.fillStyle = x2Scale.color(sEl2[vm.x2]);
                    if(vm.strokeColor === undefined) {
                        context.strokeStyle = x2Scale.color(sEl2[vm.x2]);
                    }
                    
                    context.beginPath();
                    context.arc(x(sEl[vm.x]), y(d[vm.variable]), vm.pointSize, 0, 2*Math.PI);
                    points.push([x(sEl[vm.x]), y(d[vm.variable])]);
                    pointsData.push({
                        "y": d[vm.variable],
                        "o": d[vm.o],
                        "x": sEl[vm.x],
                        "x2": sEl2[vm.x2]
                    });
                    context.stroke();
                    if(vm.fillPoints) {
                        context.fill();
                    }
                }
            });
            
            /*
             * More prepare for interactivity
             */
            const delaunay = getDelaunay(points, true);
            
            /*
             * Listen for mouse events
             */
            const canvasNode = canvas.node();

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
                    vm.tooltip(mouseViewportX, mouseViewportY, node["o"], node["x"], node["x2"], node["y"]); 
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
                        vm.clickHandler(node["o"], node["x"], node["x2"], node["y"]); 
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