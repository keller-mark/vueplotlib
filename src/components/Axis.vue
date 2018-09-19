<template>
    <div 
        :id="this.axisElemID" 
        class="vdp-axis" 
        :style="{
            'height': this.computedHeight + 'px', 
            'width': this.computedWidth + 'px',
            'top': this.computedTop + 'px'
        }"></div>
</template>

<script>
import { scaleBand as d3_scaleBand, scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { axisTop as d3_axisTop, axisLeft as d3_axisLeft, axisRight as d3_axisRight, axisBottom as d3_axisBottom } from 'd3-axis';
import { brushX as d3_brushX, brushY as d3_brushY } from 'd3-brush';
import { event as d3_event } from 'd3';

import AbstractScale from './../scales/AbstractScale.js';

let uuid = 0;
export default {
    name: 'Axis',
    props: {
        'variable': {
            type: String
        },
        'orientation': {
            type: String
        },
        'tickRotation': {
            type: Number
        },
        'pWidth': {
            type: Number
        },
        'pHeight': {
            type: Number
        },
        'pMarginTop': {
            type: Number
        },
        'pMarginLeft': {
            type: Number
        },
        'pMarginRight': {
            type: Number
        },
        'pMarginBottom': {
            type: Number
        },
        'getScale': {
            type: Function
        }
    },
    data() {
        return {
            
        }
    },
    computed: {
        axisElemID: function() {
            return 'axis_' + this.uuid;
        },
        axisSelector: function() {
            return "#" + this.axisElemID;
        },
        computedWidth: function() {
            const orientation = this.orientation.toLowerCase();
            if(orientation === "bottom" || orientation === "top") {
                return this.pMarginLeft + this.pWidth + this.pMarginRight;
            } else if(orientation === "left") {
                return this.pMarginLeft;
            } else if(orientation === "right") {
                return this.pMarginRight;
            }
        },
        computedHeight: function() {
            const orientation = this.orientation.toLowerCase();
            if(orientation === "left" || orientation === "right") {
                return this.pMarginTop + this.pHeight + this.pMarginBottom;
            } else if(orientation === "top") {
                return this.pMarginTop;
            } else if(orientation === "bottom") {
                return this.pMarginBottom;
            }
        },
        computedTop: function() {
            const orientation = this.orientation.toLowerCase();
            if(orientation === "left" || orientation === "right") {
                return 0;
            } else if(orientation === "top") {
                return 0;
            } else if(orientation === "bottom") {
                return this.pMarginTop + this.pHeight;
            }
        },
        computedTranslateX: function() {
            const orientation = this.orientation.toLowerCase();
            if(orientation === "left") {
                return this.pMarginLeft - 1;
            } else if(orientation === "bottom" || orientation === "top") {
                return this.pMarginLeft;
            }
            return 0;
        },
        computedTranslateY: function() {
            const orientation = this.orientation.toLowerCase();
            if(orientation === "left" || orientation === "right") {
                return this.pMarginTop;
            }
            return 0;
        }
    },
    watch: {
        pWidth: function () {
            this.drawAxis();
        },
        pHeight: function () {
            this.drawAxis();
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        // TODO: Subscribe to event publishers here
    },
    mounted() {
        this.drawAxis();
    },
    methods: {
        removeAxis() {
            d3_select(this.axisSelector).select("svg").remove();
        },
        drawAxis() {
            const vm = this;
            vm.removeAxis();
            
            const varScale = vm.getScale(vm.variable);
            const orientation = vm.orientation.toLowerCase();

            let range;
            if(orientation === "bottom" || orientation === "top") {
                range = [0, vm.pWidth];
            } else if(orientation === "left" || orientation === "right") {
                range = [vm.pHeight, 0];
            }

            let axisFunction;
            if(orientation === "top") {
                axisFunction = d3_axisTop;
            } else if(orientation === "left") {
                axisFunction = d3_axisLeft;
            } else if(orientation === "right") {
                axisFunction = d3_axisRight;
            } else if(orientation === "bottom") {
                axisFunction = d3_axisBottom;
            }

            let scaleZoomedOut, scaleZoomedIn;
            if(varScale.type === AbstractScale.types.DISCRETE) {
                scaleZoomedOut = d3_scaleBand()
                    .domain(varScale.domain)
                    .range(range);
                scaleZoomedIn = d3_scaleBand()
                    .domain(varScale.domainFiltered)
                    .range(range);
            } else if(varScale.type === AbstractScale.types.CONTINUOUS) {
                scaleZoomedOut = d3_scaleLinear()
                    .domain(varScale.domain)
                    .range(range);
                scaleZoomedIn = d3_scaleLinear()
                    .domain(varScale.domainFiltered)
                    .range(range);
                // TODO: options for log, etc...
            }

            /**
             * Create the SVG elements
             */

            const container = d3_select(vm.axisSelector)
                .append("svg")
                    .attr("width", vm.computedWidth)
                    .attr("height", vm.computedHeight);
            
            const containerZoomedIn = container.append("g")
                    .attr("class", "axis-zoomed-in")
                    .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");
            
            /**
             * The zoomed-in axis
             */
            const ticksZoomedIn = containerZoomedIn.call(axisFunction(scaleZoomedIn));
            const textBboxZoomedIn = ticksZoomedIn.select("text").node().getBBox();

            ticksZoomedIn.selectAll("text")	
                    .style("text-anchor", "end")
                    .attr("x", "-.8em") // TODO: update this
                    .attr("y", ".15em") // TODO: update this
                    .attr("transform", "rotate(" + vm.tickRotation + ")");
            
            if(varScale.type === AbstractScale.types.DISCRETE) {
                const barWidth = vm.pWidth / varScale.domainFiltered.length;
                if(barWidth < textBboxZoomedIn.height) {
                    ticksZoomedIn.selectAll("text")
                        .remove();
                }
            }


            

            /**
             * The zoomed-out axis
             */

            const betweenAxisMargin = 4;

            // Get the width/height of the zoomed-in axis
            const axisBboxZoomedIn = container.select(".axis-zoomed-in").node().getBBox();

            let zoomedOutTranslateX = vm.computedTranslateX;
            let zoomedOutTranslateY = vm.computedTranslateY;
            if(orientation === "left") {
                zoomedOutTranslateX -= (axisBboxZoomedIn.width + betweenAxisMargin);
            } else if(orientation === "bottom") {
                zoomedOutTranslateY += (axisBboxZoomedIn.height + betweenAxisMargin);
            }
            
            const containerZoomedOut = container.append("g")
                    .attr("class", "axis-zoomed-out")
                    .attr("transform", "translate(" + zoomedOutTranslateX + "," + zoomedOutTranslateY + ")");
            
            const ticksZoomedOut = containerZoomedOut.call(axisFunction(scaleZoomedOut));
            const textBboxZoomedOut = ticksZoomedOut.select("text").node().getBBox();

            ticksZoomedOut.selectAll("text")	
                    .style("text-anchor", "end")
                    .attr("x", "-.8em") // TODO: update this
                    .attr("y", ".15em") // TODO: update this
                    .attr("transform", "rotate(" + vm.tickRotation + ")");
            
            if(varScale.type === AbstractScale.types.DISCRETE) {
                const barWidth = vm.pWidth / varScale.domain.length;
                if(barWidth < textBboxZoomedOut.height) {
                    ticksZoomedOut.selectAll("text")
                        .remove();
                }
            }

            /**
             * Add brushing to the zoomed-out axis
             */

            const axisBboxZoomedOut = container.select(".axis-zoomed-out").node().getBBox();
            let axisContainerSize;
            let brush, brushed;
            if(orientation === "left" || orientation === "right") {
                axisContainerSize = axisBboxZoomedOut.width;
                if(varScale.type === AbstractScale.types.CONTINUOUS) {
                    brushed = () => {
                        var s = d3_event.selection || scaleZoomedOut.range().slice().reverse();
                        var s2 = s.map(scaleZoomedOut.invert, scaleZoomedOut);
                        console.log(s);
                        console.log(s2);
                        varScale.zoom(s2[1], s2[0]);
                        vm.drawAxis(); // TODO: emit filter event instead
                    }
                } else if(varScale.type === AbstractScale.types.DISCRETE) {
                    brushed = () => {
                        var s = d3_event.target.extent();
                        //symbol.classed("selected", function(d) { return s[0] <= (d = x(d)) && d <= s[1]; });
                        
                        console.log(s);
                    }
                }
                brush = d3_brushY()
                    .extent([[-axisContainerSize - betweenAxisMargin, 0], [0, vm.pHeight]])
                    .on("end." + vm.axisElemID, brushed);
                
            } else if(orientation === "bottom" || orientation === "top") {
                axisContainerSize = axisBboxZoomedOut.height;
                if(varScale.type === AbstractScale.types.CONTINUOUS) {
                    brushed = () => {
                        var s = d3_event.selection || scaleZoomedOut.range();
                        var s2 = s.map(scaleZoomedOut.invert, scaleZoomedOut);
                        console.log(s);
                        console.log(s2);
                        varScale.zoom(s2[0], s2[1]);
                        vm.drawAxis(); // TODO: emit filter event instead
                    }
                } else if(varScale.type === AbstractScale.types.DISCRETE) {
                    brushed = () => {
                        var s = d3_event.selection || scaleZoomedOut.range();
                        console.log(s);
                        var eachBand = vm.pWidth / varScale.domain.length;
                        var startIndex = Math.floor((s[0] / eachBand));
                        var endIndex = Math.ceil((s[1] / eachBand));
                        varScale.zoom(startIndex, endIndex)
                        vm.drawAxis();
                    }
                }
                brush = d3_brushX()
                    .extent([[0, 0], [vm.pWidth, axisContainerSize + betweenAxisMargin]])
                    .on("end." + vm.axisElemID, brushed);
            }

            containerZoomedOut.append("g")
                .attr("class", "brush")
                .call(brush);


            
        }
    }
}
</script>

<style>
.vdp-axis {
    position: absolute;
}

.axis-zoomed-out line, .axis-zoomed-out path {
    stroke: silver;
}
.axis-zoomed-out text {
    fill: silver;
}

</style>