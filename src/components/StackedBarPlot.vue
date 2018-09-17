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
            
            const data = vm.getData(vm.data);
            const xScale = vm.getScale(vm.x);
            const yScale = vm.getScale(vm.y);
            const cScale = vm.getScale(vm.c);

            console.log(data);
            console.log(xScale);

            let container = d3.select(this.plotSelector)
                .append("svg")
                    .attr("width", vm.width + vm.marginLeft + vm.marginRight)
                    .attr("height", vm.height + vm.marginTop + vm.marginBottom)
                .append("g")
                    .attr("transform", "translate(" + vm.marginLeft + "," + vm.marginTop + ")")
                    .on('mouseleave', vm.tooltipDestroy);
            
        }
    }
}
</script>

<style>

</style>