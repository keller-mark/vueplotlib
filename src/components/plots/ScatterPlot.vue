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
                    <th>{{ this._xScale.name }}</th>
                    <td>{{ this.tooltipInfo.x }}</td>
                </tr>
                <tr>
                    <th>{{ this._yScale.name }}</th>
                    <td>{{ this.tooltipInfo.y }}</td>
                </tr>
                <tr v-if="this.hasC">
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Two from 'two.js';
import { scaleLinear as d3_scaleLinear, scaleLog as d3_scaleLog } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getDelaunay } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} x The x-scale variable key.
 * @prop {string} y The y-scale variable key.
 * @prop {string} c The color-scale variable key. Takes precedence over pointColor prop.
 * @prop {boolean} fillPoints Whether or not to fill points. Default: false
 * @prop {string} pointColor Default color for points. Default: "#4682B4"
 * @prop {number} pointSize Default size for points. Default: 3
 * @prop {boolean} logY Whether or not to log-scale the y axis. Default: false
 * @prop {boolean} logX Whether or not to log-scale the x axis. Default: false
 * @extends mixin
 * 
 * @example
 * <ScatterPlot
 *      data="xy_data"
 *      x="x" 
 *      y="y"
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
    name: 'ScatterPlot',
    mixins: [mixin],
    props: {
        'x': {
            type: String
        },
        'y': {
            type: String
        },
        'c': {
            type: String // color
        },
        'pointColor': {
            type: String,
            default: "#4682B4"
        },
        'pointSize': {
            type: Number,
            default: 3
        },
        'fillPoints': {
            type: Boolean,
            default: false
        },
        'logY': {
            type: Boolean,
            default: false
        },
        'logX': {
            type: Boolean,
            default: false
        }
        // TODO: allow optional dot size variable
    },
    data() {
        return {
            hasC: false,
            tooltipInfo: {
                c: '',
                x: '',
                y: ''
            },
            highlightXScale: null,
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
        this._xScale = this.getScale(this.x);
        this._yScale = this.getScale(this.y);
        console.assert(this._xScale instanceof AbstractScale);
        console.assert(this._yScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);

        // Make assertions, but keep c scale optional
        if(this.c !== undefined) {
            this.hasC = true;
            this._cScale = this.getScale(this.c);
            console.assert(this._cScale instanceof AbstractScale);
            this._cScale.onUpdate(this.uuid, this.drawPlot);
        }

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

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
        if(this.hasC) {
            this._cScale.onUpdate(this.uuid, null);
        }

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);

        this._yScale.onHighlight(this.uuid, null);
        this._yScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        pointColor() {
            this.drawPlot();
        },
        pointSize() {
            this.drawPlot();
        },
        fillPoints() {
            this.drawPlot();
        },
        logX() {
            this.drawPlot();
        },
        logY() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, x, y, c) {
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.y = this._yScale.toHuman(y);

            if(this.hasC) {
                this.tooltipInfo.c = this._cScale.toHuman(c);
            }

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._xScale.emitHighlight(x);
            this._yScale.emitHighlight(y);

            if(this.hasC) {
                this._cScale.emitHighlight(c);
            }
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();

            if(this.hasC) {
                this._cScale.emitHighlightDestroy();
            }
        },
        highlightX(value) {
            if(this.highlightXScale) {
                this.highlightX1 = this.highlightXScale(value);
            }
        },
        highlightY(value) {
            if(this.highlightYScale) {
                this.highlightY1 = this.highlightYScale(value);
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightY1 = null;
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._xScale.isLoading || vm._yScale.isLoading || (vm.hasC && vm._cScale.isLoading)) {
                return;
            }
            
            let data = vm._dataContainer.dataCopy;
            
            const xScale = vm._xScale;
            const yScale = vm._yScale;
            let cScale;
            if(vm.hasC) {
                cScale = vm._cScale;
            }

            let xScaleFunc = d3_scaleLinear;
            if(vm.logX) {
                xScaleFunc = d3_scaleLog;
            }

            const x = xScaleFunc()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            vm.highlightXScale = x;
            
            let yScaleFunc = d3_scaleLinear;
            if(vm.logY) {
                yScaleFunc = d3_scaleLog;
            }
            
            const y = yScaleFunc()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            vm.highlightYScale = y;
            
            
            /*
             * Scale up the canvas
             */
            var canvas;
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
             * Draw the points
             */
            const twoCircleArray = [];
            data.forEach((d) => {
                const circle = two.makeCircle(x(d[vm.x]), y(d[vm.y]), vm.pointSize);

                if(this.hasC) {
                    circle.fill = cScale.color(d[vm.c]);
                    circle.stroke = cScale.color(d[vm.c]);
                } else {
                    circle.fill = vm.pointColor;
                    circle.stroke = vm.pointColor;
                }

                twoCircleArray.push(circle);
            });

            const twoCircleGroup = two.makeGroup(twoCircleArray);
            twoCircleGroup.linewidth = 1;
            twoCircleGroup.opacity = 1;

            if(!vm.fillPoints) {
                twoCircleGroup.noFill();
            }

            two.update();

            if(!canvas) {
                /* Ignore interactivity if no canvas. In this case an SVG was probably passed in */
                return;
            }

            /*
             * Prepare for interactivity
             */

            const points = data.map((d) => [x(d[vm.x]), y(d[vm.y])]);
            const delaunay = getDelaunay(points, true);

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
                    vm.tooltip(mouseViewportX, mouseViewportY, node[vm.x], node[vm.y], node[vm.c]); 
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
                        vm.clickHandler(node[vm.x], node[vm.y], node[vm.c]); 
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