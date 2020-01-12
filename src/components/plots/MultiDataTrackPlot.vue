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
                'left': (this.pMarginLeft + this.highlightX1 + 1) + 'px'
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
                    <th>{{ this.tooltipInfo.cName }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import Two from '../../two.js';
import { scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select, create as d3_create } from 'd3-selection';
import { mouse as d3_mouse, event as d3_event } from 'd3';
import debounce from 'lodash/debounce';
import range from 'lodash/range';
import { TOOLTIP_DEBOUNCE, BAR_WIDTH_MIN, BAR_HEIGHT_MIN, BAR_MARGIN_DEFAULT } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} x The x-scale variable key.
 * @prop {string} dataArray An array of data keys.
 * @prop {string} cArray An array of color-scale keys.
 * @prop {number} barMarginX The value for the horizontal margin between bars. Default: 2
 * @prop {number} barMarginY The value for the vertical margin between bars. Default: 2
 * @extends mixin
 * 
 * @example
 * <MultiDataTrackPlot
 *      x="sample_id" 
 *      :dataArray="['gene_A', 'gene_B', 'gene_C']"
 *      :cArray="['mut_class', 'mut_class', 'mut_class']"
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
    name: 'MultiDataTrackPlot',
    mixins: [mixin],
    props: {
        'x': {
            type: String
        },
        'dataArray': {
            type: Array
        },
        'cArray': {
            type: Array
        },
        'barMarginX': {
            type: Number, 
            default: BAR_MARGIN_DEFAULT
        },
        'barMarginY': {
            type: Number, 
            default: 4
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                c: '',
                cName: '',
            },
            highlightX1: null,
            highlightX2: null,
            highlightY1: null,
            highlightY2: null,
            highlightXScale: null,
            highlightYScale: null,
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
        this._dataContainers = this.dataArray.map((dataKey) => {
            const dataContainer = this.getData(dataKey);
            console.assert(dataContainer instanceof DataContainer);
            return dataContainer;
        });

        // Set scale variables
        this._xScale = this.getScale(this.x);
        console.assert(this._xScale instanceof AbstractScale);
        this._cScales = this.cArray.map((cKey) => {
            const cScale = this.getScale(cKey);
            console.assert(cScale instanceof AbstractScale);
            return cScale;
        });

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._cScales.forEach((cScale) => {
            cScale.onUpdate(this.uuid, this.drawPlot);
        });

        // Subscribe to data mutations here
        this._dataContainers.forEach((dataContainer) => {
            dataContainer.onUpdate(this.uuid, this.drawPlot);
        });

        // Subscribe to highlights here
        this._xScale.onHighlight(this.uuid, this.highlightX);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._xScale.onUpdate(this.uuid, null);
        this._cScales.forEach((cScale) => {
            cScale.onUpdate(this.uuid, null);
        });
        
        // Unsubscribe to data mutations here
        this._dataContainers.forEach((dataContainer) => {
            dataContainer.onUpdate(this.uuid, null);
        });

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        barMarginX() {
            this.drawPlot();
        },
        barMarginY() {
            this.drawPlot();
        },
        dataArray() {
            this._dataContainers.forEach((dataContainer) => {
                dataContainer.onUpdate(this.uuid, null);
            });

            this._dataContainers = this.dataArray.map((dataKey) => {
                const dataContainer = this.getData(dataKey);
                console.assert(dataContainer instanceof DataContainer);
                return dataContainer;
            });

            this._dataContainers.forEach((dataContainer) => {
                dataContainer.onUpdate(this.uuid, this.drawPlot);
            });

            this.drawPlot();
        },
        cArray() {
            this._cScales.forEach((cScale) => {
                cScale.onUpdate(this.uuid, null);
            });

            this._cScales = this.cArray.map((cKey) => {
                const cScale = this.getScale(cKey);
                console.assert(cScale instanceof AbstractScale);
                return cScale;
            });

            this._cScales.forEach((cScale) => {
                cScale.onUpdate(this.uuid, this.drawPlot);
            });
        }
    },
    methods: {
        tooltip(mouseX, mouseY, x, i, c) {
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.c = this._cScales[i].toHuman(c);
            this.tooltipInfo.cName = this._cScales[i].name;

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._xScale.emitHighlight(x);
            this._cScales[i].emitHighlight(c);
        },
        tooltipDestroy() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._cScales.forEach((cScale) => {
                cScale.emitHighlightDestroy();
            });
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

            if(vm._dataContainers.length !== vm._cScales.length || vm._dataContainers.reduce((a, h) => (a || h.isLoading), false) || vm._cScales.reduce((a, h) => (a || h.isLoading), false) || vm._xScale.isLoading) {
                return;
            }
            
            const xScale = vm._xScale;
            const cScales = vm._cScales;
            const datas = vm._dataContainers
                .map(dc => dc.dataCopy)
                .map(d => d.filter((el) => xScale.domainFiltered.includes(el[vm.x])));

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);

            vm.highlightXScale = x;
            
            const numRows = vm._dataContainers.length;
            const y = d3_scaleBand()
                .domain(range(numRows))
                .range([0, vm.pHeight]);

            vm.highlightYScale = y;

            const barWidth = vm.pWidth / xScale.domainFiltered.length;
            vm.barWidth = barWidth;

            const barHeight = vm.pHeight / numRows;
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
            
            vm.dataArray.forEach((dataKey, i) => {
                datas[i].forEach((d) => {

                    const col = genColor();
                    colToNode[col] = { "x": d[vm.x], "i": i, "c": d[vm.cArray[i]] };
                    contextHidden.fillStyle = col;

                    const rect = two.makeRectangle(
                        x(d[vm.x]) + (barMarginX/2) + (barWidth - barMarginX)/2 + 0.5, 
                        y(i) + (barMarginY/2) + (barHeight - barMarginY)/2, 
                        barWidth - barMarginX, 
                        barHeight - barMarginY
                    );
                    rect.fill = cScales[i].color(d[vm.cArray[i]]);
                    rect.noStroke();

                    contextHidden.fillRect(x(d[vm.x]) + 0.5, y(i), barWidth, barHeight);
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
                    vm.tooltip(mouseViewportX, mouseViewportY, node["x"], node["i"], node["c"]); 
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
                        vm.clickHandler(node["x"], node["i"], node["c"]);
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