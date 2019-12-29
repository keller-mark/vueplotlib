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
        <div v-show="this.highlightY1 !== null"
            :style="{
                'height': '1px', 
                'width': (this.pWidth) + 'px',
                'top': (this.pMarginTop + this.highlightY1 - 0.5) + 'px',
                'left': (this.pMarginLeft) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div v-show="this.highlightY2 !== null"
            :style="{
                'height': '1px', 
                'width': (this.pWidth) + 'px',
                'top': (this.pMarginTop + this.highlightY2 - 0.5) + 'px',
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
                <tr>
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Two from '../../two.js';
import { hierarchy as d3_hierarchy } from 'd3-hierarchy';
import { scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE, BAR_WIDTH_MIN, BAR_HEIGHT_MIN, BAR_MARGIN_X_DEFAULT, BAR_MARGIN_Y_DEFAULT } from './../../constants.js';
import { getRetinaRatio, filterHierarchy } from './../../helpers.js';


import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} h The hierarchy data container key (passed to getData).
 * @prop {string} x The x-scale variable key.
 * @prop {string} y The y-scale variable key.
 * @prop {string} c The color-scale variable key.
 * @prop {number} barMarginX The value for the horizontal margin between bars. Default: 2
 * @prop {number} barMarginY The value for the vertical margin between bars. Default: 2
 * @extends mixin
 * 
 * @example
 * <HierarchicalMultiTrackPlot
 *      data="exposures_data"
 *      h="clustering"
 *      x="sample_id" 
 *      y="signature"
 *      c="exposure"
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
    name: 'HierarchicalMultiTrackPlot',
    mixins: [mixin],
    props: {
        'h': {
            type: String // hierarchy
        },
        'x': {
            type: String
        },
        'y': {
            type: String
        },
        'c': {
            type: String // color
        },
        'barMarginX': {
            type: Number, 
            default: BAR_MARGIN_X_DEFAULT
        },
        'barMarginY': {
            type: Number, 
            default: BAR_MARGIN_Y_DEFAULT
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                y: '',
                c: ''
            },
            highlightXScale: null,
            highlightYScale: null,
            highlightX1: null,
            highlightX2: null,
            highlightY1: null,
            highlightY2: null,
            barWidth: 0,
            barHeight: 0
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
        this._hierarchyContainer = this.getData(this.h);
        console.assert(this._hierarchyContainer instanceof DataContainer);
        
        // Set scale variables
        this._xScale = this.getScale(this.x);
        this._yScale = this.getScale(this.y);
        this._cScale = this.getScale(this.c);
        console.assert(this._xScale instanceof AbstractScale);
        console.assert(this._yScale instanceof AbstractScale);
        console.assert(this._cScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        this._cScale.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);
        this._hierarchyContainer.onUpdate(this.uuid, this.drawPlot);

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
        this._cScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);
        this._hierarchyContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._yScale.onHighlight(this.uuid, null);
        this._yScale.onHighlightDestroy(this.uuid, null);

        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        barMarginX() {
            this.drawPlot();
        },
        barMarginY() {
            this.drawPlot();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, x, y, c) {
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.y = this._yScale.toHuman(y);
            this.tooltipInfo.c = this._cScale.toHuman(c);

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._xScale.emitHighlight(x);
            this._yScale.emitHighlight(y);
            this._cScale.emitHighlight(c);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
            this._cScale.emitHighlightDestroy();
        },
        highlightX(value) {
            if(this.highlightXScale) {
                this.highlightX1 = this.highlightXScale(value);
                this.highlightX2 = this.highlightXScale(value) + this.barWidth;
            }
        },
        highlightY(value) {
            if(this.highlightYScale) {
                this.highlightY1 = this.highlightYScale(value);
                this.highlightY2 = this.highlightYScale(value) + this.barHeight;
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightX2 = null;
            this.highlightY1 = null;
            this.highlightY2 = null;
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._hierarchyContainer.isLoading || vm._xScale.isLoading || vm._yScale.isLoading || vm._cScale.isLoading) {
                return;
            }
            
            let data = this._dataContainer.dataCopy;
            let hierarchyData = vm._hierarchyContainer.dataCopy;
            
            const xScale = this._xScale;
            const yScale = this._yScale;
            const cScale = this._cScale;

            data = data.filter((el) => xScale.domainFiltered.includes(el[vm.x]));

            // Filter the hierarchy
            hierarchyData = filterHierarchy(hierarchyData, xScale.domainFiltered);
            const root = d3_hierarchy(hierarchyData);
            const leaves = root.leaves();
            // Use leaves to sort x-axis by hierarchy
            const xDomainSortedByLeaf = leaves.map((el) => el.data.name);

            const x = d3_scaleBand()
                .domain(xDomainSortedByLeaf)
                .range([0, vm.pWidth]);
            
            vm.highlightXScale = x;
            
            const y = d3_scaleBand()
                .domain(yScale.domainFiltered.slice().reverse())
                .range([vm.pHeight, 0]);

            vm.highlightYScale = y;

            

            const barWidth = vm.pWidth / xScale.domainFiltered.length;
            vm.barWidth = barWidth;

            const barHeight = vm.pHeight / yScale.domainFiltered.length;
            vm.barHeight = barHeight;
              
            
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
             * Draw the track
             */
            let barMarginX = vm.barMarginX;
            if(barWidth - vm.barMarginX <= BAR_WIDTH_MIN) {
                barMarginX = 0;
            }
            let barMarginY = vm.barMarginY;
            if(barHeight - vm.barMarginY <= BAR_HEIGHT_MIN) {
                barMarginY = 0;
            }
            data.forEach((d) => {
                yScale.domainFiltered.forEach((yVar) => {
                    const col = genColor();
                    colToNode[col] = { "x": d[vm.x], "y": yVar, "c": d[yVar] };
                    contextHidden.fillStyle = col;

                    const rect = two.makeRectangle(x(d[vm.x]) + (barMarginX/2) + (barWidth - barMarginX)/2, y(yVar) + (barMarginY/2) + (barHeight - barMarginY)/2, barWidth - barMarginX, barHeight - barMarginY);
                    rect.fill = cScale.color(d[yVar]);
                    rect.noStroke();
                    contextHidden.fillRect(x(d[vm.x]), y(yVar), barWidth, barHeight);
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
                    vm.tooltip(mouseViewportX, mouseViewportY, node["x"], node["y"], node["c"]); 
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
                        vm.clickHandler(node["x"], node["y"], node["c"]);
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