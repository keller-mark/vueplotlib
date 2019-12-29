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
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
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
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getDelaunay } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import ContinuousScale from './../../scales/ContinuousScale.js';

import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} deathVariable The survival "days to death" variable key. Default: "days_to_death"
 * @prop {string} followupVariable The survival "days to last followup" variable key. Default: "days_to_last_followup"
 * @prop {string} s The key for the data containing the variable to stratify by.
 * @prop {string} variable The key for the variable to stratify by in the s dataset.
 * @prop {string} c The color-scale (line-scale) variable key. Should contain the categories of the stratified variable. Must be categorical.
 * @prop {string} x The x-scale variable key. Should represent survival time. Must be continuous.
 * @prop {string} y The y-scale variable key. Should represent survival percentage. Must be continuous.
 * @prop {string} o The observation-scale variable key. Required in order to match the survival data with the stratification data.
 * @prop {number} lineWidth The line width. Default: 2
 * @prop {number} tickHeight The tick height. Default: 8
 * @extends mixin
 * 
 * @example
 * <StratifiedKaplanMeierPlot
 *      data="survival_data"
 *      s="dominant_signature_data"
 *      variable="dominant_signature"
 *      c="signatures"
 *      x="survival_time"
 *      y="survival_pct"
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
    name: 'StratifiedKaplanMeierPlot',
    mixins: [mixin],
    props: {
        'deathVariable': {
            type: String,
            default: "days_to_death"
        },
        'followupVariable': {
            type: String,
            default: "days_to_last_followup"
        },
        's': { // stratification data
            type: String
        },
        'variable': { // stratification variable
            type: String
        },
        'c': { // stratification variable value scale - for the different lines (and line colors) on the plot
            type: String
        },
        'x': { // survival time scale
            type: String
        },
        'y': { // survival percentage scale
            type: String
        },
        'o': { // observation
            type: String
        },
        'lineWidth': {
            type: Number,
            default: 2
        },
        'tickHeight': {
            type: Number,
            default: 8
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                y: '',
                o: '',
                c: ''
            },
            highlightX1: null,
            highlightY1: null,
            highlightXScale: null,
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

        // Set scale variables
        this._yScale = this.getScale(this.y);
        console.assert(this._yScale instanceof ContinuousScale);

        this._xScale = this.getScale(this.x);
        console.assert(this._xScale instanceof ContinuousScale);

        this._oScale = this.getScale(this.o);
        console.assert(this._oScale instanceof AbstractScale);

        this._cScale = this.getScale(this.c);
        console.assert(this._cScale instanceof AbstractScale);


        // Subscribe to event publishers here
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._oScale.onUpdate(this.uuid, this.drawPlot);
        this._cScale.onUpdate(this.uuid, this.drawPlot);
        

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
        this._cScale.onUpdate(this.uuid, null);

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
        lineWidth() {
            this.drawPlot();
        },
        tickHeight() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, o, x, y, c) {
            // Set values
            this.tooltipInfo.o = this._oScale.toHuman(o);
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.y = this._yScale.toHuman(y);
            this.tooltipInfo.c = this._cScale.toHuman(c);

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._oScale.emitHighlight(o);
            this._xScale.emitHighlight(x);
            this._yScale.emitHighlight(y);
            this._cScale.emitHighlight(c);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
            this._oScale.emitHighlightDestroy();
            this._cScale.emitHighlightDestroy();
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

            if(vm._dataContainer.isLoading || vm._stratificationDataContainer.isLoading || vm._xScale.isLoading || vm._yScale.isLoading || vm._oScale.isLoading || vm._cScale.isLoading) {
                return;
            }
            
            let data = this._dataContainer.dataCopy;
            let stratificationData = this._stratificationDataContainer.dataCopy;

            const xScale = vm._xScale;
            const yScale = vm._yScale;
            const cScale = vm._cScale;
            const oScale = vm._oScale;
            
            data = data.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            stratificationData = stratificationData.filter((el) => oScale.domainFiltered.includes(el[vm.o]));
            

            const x = d3_scaleLinear()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            vm.highlightXScale = x;
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);
            
            vm.highlightYScale = y;
              

            
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

             /*
             * Prepare for interactivity
             */
            const points = [];
            const pointsData = [];

            
            /*
             * Match the survival data to the stratification data
             */
            let matchedData = [];
            data.forEach((dEl) => {
                let sEl = stratificationData.find((sEl) => sEl[vm.o] === dEl[vm.o]);
                if(sEl !== undefined) {
                    matchedData.push({
                        "dEl": dEl,
                        "sEl": sEl 
                    });
                }
            });

            /*
             * Draw the points
             */
            cScale.domainFiltered.forEach((cEl) => {
                const cData = matchedData
                    .filter(el => el["sEl"][vm.variable] === cEl)
                    .sort((aEl, bEl) => {
                        let aVal = (AbstractScale.isUnknown(aEl["dEl"][vm.deathVariable]) ? aEl["dEl"][vm.followupVariable] : aEl["dEl"][vm.deathVariable]);
                        if(AbstractScale.isUnknown(aVal)) {
                            return 1;
                        }
                        let bVal = (AbstractScale.isUnknown(bEl["dEl"][vm.deathVariable]) ? bEl["dEl"][vm.followupVariable] : bEl["dEl"][vm.deathVariable]);
                        if(AbstractScale.isUnknown(bVal)) {
                            return -1;
                        }
                        return aVal - bVal;
                    });
                const step = 100 / cData.length;

                let currSurvivalPct = 100;
                let prevXVal = 0;

                cData.forEach((match, i) => {
                    let sEl = match["sEl"];
                    let dEl = match["dEl"];

                    // Compute x and y values based on survival
                    let xVal;
                    let drop = false;
                    if(!AbstractScale.isUnknown(dEl[vm.deathVariable])) {
                        xVal = dEl[vm.deathVariable];
                    } else {
                        if(!AbstractScale.isUnknown(dEl[vm.followupVariable])) {
                            xVal = dEl[vm.followupVariable];
                            drop = true;
                        } else {
                            xVal = xScale.domain[1];
                        }
                    }

                    // Draw a horizontal line to the current time, using the previous percent
                    const horizontalLine = two.makeLine(x(prevXVal) - 1, y(currSurvivalPct), x(xVal) + 1, y(currSurvivalPct));
                    horizontalLine.linewidth = vm.lineWidth;
                    horizontalLine.stroke = cScale.color(cEl);

                    // Add a tick line if using data from followup rather than death
                    if(drop) {
                        const tickLine = two.makeLine(x(xVal), y(currSurvivalPct) - vm.tickHeight / 2, x(xVal), y(currSurvivalPct) + vm.tickHeight / 2);
                        tickLine.linewidth = vm.lineWidth;
                        tickLine.stroke = cScale.color(cEl);
                    }

                    let prevSurvivalPct = currSurvivalPct;
                    prevXVal = xVal;

                    // Draw a vertical line to the current time, using the current percent
                    if(i < cData.length - 1 && !drop) {
                        // Decrease percent
                        currSurvivalPct -= step;
                        const verticalLine = two.makeLine(x(xVal), y(prevSurvivalPct), x(xVal), y(currSurvivalPct));
                        verticalLine.linewidth = vm.lineWidth;
                        verticalLine.stroke = cScale.color(cEl);
                    }
                    points.push([x(xVal), y(currSurvivalPct)]);
                    pointsData.push({
                        "y": currSurvivalPct,
                        "o": dEl[vm.o],
                        "x": xVal,
                        "c": sEl[vm.variable]
                    });

                    
                });
            });

            two.update();

            if(d3Node) {
                /* Ignore interactivity if SVG was passed in (for download). */
                return;
            }
            
            /*
             * More prepare for interactivity
             */
            const delaunay = getDelaunay(points, true);
            
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
                    vm.tooltip(mouseViewportX, mouseViewportY, node["o"], node["x"], node["y"], node["c"]); 
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
                        vm.clickHandler(node["o"], node["x"], node["y"], node["c"]); 
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