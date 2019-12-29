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
        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
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
import { scaleLinear as d3_scaleLinear, scaleQuantile as d3_scaleQuantile } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { min as d3_min, max as d3_max, mean as d3_mean } from 'd3-array';

import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';


import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} variable The key to access the values in the data array objects.
 * @prop {string} y The y-scale variable key.
 * @prop {string} o The observation-scale variable key. Optional.
 * @prop {number} pointSize The diameter of outlier (and mean) points. Default: 6
 * @prop {boolean} drawOutliers Whether or not to draw outlier points on the plot. Default: true
 * @extends mixin
 * 
 * @example
 * <BoxPlot
 *      data="boxplot_data"
 *      y="exposure"
 *      o="signature"
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
    name: 'BoxPlot',
    mixins: [mixin],
    props: {
        'variable': {
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
                min: '',
                q1: '',
                median: '',
                mean: '',
                q3: '',
                max: ''
            }
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
        this._yScale = this.getScale(this.y);
        console.assert(this._yScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._yScale.onUpdate(this.uuid, this.drawPlot);

        if(this.o !== undefined) {
            this._oScale = this.getScale(this.o);
            console.assert(this._oScale instanceof AbstractScale);
            this._oScale.onUpdate(this.uuid, this.drawPlot);
            this.hasO = true;
        }

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._yScale.onUpdate(this.uuid, null);
        if(this.hasO) {
            this._oScale.onUpdate(this.uuid, null);
        }

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);
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
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._yScale.isLoading || (vm.hasO && vm._oScale.isLoading)) {
                return;
            }
            
            let data = vm._dataContainer.dataCopy;

            const yScale = vm._yScale;

            if(vm.hasO) {
                const oScale = vm._oScale;
                data = data.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            }
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            const barWidth = vm.pWidth;
            
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

            const canvasHidden = d3_select(this.hiddenPlotSelector);
            const contextHidden = canvasHidden.node().getContext('2d');

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

            const boxWidth = (barWidth / 2);
            const boxMargin = barWidth / 4;

            const diamondSize = vm.pointSize + 2;

            let boxData = data.map((el) => el[vm.variable] || 0);
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


            let boxX1 = boxMargin;
            let boxX2 = boxX1 + boxWidth;
            let boxX = boxX1 + (boxWidth / 2)

            const verticalLine = two.makeLine(boxX1 + (boxWidth / 2),y(upperFence), boxX1 + (boxWidth / 2),y(lowerFence));
            verticalLine.stroke = "black";

            const boxRect = two.makeRectangle(boxX1 + boxWidth/2, y(q3) + (y(q1) - y(q3))/2, boxWidth, y(q1) - y(q3));
            boxRect.linewidth = 1;
            boxRect.fill = "#B8CDE3";
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

            if(vm.drawOutliers) {
                let outliers = boxData.filter((el) => (el > upperFence) || (el < lowerFence));
                outliers.forEach((outlier) => {
                    const circle = two.makeCircle(boxX, y(outlier), (vm.pointSize / 2));
                    circle.linewidth = 1;
                    circle.stroke = "black";
                    circle.noFill();
                });
            }

            two.update();

            if(d3Node) {
                /* Ignore interactivity if SVG was passed in (for download). */
                return;
            }
            

            // Map data to colors
            const col = genColor();
            colToNode[col] = {
                min: d3_min(boxData), 
                q1: q1,
                median: median,
                mean: mean,
                q3: q3, 
                max: d3_max(boxData)
            };
            contextHidden.fillStyle = col;
            contextHidden.fillRect(0, 0, barWidth, vm.pHeight);
            
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
                        vm.clickHandler(); 
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