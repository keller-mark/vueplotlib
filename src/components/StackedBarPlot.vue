<template>
    <div>
        <div 
            :id="this.plotElemID" 
            class="vdp-plot" 
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': (this.pWidth) + 'px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft) + 'px'
            }"
        ></div>
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
import { scaleBand as d3_scaleBand, scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { stack as d3_stack, stackOrderNone as d3_stackOrderNone, stackOffsetNone as d3_stackOffsetNone } from 'd3-shape';

import AbstractScale from './../scales/AbstractScale.js';
import DataContainer from './../data/DataContainer.js';

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
        // Set data
        this._dataContainer = this.getData(this.data);
        console.assert(this._dataContainer instanceof DataContainer);
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

        // TODO: subscribe to data mutations as well?
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
            d3_select(this.plotSelector).select("svg").remove();
        },
        drawPlot() {
            let vm = this;
            vm.removePlot();
            
            let data = this._dataContainer.dataCopy;
            const xScale = this._xScale;
            const yScale = this._yScale;
            const cScale = this._cScale;

            data = data.filter((el) => xScale.domainFiltered.includes(el[vm.x]));

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);

            const barWidth = vm.pWidth / xScale.domainFiltered.length;
              
            const stack = d3_stack()
                .keys(cScale.domainFiltered)
                .value((d, key) => { return d[vm.y][key] || 0; })
                .order(d3_stackOrderNone)
                .offset(d3_stackOffsetNone);

            const series = stack(data);

            let container = d3_select(this.plotSelector)
                .append("svg")
                    .attr("width", (vm.pWidth + vm.pMarginLeft + vm.pMarginRight))
                    .attr("height", (vm.pHeight + vm.pMarginTop + vm.pMarginBottom))
                .append("g")
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
                    .attr("x", (d) => { return x(d.data[vm.x]); })
                    .attr("y", (d) => { return y(d[1]); })
                    .attr("height", (d) => { 
                        let height = y(d[0]) - y(d[1]);
                        if(height + y(d[1]) > vm.pHeight) {
                            return vm.pHeight - y(d[1]);
                        }
                        return height; 
                    })
                    .attr("width", barWidth)
                    .style("cursor", "pointer")
                    .on('mouseover', (d, i) => { 
                        vm.tooltip(data[i][vm.x], (d[1] - d[0]), null); 
                    })
                    .on('click', (d, i) => {
                        // TODO
                    });
            
        }
    }
}
</script>

<style>
.vdp-plot {
    position: absolute;
}
</style>