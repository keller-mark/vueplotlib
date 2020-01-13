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
        <div v-show="this.highlightY !== null"
            :style="{
                'height': (this.highlightHeight - 0.5) + 'px', 
                'width': (this.highlightWidth - 0.5) + 'px', 
                'top': (this.pMarginTop + this.highlightY - 0.5) + 'px',
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
import { TOOLTIP_DEBOUNCE, BAR_WIDTH_MIN } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';
import ContinuousScale from './../../scales/ContinuousScale.js';
import CategoricalScale from './../../scales/CategoricalScale.js';

let uuid = 0;
/**
 * @prop {string} dataArray An array of data keys.
 * @prop {string} cArray An array of color-scale variable keys.
 * @prop {string} z The observation-scale variable key.
 * @prop {string} o The observation (observation-scale domain element of interest).
 * @prop {number} rectMargin The margin between each rect.
 * @prop {number} rectSize The size of rects (only used if text values are enabled).
 * @prop {boolean} disableText Whether to disable the rendering of text for each value.
 * @prop {boolean} disableTooltip Whether to disable tooltips. Default: false
 * @extends mixin
 * 
 * @example
 * <MultiDataRectPlot
 *      :dataArray="['BRCA1', 'BRCA2', 'NTHL1']"
 *      :cArray="['mut_class', 'mut_class', 'mut_class']"
 *      z="sample_id" 
 *      o="SA12345"
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
    name: 'MultiDataRectPlot',
    mixins: [mixin],
    props: {
        'dataArray': {
            type: Array
        },
        'cArray': {
            type: Array
        },
        'z': { // observation scale
            type: String
        },
        'o': { // observation value
            type: String
        },
        'rectMargin': {
            type: Number, 
            default: 4
        },
        'rectSize': {
            type: Number
        },
        'textSize': {
            type: Number,
            default: 12
        },
        'textColor': {
            type: String,
            default: "#000"
        },
        'disableText': {
            type: Boolean,
            default: true
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
                c: '',
                cName: '',
            },
            highlightYScale: null,
            highlightY: null,
            highlightHeight: null,
            highlightWidth: null,
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
        this._cScales = this.cArray.map((cKey) => {
            const cScale = this.getScale(cKey);
            console.assert(cScale instanceof AbstractScale);
            return cScale;
        });
        
        this._zScale = this.getScale(this.z);
        console.assert(this._zScale instanceof CategoricalScale);

        // Subscribe to event publishers here
        this._zScale.onUpdate(this.uuid, this.drawPlot);
        this._cScales.forEach((cScale) => {
            cScale.onUpdate(this.uuid, this.drawPlot);
        });

        // Subscribe to data mutations here
        this._dataContainers.forEach((dataContainer) => {
            dataContainer.onUpdate(this.uuid, this.drawPlot);
        });

        // Subscribe to highlights here
        this._zScale.onHighlight(this.uuid, this.highlight);
        this._zScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.drawPlot();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._cScales.forEach((cScale) => {
            cScale.onUpdate(this.uuid, null);
        });
        this._zScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._dataContainers.forEach((dataContainer) => {
            dataContainer.onUpdate(this.uuid, null);
        });

        // Unsubscribe to highlights here
        this._zScale.onHighlight(this.uuid, null);
        this._zScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        o() {
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
        tooltip(mouseX, mouseY, z, c, i) {
            // Set values
            this.tooltipInfo.z = this._zScale.toHuman(z);
            this.tooltipInfo.c = this._cScales[i].toHuman(c);
            this.tooltipInfo.cName = this._cScales[i].name

            // Set position
            if(!this.disableTooltip) {
                this.tooltipPosition.left = mouseX;
                this.tooltipPosition.top = mouseY;
            }

            // Dispatch highlights
            this._zScale.emitHighlight(z);
            this._cScales[i].emitHighlight(c);
        },
        tooltipDestroy() {
            this.tooltipHide();

            // Destroy all highlights here
            this._zScale.emitHighlightDestroy();
            this._cScales.forEach((cScale) => {
                cScale.emitHighlightDestroy();
            });
        },
        highlight() {
            this.highlightXY = null;
        },
        highlightDestroy() {
            this.highlightXY = null;
        },
        drawPlot(d3Node) {
            const vm = this;

            if(vm._dataContainers.length !== vm._cScales.length || vm._dataContainers.reduce((a, h) => (a || h.isLoading), false) || vm._cScales.reduce((a, h) => (a || h.isLoading), false) || vm._zScale.isLoading) {
                return;
            }
            
            const cScales = vm._cScales;

            const point = vm._dataContainers.map((dc) => dc.dataCopy.find((el) => el[vm.z] === vm.o)); // the single data point
            
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
             * Draw the rect
             */

            // Compute sizes.

            const numRects = point.length;

            const y = d3_scaleBand()
                .domain(range(numRects))
                .range([0, vm.pHeight]);

            let rectHeight, rectWidth, rectMargin, textWidth;

            rectMargin = vm.rectMargin;
            

            rectHeight = vm.pHeight / numRects;
            rectWidth = vm.pWidth;

            if(rectHeight - rectMargin <= BAR_WIDTH_MIN) {
                rectMargin = 0;
            }

            if(!vm.disableText && vm.rectSize > 0) {
                rectWidth = vm.rectSize;
            }
            textWidth = vm.pWidth - rectWidth;

            vm.highlightHeight = rectHeight;
            vm.highlightWidth = vm.pWidth;

            // Compute offsets if text will be on one side.
            let textOffsetX = 0;

            if(!vm.disableText && vm.rectSize > 0) {
                textOffsetX = rectWidth;
            }

            point.forEach((pointValue, i) => {
                const d = point[i][vm.cArray[i]];
                if(
                    AbstractScale.isUnknown(d) ||
                    (
                        (cScales[i] instanceof CategoricalScale && cScales[i].domainFiltered.includes(d))
                        || 
                        (cScales[i] instanceof ContinuousScale && cScales[i].domainFiltered[0] <= d && cScales[i].domainFiltered[1] >= d)
                    )
                ) {
                    const col = genColor();
                    colToNode[col] = { "i": i, "c": d };
                    contextHidden.fillStyle = col;

                    const textValue = this._cScales[i].toHuman(d);

                    const rect = two.makeRectangle(
                        0.5 + rectWidth/2, y(i) + rectHeight/2, 
                        rectWidth, rectHeight - rectMargin
                    );
                    contextHidden.fillRect(
                        0.5, y(i), 
                        rectWidth, rectHeight
                    );

                    const text = two.makeText(
                        textOffsetX + 4, y(i) + (rectHeight/2) + 7, 
                        textWidth, rectHeight, textValue
                    );

                    text.textalign = "left";
                    rect.fill = cScales[i].color(d);
                    rect.noStroke();

                    text.fontsize = vm.textSize;
                    text.fill = vm.textColor;
                }
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
                    vm.tooltip(mouseViewportX, mouseViewportY, vm.o, node["c"], node["i"]); 
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
                        vm.clickHandler(vm.o, node["c"]);
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