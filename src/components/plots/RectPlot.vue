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
        <div v-show="this.highlightXY !== null"
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': (this.pWidth - 0.5) + 'px', 
                'top': (this.pMarginTop - 0.5) + 'px',
                'left': (this.pMarginLeft - 0.5) + 'px'
            }"
            class="vdp-plot-highlight-rect"
        ></div>
        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
                <tr>
                    <th>{{ this._zScale.name }}</th>
                    <td>{{ this.tooltipInfo.z }}</td>
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
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE, BAR_MARGIN_X_DEFAULT, BAR_WIDTH_MIN } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';
import ContinuousScale from './../../scales/ContinuousScale.js';
import CategoricalScale from './../../scales/CategoricalScale.js';


let uuid = 0;
/**
 * @prop {string} c The color-scale variable key.
 * @prop {string} z The observation-scale variable key.
 * @prop {string} o The observation (observation-scale domain element of interest).
 * @prop {boolean} disableTooltip Whether to disable tooltips. Default: false
 * @extends mixin
 * 
 * @example
 * <RectPlot
 *      data="clinical_data"
 *      z="sample_id" 
 *      o="SA12345"
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
    name: 'RectPlot',
    mixins: [mixin],
    props: {
        'z': { // observation scale
            type: String
        },
        'c': { // color scale
            type: String
        },
        'o': { // observation value
            type: String
        },
        'disableTooltip': {
            type: Boolean, 
            default: false
        }
    },
    data() {
        return {
            tooltipInfo: {
                z: '',
                c: ''
            },
            highlightXY: null
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
        this._zScale = this.getScale(this.z);
        this._cScale = this.getScale(this.c);
        console.assert(this._zScale instanceof CategoricalScale);
        console.assert(this._cScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._zScale.onUpdate(this.uuid, this.drawPlot);
        this._cScale.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._zScale.onHighlight(this.uuid, this.highlight);
        this._zScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._cScale.onUpdate(this.uuid, null);
        this._xScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        o() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, z, c) {
            // Set values
            this.tooltipInfo.z = this._zScale.toHuman(z);
            this.tooltipInfo.c = this._cScale.toHuman(c);

            // Set position
            if(!this.disableTooltip) {
                this.tooltipPosition.left = mouseX;
                this.tooltipPosition.top = mouseY;
            }
            
            // Dispatch highlights
            this._zScale.emitHighlight(z);
            this._cScale.emitHighlight(c);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._zScale.emitHighlightDestroy();
            this._cScale.emitHighlightDestroy();
        },
        highlight() {
            this.highlightXY = true;
        },
        highlightDestroy() {
            this.highlightXY = null;
        },
        drawPlot() {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._zScale.isLoading || vm._cScale.isLoading) {
                return;
            }
            
            const data = vm._dataContainer.dataCopy;
            
            const zScale = vm._zScale;
            const cScale = vm._cScale;

            const point = data.find((el) => el[vm.z] === vm.o); // the single data point

            if(point === undefined) {
                return;
            }
            
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
             * Draw the rect
             */
            context.fillStyle = cScale.color(point[vm.c]);
            context.fillRect(0, 0, vm.pWidth, vm.pHeight);

            /*
             * Listen for mouse events
             */
            canvas.on("mousemove", () => {

                const mouseViewportX = d3_event.clientX;
                const mouseViewportY = d3_event.clientY;

                vm.tooltip(mouseViewportX, mouseViewportY, vm.o, point[vm.c]); 
               
            })
            .on("mouseleave", vm.tooltipDestroy);

            if(vm.clickHandler !== undefined) {
                canvas.on("click", () => {
                    vm.clickHandler(vm.o, point[vm.c]);
                });
            }
            
        }
    }
}
</script>

<style>
@import '../../style/plot-style.css';
</style>