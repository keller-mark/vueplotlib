<template>
    <div>
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

        <ColorScalePicker 
            v-if="showColorScalePicker" 
            @close="showColorScalePicker = false" 
            :onSelect="changeColorScale" 
        />
        <ColorPicker 
            v-if="showColorPicker" 
            @close="showColorPicker = false" 
            :onSelect="changeColor" 
            :initialColor="initialColor" 
        />
    </div>
</template>

<script>
import { scaleBand as d3_scaleBand } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { create as d3_create } from 'd3';


import CategoricalScale from './../../scales/CategoricalScale.js';
import HistoryEvent from './../../history/HistoryEvent.js';
import HistoryStack from './../../history/HistoryStack.js';

import ColorScalePicker from './../modals/ColorScalePicker.vue';
import ColorPicker from './../modals/ColorPicker.vue';

import { COLOR_PICKER_PATH, EYE_PATH, EYE_DISABLED_PATH, PAINT_BUCKET_PATH, DOWNLOAD_PATH } from './../../icons.js';
import { EVENT_TYPES, EVENT_SUBTYPES } from '../../history/base-events.js';

import { downloadSvg } from './../../helpers.js';

const STYLES = Object.freeze({ "BAR": 1, "DOT": 2, "LINE": 3, "SHAPE": 4 });

let uuid = 0;
/**
 * @prop {string} variable The legend variable key.
 * @prop {string} lStyle The legend style.
 * @prop {number} lWidth The legend width.
 * @prop {number} lItemHeight The height of each legend item.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} getStack Function that returns a HistoryStack instance.
 * @prop {function} clickHandler Function that is called when clicking on legend element names. Optional.
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
    components: {
        ColorScalePicker,
        ColorPicker
    },
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
        },
        'clickHandler': {
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
            lHeight: 0,
            highlightScale: null,
            showColorScalePicker: false,
            showColorPicker: false,
            initialColor: "#FFFFFF",
            changeColor: () => {}
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
            if(this.highlightScale && this.highlightScale.domain().includes(value)) {
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
            const stack = vm._stack;

            const titleHeight = 30
            const textOffset = 30;
            const marginX = 4;
            const marginY = 2;
            const buttonWidth = 16;

            vm.lHeight = vm.lItemHeight * varScale.domain.length + titleHeight;

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

            const highlight = legend.append("g")
                .attr("class", "highlight")
            
            highlight.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", vm.lWidth)
                .attr("height", "1px")
                .attr("fill", "black")
                .attr("fill-opacity", 0)
                .style("user-select", "none");
            
            highlight.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", vm.lWidth)
                .attr("height", 1)
                .attr("fill", "black")
                .attr("fill-opacity", 0)
                .attr("transform", "translate(0," + (vm.lItemHeight) + ")")
                .style("user-select", "none");

            
            
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

            const itemText = items.append("text")
                .style("text-anchor", "start")
                .style("font-family", "Avenir")
                .attr("y", scale.bandwidth() - 5)
                .attr("x", (textOffset + marginX) + "px")
                .style("font-size", "13px")
                .text((d) => varScale.toHuman(d))
                .attr("fill", (d) => varScale.domainFiltered.includes(d) ? "black" : "silver");
            
            if(vm.clickHandler !== undefined) {
                itemText
                    .style("text-decoration", "underline")
                    .style("cursor", "pointer")
                    .on("click", (d) => {
                        vm.clickHandler(d);
                    });
            }
            
            if(vm._style === STYLES.BAR) {
                items.append("rect")
                    .attr("x", marginX)
                    .attr("y", marginY)
                    .attr("width", textOffset - marginX) 
                    .attr("height", scale.bandwidth() - 2*marginY)
                    .attr("fill", (d) => varScale.color(d))
                    .attr("fill-opacity", (d) => varScale.domainFiltered.includes(d) ? 1 : 0);
            }

            if(d3Node) {
                return; /* SVG passed in to function, so not interactive */
            }
            
            
            // Action buttons

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
                    .attr("fill", "silver");
            
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

            const filterButtons = items.append("g")
                .attr("transform", "translate(" + (vm.lWidth - 2*(buttonWidth + 2*marginX)) + ",0)")
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
                        EVENT_TYPES.SCALE,
                        EVENT_SUBTYPES.SCALE_DOMAIN_FILTER,
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
                .attr("fill", "silver");
            

            const colorButtons = items.append("g")
                .attr("transform", "translate(" + (vm.lWidth - 1*(buttonWidth + 2*marginX)) + ",0)")
                .style("cursor", "pointer")
                .on("click", (d) => {
                    vm.initialColor = varScale.color(d);
                    vm.changeColor = (color) => {
                        const colorOverrides = varScale.colorOverrides;
                        colorOverrides[d] = color;
                        varScale.setColorOverrides(colorOverrides);

                        stack.push(new HistoryEvent(
                            EVENT_TYPES.SCALE,
                            EVENT_SUBTYPES.SCALE_COLOR_OVERRIDE,
                            varScale.id,
                            "setColorOverrides",
                            [Object.assign({}, colorOverrides)] 
                        ));
                    };
                    vm.showColorPicker = true;
                });

            colorButtons.append("rect")
                .attr("x", 0)
                .attr("y", marginY)
                .attr("width", buttonWidth)
                .attr("height", scale.bandwidth() - 2*marginY)
                .attr("fill", "transparent")
                .attr("stroke", "transparent")
            
            colorButtons.append("path")
                .attr("d", COLOR_PICKER_PATH)
                .attr("y", scale.bandwidth() - 5)
                .attr("x", buttonWidth / 2)
                .attr("transform", "scale(0.7 0.7)")
                .attr("fill", "silver");
            
        },
        download() {
            const svg = d3_create("svg")
                .attr("width", this.computedWidth)
                .attr("height", this.computedHeight)
                .attr("viewBox", `0 0 ${this.computedWidth} ${this.computedHeight}`);
            
            this.drawLegend(svg);
            this.drawLegend();

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