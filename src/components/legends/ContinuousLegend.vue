<template>
    <div
        class="vdp-legend" 
        :style="{
            'height': this.computedHeight + 'px', 
            'width': this.computedWidth + 'px',
            'top': this.computedTop + 'px',
            'left': this.computedLeft + 'px',
            'position': 'relative'
        }"
    >
        <div 
            :id="this.legendElemID"
            :style="{
                'position': 'absolute'
            }"
        ></div>
        <div>
            <Axis
                ref="continuous-legend-axis"
                :pWidth="30"
                :pHeight="this.lHeight - 30"
                :pMarginTop="30"
                :pMarginLeft="0"
                :pMarginRight="this.lWidth - 100"
                :pMarginBottom="5"
                :variable="this.variable"
                side="right" 
                :getScale="this.getScale"
                :getStack="this.getStack"
                :showLabel="false"
            />
        </div>

        <ColorScalePicker v-if="showColorScalePicker" @close="showColorScalePicker = false" :onSelect="changeColorScale" />
    </div>
</template>

<script>
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse, create as d3_create } from 'd3';

import ContinuousScale from './../../scales/ContinuousScale.js';
import HistoryEvent from './../../history/HistoryEvent.js';
import HistoryStack from './../../history/HistoryStack.js';

import ColorScalePicker from './../modals/ColorScalePicker.vue';
import Axis from './../axes/Axis.vue';

import { PAINT_BUCKET_PATH, DOWNLOAD_PATH } from './../../icons.js';
import { EVENT_TYPES, EVENT_SUBTYPES } from '../../history/base-events.js';

import { downloadSvg } from './../../helpers.js';


let uuid = 0;
/**
 * @prop {string} variable The legend variable key.
 * @prop {number} lWidth The legend width.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} getStack Function that returns a HistoryStack instance.
 * @prop {boolean} disableBrushing Whether to disable brushing functionality and hide the zoomed-out "context" view. Default: false
 * 
 * @example
 * <ContinuousLegend
 *      variable="y"
 *      :lWidth="500"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *  />
 */
export default {
    name: 'ContinuousLegend',
    components: {
        Axis,
        ColorScalePicker
    },
    props: {
        'variable': {
            type: String
        },
        'lWidth': {
            type: Number
        },
        'lItemHeight': {
            type: Number,
            default: 20
        },
        'getScale': {
            type: Function
        },
        'getStack': {
            type: Function
        },
        'showDownloadButton': {
            type: Boolean,
            default: false
        },
        'downloadName': {
            type: String,
            default: 'legend'
        }
    },
    data() {
        return {
            lHeight: 200,
            highlightScale: null,
            showColorScalePicker: false
        }
    },
    computed: {
        legendElemID: function() {
            return 'l_cntns_' + this.uuid;
        },
        legendSelector: function() {
            return "#" + this.legendElemID;
        },
        gradientElemID: function() {
            return 'l_cntns_g_' + this.uuid;
        },
        gradientSelector: function() {
            return "#" + this.gradientElemID;
        },
        computedHeight: function() {
            return this.lHeight;
        },
        computedWidth: function() {
            return this.lWidth;
        },
        computedTop: function() {
            return 0;
        },
        computedLeft: function() {
            return 0;
        },
        computedTranslateX: function() {
            return 0;
        },
        computedTranslateY: function() {
            return 0;
        }
    },
    watch: {
        lWidth: function () {
            this.drawLegend();
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        
        // Set the scale variable
        this._varScale = this.getScale(this.variable);
        console.assert(this._varScale instanceof ContinuousScale);
        // Subscribe to event publishers
        this._varScale.onUpdate(this.uuid, this.drawLegend);

        this._stack = this.getStack();
        console.assert(this._stack instanceof HistoryStack);

        // Subscribe to highlights here
        this._varScale.onHighlight(this.uuid, this.highlightY);
        this._varScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.drawLegend();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._varScale.onUpdate(this.uuid, null);
        this._varScale.onHighlight(this.uuid, null);
        this.removeLegend();
    },
    methods: {
        removeLegend() {
            d3_select(this.legendSelector).select("svg").remove();
        },
        highlightY(value) {
            if(this.highlightScale) {
                const highlightY1 = this.highlightScale(value) - 0.5;
                const highlight = d3_select(this.legendSelector).select("svg").select(".highlight");
                highlight.attr("transform", "translate(0," + highlightY1 + ")");
                highlight.selectAll("rect")
                    .attr("fill-opacity", 1);
            }
        },
        highlightDestroy() {
            const highlight = d3_select(this.legendSelector).select("svg").select(".highlight");
            highlight.selectAll("rect")
                .attr("fill-opacity", 0);
        },
        changeColorScale(scaleKey) {
            this._varScale.setColorScaleByKey(scaleKey);

            this._stack.push(new HistoryEvent(
                EVENT_TYPES.SCALE,
                EVENT_SUBTYPES.SCALE_COLOR_SCALE,
                this._varScale.id,
                "setColorScaleByKey",
                [scaleKey]
            ));
        },
        drawLegend(d3Node) {
            const vm = this;
            vm.removeLegend();
            
            const varScale = vm._varScale;
            //const stack = vm._stack;

            const titleHeight = 30
            const textOffset = 30;
            const marginX = 4;
            const buttonWidth = 16;

            /*
             * Create the SVG elements
             */
            let container;
            if(d3Node) {
                container = d3Node;
            } else {
                container = d3_select(vm.legendSelector)
                    .append("svg")
                        .attr("width", vm.computedWidth)
                        .attr("height", vm.computedHeight);
            }
            
            const legend = container.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");
            
            
            const title = legend.append("g")
                .attr("width", vm.lWidth);
            
            const titleText = title.append("text")
                .style("text-anchor", "start")
                .style("font-family", "Avenir")
                .text(varScale.name);
            const titleTextBbox = titleText.node().getBBox();
            titleText.attr("transform", "translate(" + 0 + "," + titleTextBbox.height + ")");
                

            const legendInner = legend.append("g")
                .attr("class", "legend-inner");

            const innerHeight = (vm.lHeight - titleHeight);

            const gradient = container.append("defs")
                .append("linearGradient")
                    .attr("gradientTransform", "rotate(90)")
                    .attr("id", vm.gradientElemID);

            const nStops = 10;
            const domainRange = varScale.domainFiltered[1] - varScale.domainFiltered[0];
            const domainStep = domainRange/nStops;

            for(let i = 0; i <= nStops; i++) {
                let stopValue = varScale.domainFiltered[0] + (i*domainStep);
                gradient.append("stop")
                    .attr("offset", ((100 / nStops) * i) + "%")
                    .attr("stop-color", varScale.color(stopValue));
            }
            
            legendInner.append("rect")
                .attr("x", -textOffset)
                .attr("y", -innerHeight - titleHeight)
                .attr("width", (textOffset - marginX))
                .attr("height", innerHeight)
                .attr("fill", "url(" + vm.gradientSelector + ")")
                .attr("transform", "rotate(180)");

            if(d3Node) {
                return; /* SVG passed in to function, so not interactive */
            }

            const colorScaleButtonG = title
                .append("g")
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("transform", "translate(" + (vm.lWidth - 1.5*marginX) + "," + (titleTextBbox.height/2) + ") scale(-0.7 0.7)")
                    .style("cursor", "pointer")
                    .on("click", () => {
                        vm.showColorScalePicker = true;
                    });
            
            colorScaleButtonG.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", "transparent");
            colorScaleButtonG.append("path")
                .attr("d", PAINT_BUCKET_PATH)
                .attr("fill", "silver")
            
            if(vm.showDownloadButton) {
                const downloadButtonG = title
                    .append("g")
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("transform", "translate(" + (vm.lWidth - 2*(buttonWidth) + marginX/2) + "," + (titleTextBbox.height/2) + ") scale(-0.7 0.7)")
                        .style("cursor", "pointer")
                        .on("click", vm.downloadViaButton);
                    
                    downloadButtonG.append("rect")
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("fill", "transparent");
                    downloadButtonG.append("path")
                        .attr("d", DOWNLOAD_PATH)
                        .attr("fill", "silver");
                        
            }
            
            const hoverRect = legendInner.append("rect")
                .attr("x", marginX)
                .attr("y", titleHeight)
                .attr("width", (textOffset - marginX))
                .attr("height", innerHeight)
                .attr("fill", "transparent");

            const highlight = legendInner.append("g")
                .attr("class", "highlight")
                .attr("transform", "translate(" + marginX + "," + titleHeight + ")");
            
            highlight.append("rect")
                .attr("x", marginX)
                .attr("y", titleHeight)
                .attr("width", (textOffset - marginX))
                .attr("height", "1px")
                .attr("fill", "black")
                .attr("fill-opacity", 0);
            
            
            const hoverRectNode = hoverRect.node();

            const y = d3_scaleLinear()
                .domain(varScale.domainFiltered)
                .range([innerHeight, 0]);

            vm.highlightScale = y;
            
            

            hoverRect.on("mousemove", () => {
                const mouse = d3_mouse(hoverRectNode);
                const mouseY = mouse[1] - titleHeight;
                const yVal = y.invert(mouseY);
                if(yVal >= varScale.domain[0] && yVal <= varScale.domain[1]) {
                    varScale.emitHighlight(yVal);
                }
            })
            .on("mouseleave", () => {
                varScale.emitHighlightDestroy();
            });
        },
        download() {
            const svg = d3_create("svg")
                .attr("width", this.computedWidth)
                .attr("height", this.computedHeight+5)
                .attr("viewBox", `0 0 ${this.computedWidth} ${this.computedHeight+5}`);
            
            this.drawLegend(svg);
            this.drawLegend();

            const axisWidth = this.lWidth - 100;
            const axisHeight = this.lHeight - 30 + 5;

            const axisSvg = d3_create("svg")
                .attr("width", axisWidth)
                .attr("height", axisHeight);

            this.$refs["continuous-legend-axis"].drawAxis(axisSvg, true);
            this.$refs["continuous-legend-axis"].drawAxis();

            const axisG = svg
                .append("g")
                    .attr("class", 'download-g-legend-axis')
                    .attr("width", axisWidth)
                    .attr("height", axisHeight)
                    .attr("transform", `translate(${30},${0})`);
            
            axisG.html(axisSvg.node().innerHTML);

            return svg;
        },
        downloadViaButton() {
            const svg = this.download();
            downloadSvg(svg, this.downloadName);
        }
    }
}
</script>

<style>
@import '../../style/axis-style.css';
</style>