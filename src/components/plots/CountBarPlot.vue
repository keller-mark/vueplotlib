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
                    <th>{{ this._yScale.name }}</th>
                    <td>{{ this.tooltipInfo.y }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Two from '../../two.js';
import { scaleBand as d3_scaleBand, scaleLinear as d3_scaleLinear, scaleLog as d3_scaleLog } from 'd3-scale';
import { select as d3_select, create as d3_create } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE, BAR_MARGIN_DEFAULT, BAR_WIDTH_MIN } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} x The x-scale variable key.
 * @prop {string} y The y-scale variable key.
 * @prop {string} o The observation-scale variable key. Used to filter observations.
 * @prop {function} filterFunction A function used to filter values to determine whether to count them.
 * @prop {number} barMarginX The value for the horizontal margin between bars. Default: 2
 * @prop {string} barColor A color for all bars. Optional. If provided, overrides using the x scale for colors.
 * @prop {boolean} logY Whether or not to log-scale the y axis. Default: false
 * @extends mixin
 * 
 * @example
 * <CountBarPlot
 *      data="exposures_data"
 *      x="signature" 
 *      y="exposure"
 *      o="sample_id"
 *      :filterFunction="((val) => (val > 1))"
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
    name: 'CountBarPlot',
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
        'filterFunction': {
            type: Function
        },
        'barColor': {
            type: String
        },
        'barMarginX': {
            type: Number, 
            default: BAR_MARGIN_DEFAULT
        },
        'logY': {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                y: ''
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
        this._oScale = this.getScale(this.o);
        console.assert(this._xScale instanceof AbstractScale);
        console.assert(this._yScale instanceof AbstractScale);
        console.assert(this._oScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        this._oScale.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._xScale.onHighlight(this.uuid, this.highlightX);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
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

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        barMarginX() {
            this.drawPlot();
        },
        barColor() {
            this.drawPlot();
        },
        logY() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, x, y) {
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.y = this._yScale.toHuman(y);

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._xScale.emitHighlight(x);
            this._yScale.emitHighlight(y);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
        },
        highlightX(value) {
            if(this.highlightScale) {
                this.highlightX1 = this.highlightScale(value);
                this.highlightX2 = this.highlightScale(value) + this.barWidth;
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightX2 = null;
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._xScale.isLoading || vm._yScale.isLoading || vm._oScale.isLoading) {
                return;
            }
            
            let data = vm._dataContainer.dataCopy;

            const xScale = this._xScale;
            const yScale = this._yScale;
            const oScale = this._oScale;

            data = data.filter((el) => oScale.domainFiltered.includes(el[vm.o]));

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            vm.highlightScale = x;
            
            let yScaleFunc = d3_scaleLinear;
            if(vm.logY) {
                yScaleFunc = d3_scaleLog;
            }
            const y = yScaleFunc()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

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
             * Draw the bars
             */
            let barMarginX = vm.barMarginX;
            if(barWidth - vm.barMarginX <= BAR_WIDTH_MIN) {
                barMarginX = 0;
            }
            
            xScale.domainFiltered.forEach((xVal) => {
                const yVal = data.filter((el) => (!AbstractScale.isUnknown(el[xVal]) && vm.filterFunction(el[xVal], el, xVal))).length;

                const col = genColor();
                colToNode[col] = { "x": xVal, "y": yVal };
                contextHidden.fillStyle = col;

                let height = vm.pHeight - y(yVal);
                const rect = two.makeRectangle(x(xVal) + (barMarginX/2) + (barWidth - barMarginX)/2, y(yVal) + height/2, barWidth - barMarginX, height);
                rect.noStroke();
                if(vm.barColor !== undefined) {
                    rect.fill = vm.barColor;
                } else {
                    rect.fill = xScale.color(xVal);
                }
                
                contextHidden.fillRect(x(xVal), 0, barWidth, vm.pHeight);
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
                    vm.tooltip(mouseViewportX, mouseViewportY, node["x"], node["y"]); 
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
                        vm.clickHandler(node["x"], node["y"]);
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