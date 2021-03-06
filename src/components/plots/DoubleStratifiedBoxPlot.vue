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
        <div v-show="this.highlightX1Secondary !== null"
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX1Secondary - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightX2Secondary !== null"
            :style="{
                'display': (showHighlight ? 'inline-block' : 'none'),
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX2Secondary - 0.5) + 'px'
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
import Two from '../../two.js';
import { scaleLinear as d3_scaleLinear, scaleQuantile as d3_scaleQuantile, scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select, create as d3_create } from 'd3-selection';
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
 * @prop {string} variable The key to access the values in the data array objects.
 * @prop {string} s The key for the data containing the variable to stratify by.
 * @prop {string} x The key for the scale to stratify by. Must be categorical.
 * @prop {string} s2 The key for the data containing the secondary variable to stratify by.
 * @prop {string} x2 The key for the secondary scale to stratify by. Must be categorical.
 * @prop {string} y The y-scale variable key.
 * @prop {string} o The observation-scale variable key. Required in order to match with the stratification data.
 * @prop {number} pointSize The diameter of outlier (and mean) points. Default: 6
 * @prop {boolean} drawOutliers Whether or not to draw outlier points on the plot. Default: true
 * @extends mixin
 * 
 * @example
 * <DoubleStratifiedBoxPlot
 *      data="boxplot_data"
 *      variable="COSMIC 1"
 *      s="stratification_data"
 *      x="smoking_binary"
 *      s2="stratification_data"
 *      x2="sex"
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
    name: 'DoubleStratifiedBoxPlot',
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
                x: '',
                x2: '',
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
            highlightScale: null,
            barWidth: 0,
            highlightX1Secondary: null,
            highlightX2Secondary: null,
            highlightScaleSecondary: null,
            highlightScaleSecondaryAll: null,
            barWidthSecondary: 0
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
        console.assert(this._xScale instanceof CategoricalScale);

        this._x2Scale = this.getScale(this.x2);
        console.assert(this._x2Scale instanceof CategoricalScale);

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
        this._xScale.onHighlight(this.uuid, this.highlight);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

        this._x2Scale.onHighlight(this.uuid, this.highlightSecondary);
        this._x2Scale.onHighlightDestroy(this.uuid, this.highlightDestroy);

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
            this.tooltipInfo.x = this._xScale.toHuman(node.x);
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
            this._xScale.emitHighlight(node.x);

            this.highlightScaleSecondary = this.highlightScaleSecondaryAll[node.xi];
            this._x2Scale.emitHighlight(node.x2);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._x2Scale.emitHighlightDestroy();
        },
        highlight(value) {
            if(this.highlightScale) {
                this.highlightX1 = this.highlightScale(value);
                this.highlightX2 = this.highlightScale(value) + this.barWidth;
            }
        },
        highlightSecondary(value) {
            if(this.highlightScaleSecondary) {
                this.highlightX1Secondary = this.highlightScaleSecondary(value);
                this.highlightX2Secondary = this.highlightScaleSecondary(value) + this.barWidthSecondary;
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightX2 = null;
            this.highlightX1Secondary = null;
            this.highlightX2Secondary = null;
        },
        drawPlot(d3Node) {
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
            

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            const x2AxisWidth = vm.pWidth / xScale.domainFiltered.length;
            const x2 = xScale.domainFiltered.map((xEl, i) => {
                return d3_scaleBand()
                    .domain(x2Scale.domainFiltered)
                    .range([i*x2AxisWidth, (i+1)*x2AxisWidth]);
            });

            vm.highlightScale = x;
            vm.highlightScaleSecondaryAll = x2;
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            const barWidth = vm.pWidth / xScale.domainFiltered.length;
            vm.barWidth = barWidth;

            const barWidthSecondary = barWidth / x2Scale.domainFiltered.length;
            vm.barWidthSecondary = barWidthSecondary;
            
            
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

            let canvasHidden, contextHidden;
            try {
                canvasHidden = d3_select(this.hiddenPlotSelector);
                contextHidden = canvasHidden.node().getContext('2d');
            } catch(e) {
                canvasHidden = d3_create("canvas");
                contextHidden = canvasHidden.node().getContext('2d');
            }

            const ratio = getRetinaRatio(contextHidden);
            const scaledWidth = vm.pWidth * ratio;
            const scaledHeight = vm.pHeight * ratio;

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

            xScale.domainFiltered.forEach((boxVar, xi) => {
                x2Scale.domainFiltered.forEach((boxVarSecondary) => {
                    const x = x2[xi];

                    let boxData = data.filter((dEl) => {
                        const sEl = stratificationData.find((sEl) => sEl[vm.o] === dEl[vm.o]);
                        const sEl2 = stratificationData2.find((sEl) => sEl[vm.o] === dEl[vm.o]);
                        return (sEl !== undefined && sEl2 !== undefined && sEl[vm.x] === boxVar && sEl2[vm.x2] === boxVarSecondary);
                    });
                    boxData = boxData.map((el) => el[vm.variable] || 0);
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
                    let boxX = boxX1 + (boxWidth / 2);

                    if(boxData.length > 0) {
                        const verticalLine = two.makeLine(boxX1 + (boxWidth / 2),y(upperFence), boxX1 + (boxWidth / 2),y(lowerFence));
                        verticalLine.stroke = "black";

                        const boxRect = two.makeRectangle(boxX1 + boxWidth/2, y(q3) + (y(q1) - y(q3))/2, boxWidth, y(q1) - y(q3));
                        boxRect.linewidth = 1;
                        boxRect.fill = x2Scale.color(boxVarSecondary);
                        boxRect.stroke = "black";

                        const upperFenceLine = two.makeLine(boxX1,y(upperFence), boxX2,y(upperFence));
                        upperFenceLine.stroke = "black";

                        const lowerFenceLine = two.makeLine(boxX1,y(lowerFence), boxX2,y(lowerFence));
                        lowerFenceLine.stroke = "black";

                        const medianLine = two.makeLine(boxX1,y(median), boxX2,y(median));
                        medianLine.stroke = "black";

                        const meanDiamond = two.makeRectangle(boxX,y(mean), diamondSize-2, diamondSize-2);
                        meanDiamond.stroke = "black";
                        meanDiamond.noFill();
                        meanDiamond.rotation = Math.PI/4;
                    }

                    // Draw the outliers
                    if(vm.drawOutliers) {
                        let outliers = boxData.filter((el) => (el > upperFence) || (el < lowerFence));
                        outliers.forEach((outlier) => {
                            const circle = two.makeCircle(boxX, y(outlier), (vm.pointSize / 2));
                            circle.linewidth = 1;
                            circle.stroke = "black";
                            circle.noFill();
                        });
                    }

                    // Map data to colors
                    const col = genColor();
                    colToNode[col] = {
                        x: boxVar,
                        xi: xi,
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

            two.update();

            if(d3Node) {
                /* Ignore interactivity if SVG was passed in (for download). */
                return;
            }
            
            /*
             * Listen for mouse events
             */
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
                        vm.clickHandler(node["x"], node["x2"]); 
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