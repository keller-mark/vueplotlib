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
                    <th>{{ this._xScale.name }}</th>
                    <td>{{ this.tooltipInfo.x }}</td>
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
import { scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} x The x-scale variable key.
 * @prop {string} c The color-scale variable key.
 * @extends mixin
 * 
 * @example
 * <TrackPlot
 *      data="clinical_data"
 *      x="sample_id" 
 *      c="age"
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
    name: 'TrackPlot',
    mixins: [mixin],
    props: {
        'x': {
            type: String
        },
        'c': {
            type: String
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                c: ''
            },
            highlightX1: 0,
            highlightX2: 0,
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
        this._cScale = this.getScale(this.c);
        console.assert(this._xScale instanceof AbstractScale);
        console.assert(this._cScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._cScale.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._xScale.onHighlight(this.uuid, this.highlight);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.drawPlot();
    },
    methods: {
        tooltip: function(mouseX, mouseY, x, c) {
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.c = this._cScale.toHuman(c);

            // Set position
            this.tooltipPosition.left = mouseX + this.pMarginLeft;
            this.tooltipPosition.top = mouseY + this.pMarginTop;
            
            // Dispatch highlights
            this._xScale.emitHighlight(x);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
        },
        highlight(value) {
            this.highlightX1 = this.highlightScale(value);
            this.highlightX2 = this.highlightScale(value) + this.barWidth;
            this.showHighlight = true;

        },
        highlightDestroy() {
            this.showHighlight = false;
        },
        drawPlot() {
            const vm = this;
            
            let data = this._dataContainer.dataCopy;
            const xScale = this._xScale;
            const cScale = this._cScale;

            data = data.filter((el) => xScale.domainFiltered.includes(el[vm.x]));

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            vm.highlightScale = x;

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
             * Draw the track
             */
            data.forEach((d) => {
                const col = genColor();
                colToNode[col] = { "x": d[vm.x], "c": d[vm.c] };
                contextHidden.fillStyle = col;

                context.fillStyle = cScale.color(d[vm.c]);
                context.fillRect(x(d[vm.x]), 0, barWidth, vm.pHeight);
                contextHidden.fillRect(x(d[vm.x]), 0, barWidth, vm.pHeight);
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
                    vm.tooltip(mouseX, mouseY, node["x"], node["c"]); 
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
                        vm.clickHandler(node["x"], node["c"]);
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