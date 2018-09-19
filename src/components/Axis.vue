<template>
    <div 
        :id="this.axisElemID" 
        class="vdp-axis" 
        :style="{
            'height': (this.height + this.marginBottom + this.marginTop) + 'px', 
            'width': (this.width + this.marginLeft + this.marginRight) + 'px'
        }"></div>
</template>

<script>
import { scaleBand as d3_scaleBand, scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { axisTop as d3_axisTop, axisLeft as d3_axisLeft, axisRight as d3_axisRight, axisBottom as d3_axisBottom } from 'd3-axis';

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
        'width': {
            type: Number
        },
        'height': {
            type: Number
        },
        'marginTop': {
            type: Number
        },
        'marginLeft': {
            type: Number
        },
        'marginRight': {
            type: Number
        },
        'marginBottom': {
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
        }
    },
    watch: {
        width: function () {
            this.drawAxis();
        },
        height: function () {
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
                range = [0, vm.width];
            } else if(orientation === "left" || orientation === "right") {
                range = [vm.height, 0];
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

            let scale;
            if(varScale.type === AbstractScale.types.DISCRETE) {
                scale = d3_scaleBand()
                    .domain(varScale.domain)
                    .range(range);
            } else if(varScale.type === AbstractScale.types.CONTINUOUS) {
                scale = d3_scaleLinear()
                    .domain(varScale.domain)
                    .range(range);
                // TODO: options for log, etc...
            }

            const container = d3_select(vm.axisSelector)
                .append("svg")
                    .attr("width", (vm.width + vm.marginLeft + vm.marginRight))
                    .attr("height", (vm.height + vm.marginTop + vm.marginBottom))
                .append("g")
                    .attr("transform", "translate(" + vm.marginLeft + "," + vm.marginTop + ")");
            
            const ticks = container.call(axisFunction(scale));
            const bbox = ticks.select("text").node().getBBox();

            ticks.selectAll("text")	
                    .style("text-anchor", "end")
                    .attr("x", "-.8em") // TODO: update this
                    .attr("y", ".15em") // TODO: update this
                    .attr("transform", "rotate(" + vm.tickRotation + ")");
            
            if(varScale.type === AbstractScale.types.DISCRETE) {
                const barWidth = vm.width / varScale.domain.length;
                if(barWidth < bbox.height) {
                    ticks.selectAll("text")
                        .remove();
                }
                
            }
            

            
        }
    }
}
</script>

<style>


</style>