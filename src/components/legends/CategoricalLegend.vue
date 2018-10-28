<template>
    <div 
        :id="this.legendElemID" 
        class="vdp-legend" 
        :style="{
            'height': this.computedHeight + 'px', 
            'width': this.computedWidth + 'px',
            'top': this.computedTop + 'px',
            'left': this.computedLeft + 'px'
        }"
    ></div>
</template>

<script>
import { scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { event as d3_event } from 'd3';

import { saveSvgAsPng } from 'save-svg-as-png';

import CategoricalScale from './../../scales/CategoricalScale.js';
import HistoryEvent from './../../history/HistoryEvent.js';
import HistoryStack from './../../history/HistoryStack.js';

import { COLOR_PICKER_PATH, EYE_PATH, EYE_DISABLED_PATH } from './../../icons.js';



const STYLES = Object.freeze({ "BAR": 1, "DOT": 2, "LINE": 3, "SHAPE": 4 });

let uuid = 0;
/**
 * @prop {string} variable The legend variable key.
 * @prop {string} lStyle The legend style.
 * @prop {number} lWidth The legend width.
 * @prop {number} lItemHeight The height of each legend item.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} getStack Function that returns a HistoryStack instance.
 * @prop {boolean} disableBrushing Whether to disable brushing functionality and hide the zoomed-out "context" view. Default: false
 * 
 * @example
 * <CategoricalLegend
 *      variable="y"
 *      lStyle="bar"
 *      :lWidth="500"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *  />
 */
export default {
    name: 'CategoricalLegend',
    props: {
        'variable': {
            type: String
        },
        'lStyle': {
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
            lHeight: 0,
            highlightScale: null
        }
    },
    computed: {
        legendElemID: function() {
            return 'l_ctgrcl_' + this.uuid;
        },
        legendSelector: function() {
            return "#" + this.legendElemID;
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
        // Set style enum value from style prop
        let styleString = this.lStyle.toUpperCase();
        console.assert(Object.keys(STYLES).includes(styleString));
        this._style = STYLES[styleString];
        
        // Set the scale variable
        this._varScale = this.getScale(this.variable);
        console.assert(this._varScale instanceof CategoricalScale);
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
            const highlightY1 = this.highlightScale(value) - 0.5;
            const highlight = d3_select(this.legendSelector).select("svg").select(".highlight");
            highlight.attr("transform", "translate(0," + highlightY1 + ")");
            highlight.selectAll("rect")
                .attr("fill-opacity", 1);
        },
        highlightDestroy() {
            const highlight = d3_select(this.legendSelector).select("svg").select(".highlight");
            highlight.selectAll("rect")
                .attr("fill-opacity", 0);
        },
        drawLegend() {
            const vm = this;
            vm.removeLegend();
            
            const varScale = vm._varScale;
            const stack = vm._stack;

            const titleHeight = 30
            const textOffset = 30;
            const marginX = 4;
            const marginY = 2;

            vm.lHeight = vm.lItemHeight * varScale.domain.length + titleHeight;

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

            const legendInner = legend.append("g")
                .attr("class", "legend-inner");

            const highlight = legend.append("g")
                .attr("class", "highlight")
            
            highlight.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", vm.lWidth)
                .attr("height", "1px")
                .attr("fill", "black")
                .attr("fill-opacity", 0);
            
            highlight.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", vm.lWidth)
                .attr("height", 1)
                .attr("fill", "black")
                .attr("fill-opacity", 0)
                .attr("transform", "translate(0," + (vm.lItemHeight) + ")");

            

            
            const range = [vm.lHeight, titleHeight];

            const scale = d3_scaleBand()
                .domain(varScale.domain.slice().reverse())
                .range(range);

            vm.highlightScale = scale;

            const items = legendInner.selectAll(".legend-item")
                .data(scale.domain())
                .enter()
                .append("g")
                    .attr("class", "legend-item")
                    .attr("transform", (d) => "translate(0," + scale(d) + ")")
                    .on("mouseenter", (d) => {
                        if(varScale.domainFiltered.includes(d)) {
                            varScale.emitHighlight(d);
                        }
                    })
                    .on("mouseleave", () => {
                        varScale.emitHighlightDestroy();
                    });
            
            items.append("rect")
                .attr("y", 0)
                .attr("x", 0)
                .attr("width", vm.lWidth)
                .attr("height", scale.bandwidth())
                .attr("fill", "transparent");

            items.append("text")
                .style("text-anchor", "start")
                .attr("y", scale.bandwidth() - 5)
                .attr("x", (textOffset + marginX) + "px")
                .style("font-size", "13px")
                .text((d) => varScale.toHuman(d))
                .attr("fill", (d) => varScale.domainFiltered.includes(d) ? "black" : "silver");
            
            if(vm._style === STYLES.BAR) {
                items.append("rect")
                    .attr("x", marginX)
                    .attr("y", marginY)
                    .attr("width", textOffset - marginX) 
                    .attr("height", scale.bandwidth() - 2*marginY)
                    .attr("fill", (d) => varScale.color(d))
                    .attr("fill-opacity", (d) => varScale.domainFiltered.includes(d) ? 1 : 0);
            }
                
            
            // Action buttons
            const buttonWidth = 16;

            const filterButtons = items.append("g")
                .attr("transform", "translate(" + (vm.lWidth - buttonWidth - marginX) + ",0)")
                .style("cursor", "pointer")
                .on("click", (d) => {
                    let newDomainIndices;
                    if(varScale.domainFiltered.includes(d)) {
                        // Remove element
                        let newDomain = varScale.domainFiltered.slice();
                        newDomain.splice(newDomain.indexOf(d), 1);
                        newDomainIndices = newDomain.map((el) => varScale.domain.indexOf(el));
                    } else {
                        // Add element
                        let newDomain = varScale.domainFiltered.slice();
                        newDomainIndices = newDomain.map((el) => varScale.domain.indexOf(el));
                        newDomainIndices.push(varScale.domain.indexOf(d));
                        // TODO: check if this sorting introduces other bugs. if so, maybe use (d, i)
                        // and get the index of the legend item, then use that to add
                        newDomainIndices.sort((a, b) => (a - b));
                    }
                    varScale.filter(newDomainIndices);
                    stack.push(new HistoryEvent(
                        HistoryEvent.types.SCALE,
                        varScale.id,
                        "filter",
                        [newDomainIndices]
                    ));
                });

            filterButtons.append("rect")
                .attr("x", 0)
                .attr("y", marginY)
                .attr("width", buttonWidth)
                .attr("height", scale.bandwidth() - 2*marginY)
                .attr("fill", "transparent")
                .attr("stroke", "transparent")
            
            filterButtons.append("path")
                .attr("d", (d) => (varScale.domainFiltered.includes(d) ? EYE_PATH : EYE_DISABLED_PATH))
                .attr("y", scale.bandwidth() - 5)
                .attr("x", buttonWidth / 2)
                .attr("transform", "scale(0.8 0.8)")
                .attr("fill", (d) => "silver");
            


            
            
            
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