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
        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
                <tr>
                    <th>{{ this._xScale.name }}</th>
                    <td>{{ this.tooltipInfo.x }}</td>
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
        </div>
    </div>
</template>

<script>
import { scaleBand as d3_scaleBand, scaleLinear as d3_scaleLinear, scaleQuantile as d3_scaleQuantile } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse } from 'd3';
import debounce from 'lodash/debounce';
import { min as d3_min, max as d3_max, mean as d3_mean } from 'd3-array';

import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';


import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} x The x-scale variable key.
 * @prop {string} y The y-scale variable key.
 * @prop {string} o The observation-scale variable key. Optional.
 * @prop {number} pointSize The diameter of outlier (and mean) points. Default: 6
 * @prop {boolean} drawOutliers Whether or not to draw outlier points on the plot.
 * @extends mixin
 * 
 * @example
 * <MultiBoxPlot
 *      data="exposures_data"
 *      x="signature"
 *      y="exposure"
 *      o="sample_id"
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
    name: 'MultiBoxPlot',
    mixins: [mixin],
    props: {
        'x': {
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
            default: 6
        },
        'drawOutliers': {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            hasO: false,
            tooltipInfo: {
                x: '',
                min: '',
                q1: '',
                median: '',
                mean: '',
                q3: '',
                max: ''
            },
            highlightX1: null,
            highlightX2: null,
            highlightScale: null,
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

        // Set scale variables
        this._xScale = this.getScale(this.x);
        this._yScale = this.getScale(this.y);
        console.assert(this._xScale instanceof AbstractScale);
        console.assert(this._yScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);

        if(this.o !== undefined) {
            this._oScale = this.getScale(this.o);
            console.assert(this._oScale instanceof AbstractScale);
            this._oScale.onUpdate(this.uuid, this.drawPlot);
            this.hasO = true;
        }

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._xScale.onHighlight(this.uuid, this.highlight);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._yScale.onUpdate(this.uuid, null);
        this._xScale.onUpdate(this.uuid, null);
        if(this.hasO) {
            this._oScale.onUpdate(this.uuid, null);
        }

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);
    },
    methods: {
        tooltip: function(mouseX, mouseY, node) {
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(node.x);
            this.tooltipInfo.min = node.min;
            this.tooltipInfo.q1 = node.q1;
            this.tooltipInfo.median = node.median;
            this.tooltipInfo.mean = node.mean;
            this.tooltipInfo.q3 = node.q3;
            this.tooltipInfo.max = node.max;

            // Set position
            this.tooltipPosition.left = mouseX + this.pMarginLeft;
            this.tooltipPosition.top = mouseY + this.pMarginTop;

            // Dispatch highlights
            this._xScale.emitHighlight(node.x);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
        },
        highlight(value) {
            if(this.highlightScale) {
                this.highlightX1 = this.highlightScale(value);
                this.highlightX2 = this.highlightScale(value) + this.barWidth;
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightX2 = null;
        },
        drawPlot() {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._xScale.isLoading || vm._yScale.isLoading || (vm.hasO && vm._oScale.isLoading)) {
                return;
            }
            
            let data = this._dataContainer.dataCopy;

            const xScale = vm._xScale;
            const yScale = vm._yScale;

            if(vm.hasO) {
                const oScale = vm._oScale;
                data = data.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            }

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            vm.highlightScale = x;
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            const barWidth = vm.pWidth / xScale.domainFiltered.length;
            vm.barWidth = barWidth;
              
            

            
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
             * Draw the boxes
             */

            const boxWidth = (barWidth / 2);
            const boxMargin = barWidth / 4;


            const diamondSize = vm.pointSize + 2;

            xScale.domainFiltered.forEach((boxVar) => {
                context.fillStyle = xScale.color(boxVar);

                let boxData = data.map((el) => el[boxVar] || 0);
                let quantile = d3_scaleQuantile()
                    .domain(boxData)
                    .range([0, 1, 2, 3]);
                
                let quartiles = quantile.quantiles();
                
                let q1 = quartiles[0];
                let median = quartiles[1];
                let mean = d3_mean(boxData);
                let q3 = quartiles[2];
                
                let iqr = quartiles[2] - quartiles[0];
                let lowerFence = q1 - iqr;
                let upperFence = q3 + iqr;


                let boxX1 = x(boxVar) + boxMargin;
                let boxX2 = boxX1 + boxWidth;
                let boxX = boxX1 + (boxWidth / 2)

                context.strokeStyle = "black";
                context.beginPath();
                // Upper Fence
                context.moveTo(boxX1,y(upperFence));
                context.lineTo(boxX2,y(upperFence));
                // Vertical Line
                context.moveTo(boxX1 + (boxWidth / 2),y(upperFence));
                context.lineTo(boxX1 + (boxWidth / 2),y(lowerFence));
                // Lower Fence
                context.moveTo(boxX1,y(lowerFence));
                context.lineTo(boxX2,y(lowerFence));

                context.stroke();

                // Draw the box rect
                context.strokeRect(boxX1, y(q3), boxWidth, y(q1) - y(q3));
                context.fillRect(boxX1, y(q3), boxWidth, y(q1) - y(q3));

                // Draw the median line
                context.beginPath();
                context.moveTo(boxX1, y(median));
                context.lineTo(boxX2, y(median));
                context.stroke();

                // Draw the mean diamond
                context.beginPath();
                context.moveTo(boxX - (diamondSize/2), y(mean));
                context.lineTo(boxX, y(mean) - (diamondSize/2));
                context.lineTo(boxX + (diamondSize/2), y(mean));
                context.lineTo(boxX, y(mean) + (diamondSize/2));
                context.lineTo(boxX - (diamondSize/2), y(mean));
                context.stroke();

                // Draw the outliers
                if(vm.drawOutliers) {
                    let outliers = boxData.filter((el) => (el > upperFence) || (el < lowerFence));
                    outliers.forEach((outlier) => {
                        context.beginPath();
                        context.arc(boxX, y(outlier), (vm.pointSize / 2), 0, 2*Math.PI);
                        context.stroke();
                    });
                }

                // Map data to colors
                const col = genColor();
                colToNode[col] = {
                    x: boxVar,
                    min: d3_min(boxData), 
                    q1: q1,
                    median: median,
                    mean: mean,
                    q3: q3, 
                    max: d3_max(boxData)
                };
                contextHidden.fillStyle = col;
                contextHidden.fillRect(x(boxVar), 0, barWidth, vm.pHeight);
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
            }

            const debouncedTooltipDestroy = debounce(vm.tooltipDestroy, TOOLTIP_DEBOUNCE);
            canvas.on("mousemove", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                const node = getDataFromMouse(mouseX, mouseY);

                if(node) {
                    vm.tooltip(mouseX, mouseY, node); 
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
                        vm.clickHandler(node["x"]); 
                    }
                })
            }
            
        }
    }
}
</script>

<style>
@import '../../style/plot-style.css';
</style>