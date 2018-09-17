<template>
    <div>
        <div :id="this.plotElemID" class="vdp-plot" :style="{'height': this.height + 'px', 'width': this.width + 'px'}"></div>

        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
                <tr>
                    <th>X<!-- TODO: get this from the scale --></th>
                    <td>{{ this.tooltipInfo.x }}</td>
                </tr>
                <tr>
                    <th>C<!-- TODO: get this from the scale --></th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
                <tr>
                    <th>Y<!-- TODO: get this from the scale --></th>
                    <td>{{ this.tooltipInfo.y }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import * as d3 from 'd3';
import mixin from './../mixin.js';

let uuid = 0;
export default {
    name: 'StackedBarPlot',
    mixins: [mixin],
    props: {
        'x': {
            type: String
        },
        'y': {
            type: String
        },
        'c': { // color
            type: String
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                y: '',
                c: ''
            }
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
        this.drawPlot();
    },
    methods: {
        tooltip: function(x, y, c) {
            console.log('tooltip:', x, y, c);

            // TODO set position
            // TODO dispatch
        },
        tooltipDestroy: function() {
            this.tooltipHide();
            
            // TODO: Destroy all dispatches here
            // dispatch.call("link-donor-destroy");
        },
        removePlot() {
            d3.select(this.plotSelector).select("svg").remove();
        },
        drawPlot() {
            let vm = this;
            vm.removePlot();
            
            const data = vm.getData(vm.data);
            const xScale = vm.getScale(vm.x);
            const yScale = vm.getScale(vm.y);
            const cScale = vm.getScale(vm.c);

            const x = d3.scaleBand()
                .domain(xScale.domain)
                .range([0, vm.width]);
            
            const y = d3.scaleLinear()
                .domain(yScale.domain)
                .range([vm.height, 0]);

            const barWidth = xScale.domain.length / vm.width;
              

            const stack = d3.stack()
                .keys(cScale.domain)
                .value((d, key) => { return d[vm.y][key] || 0; })
                .order(d3.stackOrderNone)
                .offset(d3.stackOffsetNone);

            const series = stack(data);

            let container = d3.select(this.plotSelector)
                .append("svg")
                    .attr("width", vm.width + vm.marginLeft + vm.marginRight)
                    .attr("height", vm.height + vm.marginTop + vm.marginBottom)
                .append("g")
                    .attr("transform", "translate(" + vm.marginLeft + "," + vm.marginTop + ")")
                    .on('mouseleave', vm.tooltipDestroy);
            
            let layer = container.append("g").selectAll(".layer")
                    .data(series)
                .enter().append("g")
                    .attr("class", "layer")
                    .style("fill", (d) => {
                        return cScale.color(d["key"]); 
                    })
                    .on('mousemove', (d) => {
                        vm.tooltip(null, null, d["key"]); 
                    });
                
            layer.selectAll("rect")
                    .data((d) => { return d; })
                .enter().append("rect")
                    .attr("class", "bar")
                    .attr("x", (d, i) => { return x(data[i][vm.x]); })
                    .attr("y", (d) => { return y(d[1]); })
                    .attr("height", (d) => { return y(d[0]) - y(d[1]); })
                    .attr("width", barWidth)
                    .style("cursor", "pointer")
                    .on('mouseover', (d, i) => { 
                        vm.tooltip(data[i][vm.x], data[i][vm.y], (d[1] - d[0])); 
                    })
                    .on('click', (d, i) => {
                        // TODO
                    });
            
        }
    }
}
</script>

<style>

</style>