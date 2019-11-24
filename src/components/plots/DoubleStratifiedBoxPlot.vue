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
        <div v-show="this.highlightPrimaryX1 !== null"
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightPrimaryX1 - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightPrimaryX2 !== null"
            :style="{
                'display': (showHighlight ? 'inline-block' : 'none'),
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightPrimaryX2 - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightSecondaryX1 !== null"
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightSecondaryX1 - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightSecondaryX2 !== null"
            :style="{
                'display': (showHighlight ? 'inline-block' : 'none'),
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightSecondaryX2 - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
                <tr>
                    <th>{{ this._x1Scale.name }}</th>
                    <td>{{ this.tooltipInfo.x1 }}</td>
                </tr>
                <tr>
                    <th>{{ this._x2Scale.name }}</th>
                    <td>{{ this.tooltipInfo.x2 }}</td>
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
        </div>
    </div>
</template>

<script>
import { scaleLinear as d3_scaleLinear, scaleQuantile as d3_scaleQuantile, scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { min as d3_min, max as d3_max, mean as d3_mean } from 'd3-array';

import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';


import AbstractScale from './../../scales/AbstractScale.js';
import CategoricalScale from './../../scales/CategoricalScale.js';
import ContinuousScale from './../../scales/ContinuousScale.js';


import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} o The key for the observation scale, used for selecting and filtering data points.
 * @prop {string} x1 The key for the primary scale by which to stratify. Must be categorical.
 * @prop {string} dx1 The key for the data containing the primary variable by which to stratify.
 * @prop {string} ox1 The observation-scale variable key for the dx1 dataset. Required in order to match with the stratification data.
 * @prop {string} x2 The key for the secondary scale by which to stratify. Must be categorical.
 * @prop {string} dx2 The key for the data containing the secondary variable by which to stratify.
 * @prop {string} ox2 The observation-scale variable key for the dx2 dataset. Required in order to match with the stratification data.
 * @prop {string} y The y-scale variable key. Must be continuous.
 * @prop {string} dy The key for the data containing the y-scale variable.
 * @prop {string} oy The observation-scale variable key for the dy dataset. Required in order to match with the stratification data.
 * @prop {number} pointSize The diameter of outlier (and mean) points. Default: 6
 * @prop {boolean} drawOutliers Whether or not to draw outlier points on the plot. Default: true
 * @extends mixin
 * 
 * @example
 * <DoubleStratifiedBoxPlot
 *      o="sample_id"
 * 
 *      x1="smoking_binary"
 *      dx1="smoking_data"
 *      ox1="sample_id"
 * 
 *      x2="sex"
 *      dx2="sex_data"
 *      ox2="sample_id"
 * 
 *      y="COSMIC 1"
 *      dy="exposures_data"
 *      oy="sample_id"
 *      
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
    name: 'DoubleStratifiedBoxPlot',
    mixins: [mixin],
    props: {
        'variable': {
            type: String
        },
        'x1': { // primary stratification variable
            type: String
        },
        'dx1': { // data for primary stratification variable
            type: String
        },
        'ox1': { // observation key for primary stratification data
            type: String
        },
        'x2': { // secondary stratification variable
            type: String
        },
        'dx2': { // data for secondary stratification variable
            type: String
        },
        'ox2': { // observation key for secondary stratification data
            type: String
        },
        'y': { // response variable
            type: String
        },
        'dy': { // data for response variable
            type: String
        },
        'oy': { // observation key for response data
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
            tooltipInfo: {
                x1: '', // primary x highlight
                x2: '', // secondary x highlight
                count: '',
                min: '',
                q1: '',
                median: '',
                mean: '',
                q3: '',
                max: ''
            },
            highlightPrimaryX1: null,
            highlightPrimaryX2: null,
            highlightScalePrimary: null,
            barWidthPrimary: 0,
            highlightSecondaryX1: null,
            highlightSecondaryX2: null,
            highlightScaleSecondary: null,
            barWidthSecondary: 0
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        // Set data
        this._x1DataContainer = this.getData(this.dx1);
        console.assert(this._x1DataContainer instanceof DataContainer);

        this._x2DataContainer = this.getData(this.dx2);
        console.assert(this._x2DataContainer instanceof DataContainer);

        this._yDataContainer = this.getData(this.dy);
        console.assert(this._yDataContainer instanceof DataContainer);

        // Set scale variables
        this._oScale = this.getScale(this.o);
        console.assert(this._oScale instanceof CategoricalScale);

        this._x1Scale = this.getScale(this.x1);
        console.assert(this._x1Scale instanceof CategoricalScale);

        this._x2Scale = this.getScale(this.x2);
        console.assert(this._x1Scale instanceof CategoricalScale);

        this._yScale = this.getScale(this.y);
        console.assert(this._yScale instanceof ContinuousScale);

        
        // Subscribe to event publishers here
        this._oScale.onUpdate(this.uuid, this.drawPlot);
        this._x1Scale.onUpdate(this.uuid, this.drawPlot);
        this._x2Scale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        

        // Subscribe to data mutations here
        this._x1DataContainer.onUpdate(this.uuid, this.drawPlot);
        this._x2DataContainer.onUpdate(this.uuid, this.drawPlot);
        this._yDataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._x1Scale.onHighlightPrimary(this.uuid, this.highlightPrimary);
        this._x1Scale.onHighlightPrimaryDestroy(this.uuid, this.highlightPrimaryDestroy);

        this._x2Scale.onHighlightSecondary(this.uuid, this.highlightSecondary);
        this._x2Scale.onHighlightSecondaryDestroy(this.uuid, this.highlightSecondaryDestroy);

    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._oScale.onUpdate(this.uuid, null);
        this._x1Scale.onUpdate(this.uuid, null);
        this._x2Scale.onUpdate(this.uuid, null);
        this._yScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._x1DataContainer.onUpdate(this.uuid, null);
        this._x2DataContainer.onUpdate(this.uuid, null);
        this._yDataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._x1Scale.onHighlightPrimary(this.uuid, null);
        this._x1Scale.onHighlightPrimaryDestroy(this.uuid, null);

        this._x2Scale.onHighlightSecondary(this.uuid, null);
        this._x2Scale.onHighlightSecondaryDestroy(this.uuid, null);
    },
    watch: {
        pointSize() {
            this.drawPlot();
        },
        drawOutliers() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, node) {
            // Set values
            this.tooltipInfo.x1 = this._x1Scale.toHuman(node.x1);
            this.tooltipInfo.x2 = this._x2Scale.toHuman(node.x2);
            this.tooltipInfo.count = node.count;
            this.tooltipInfo.min = node.min;
            this.tooltipInfo.q1 = node.q1;
            this.tooltipInfo.median = node.median;
            this.tooltipInfo.mean = node.mean;
            this.tooltipInfo.q3 = node.q3;
            this.tooltipInfo.max = node.max;

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;

            // Dispatch highlights
            this._x1Scale.emitHighlight(node.x1);
            this._x2Scale.emitHighlight(node.x2);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._x1Scale.emitHighlightDestroy();
            this._x2Scale.emitHighlightDestroy();
        },
        highlightPrimary(value) {
            if(this.highlightScalePrimary) {
                this.highlightPrimaryX1 = this.highlightScalePrimary(value);
                this.highlightPrimaryX2 = this.highlightScalePrimary(value) + this.barWidthPrimary;
            }
        },
        highlightPrimaryDestroy() {
            this.highlightPrimaryX1 = null;
            this.highlightPrimaryX2 = null;
        },
        highlightSecondary(value) {
            if(this.highlightScaleSecondary) {
                this.highlightSecondaryX1 = this.highlightScaleSecondary(value);
                this.highlightSecondaryX2 = this.highlightScaleSecondary(value) + this.barWidthSecondary;
            }
        },
        highlightSecondaryDestroy() {
            this.highlightSecondaryX1 = null;
            this.highlightSecondaryX2 = null;
        },
        drawPlot() {
            const vm = this;

            if(
                vm._x1DataContainer.isLoading || 
                vm._x2DataContainer.isLoading || 
                vm._yDataContainer.isLoading || 
                vm._oScale.isLoading || 
                vm._x1Scale.isLoading || 
                vm._x2Scale.isLoading || 
                vm._yScale.isLoading) {
                return;
            }
            
            let x1Data = this._x1DataContainer.dataCopy;
            let x2Data = this._x2DataContainer.dataCopy;
            let yData = this._yDataContainer.dataCopy;

            const oScale = vm._oScale;
            const x1Scale = vm._x1Scale;
            const x2Scale = vm._x2Scale;
            const yScale = vm._yScale;

            x1Data = x1Data.filter((el) => oScale.domainFiltered.includes(el[vm.ox1]));
            x2Data = x2Data.filter((el) => oScale.domainFiltered.includes(el[vm.ox2]));
            

            const x1 = d3_scaleBand()
                .domain(x1Scale.domainFiltered)
                .range([0, vm.pWidth]);

            // For each item of the x1Scale domain, generate an x2Scale scale object.
            const x2AxisWidth = vm.pWidth / x1Scale.domainFiltered.length;
            const x2 = x1Scale.domainFiltered.map((x1El, i) => {
                return d3_scaleBand()
                    .domain(x2Scale.domainFiltered)
                    .range([i*x2AxisWidth, (i+1)*x2AxisWidth]);
            });
            

            vm.highlightScalePrimary = x1;
            vm.highlightScaleSecondary = null; // set later
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            const barWidthPrimary = vm.pWidth / x1Scale.domainFiltered.length;
            vm.barWidthPrimary = barWidthPrimary;

            const barWidthSecondary = barWidthPrimary / x2Scale.domainFiltered.length;
            vm.barWidthSecondary = barWidthSecondary;
              
            

            
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

            const boxWidth = (barWidthSecondary / 2);
            const boxMargin = barWidthSecondary / 4;


            const diamondSize = vm.pointSize + 2;

            x1Scale.domainFiltered.forEach((boxVarPrimary, x1i) => {

                x2Scale.domainFiltered.forEach((boxVarSecondary) => {

                    const x = x2[x1i];

                    context.fillStyle = x2Scale.color(boxVarSecondary);

                    let boxData = yData.filter((yEl) => {
                        const x1El = x1Data.find((xEl) => xEl[vm.ox1] === yEl[vm.oy]);
                        const x2El = x2Data.find((xEl) => xEl[vm.ox2] === yEl[vm.oy]);
                        return (
                            x1El !== undefined && x2El !== undefined && 
                            x1El[vm.x1] === boxVarPrimary && x2El[vm.x2] === boxVarSecondary
                        );
                    });
                    boxData = boxData.map((el) => el[vm.y] || 0);
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


                    let boxX1 = x(boxVarSecondary) + boxMargin;
                    let boxX2 = boxX1 + boxWidth;
                    let boxX = boxX1 + (boxWidth / 2)

                    context.strokeStyle = "black";
                    context.beginPath();
                    // Upper Fence
                    context.moveTo(boxX1, y(upperFence));
                    context.lineTo(boxX2, y(upperFence));
                    // Vertical Line
                    context.moveTo(boxX1 + (boxWidth / 2), y(upperFence));
                    context.lineTo(boxX1 + (boxWidth / 2), y(lowerFence));
                    // Lower Fence
                    context.moveTo(boxX1, y(lowerFence));
                    context.lineTo(boxX2, y(lowerFence));

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
                        x1: boxVarPrimary,
                        x2: boxVarSecondary,
                        count: boxData.length,
                        min: d3_min(boxData), 
                        q1: q1,
                        median: median,
                        mean: mean,
                        q3: q3, 
                        max: d3_max(boxData)
                    };
                    contextHidden.fillStyle = col;
                    contextHidden.fillRect(x(boxVarSecondary), 0, barWidth, vm.pHeight);
                });
                
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
                        vm.clickHandler(node["x1"], node["x2"]); 
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