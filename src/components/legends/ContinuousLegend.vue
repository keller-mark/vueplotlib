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
import { mouse as d3_mouse } from 'd3';

import { saveSvgAsPng } from 'save-svg-as-png';

import ContinuousScale from './../../scales/ContinuousScale.js';
import HistoryEvent from './../../history/HistoryEvent.js';
import HistoryStack from './../../history/HistoryStack.js';

import ColorScalePicker from './../modals/ColorScalePicker.vue';
import Axis from './../axes/Axis.vue';

import { PAINT_BUCKET_PATH } from './../../icons.js';
import { EVENT_TYPES, EVENT_SUBTYPES } from '../../history/base-events.js';


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
        drawLegend() {
            const vm = this;
            vm.removeLegend();
            
            const varScale = vm._varScale;
            //const stack = vm._stack;

            const titleHeight = 30
            const textOffset = 30;
            const marginX = 4;

            /*
             * Create the SVG elements
             */
            

            const container = d3_select(vm.legendSelector)
                .append("svg")
                    .attr("width", vm.computedWidth)
                    .attr("height", vm.computedHeight);
            
            const legend = container.append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");

            
            
            const title = legend.append("g")
                .attr("width", vm.lWidth);
            
            const titleText = title.append("text")
                .style("text-anchor", "start")
                .text(varScale.name);
            const titleTextBbox = titleText.node().getBBox();
            titleText.attr("transform", "translate(" + 0 + "," + titleTextBbox.height + ")");

            title.append("path")
                .attr("d", PAINT_BUCKET_PATH)
                .attr("width", 20)
                .attr("height", 20)
                .attr("transform", "translate(" + (vm.lWidth - 1.5*marginX) + "," + (titleTextBbox.height/2) + ") scale(-0.7 0.7)")
                .style("cursor", "pointer")
                .attr("fill", "silver")
                .on("click", () => {
                    vm.showColorScalePicker = true;
                });

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
        downloadLegend() {
            let node = d3_select(this.legendSelector).select("svg").node();
            saveSvgAsPng(node, this.legendElemID + ".png");
        }
    }
}
</script>

<style>
@import '../../style/axis-style.css';
</style>