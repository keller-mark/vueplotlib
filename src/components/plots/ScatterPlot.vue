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
        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
                <tr>
                    <th>{{ this._xScale.name }}</th>
                    <td>{{ this.tooltipInfo.x }}</td>
                </tr>
                <tr>
                    <th>{{ this._yScale.name }}</th>
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
import { mouse as d3_mouse } from 'd3';
import { Delaunay } from 'd3-delaunay';
import { debounce } from 'lodash';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './../../mixin.js';

let uuid = 0;
export default {
    name: 'ScatterPlot',
    mixins: [mixin],
    props: {
        'x': {
            type: String
        },
        'y': {
            type: String
        }
        // TODO: allow optional color variable
        // TODO: allow optional dot size variable
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                y: ''
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
        console.assert(this._xScale instanceof AbstractScale);
        console.assert(this._yScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);

        // TODO: subscribe to data mutations as well?
    },
    mounted() {
        this.drawPlot();
    },
    methods: {
        tooltip: function(mouseX, mouseY, x, y) {
            // Set values
            this.tooltipInfo.x = x; // TODO: scale .toHuman
            this.tooltipInfo.y = y; // TODO: scale .toHuman

            // Set position
            this.tooltipPosition.left = mouseX + this.pMarginLeft;
            this.tooltipPosition.top = mouseY + this.pMarginTop;
            // TODO dispatch
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // TODO: Destroy all dispatches here
            // dispatch.call("link-donor-destroy");
        },
        drawPlot() {
            const vm = this;
            
            let data = this._dataContainer.dataCopy;
            const xScale = this._xScale;
            const yScale = this._yScale;


            const x = d3_scaleLinear()
                .domain(xScale.domainFiltered)
                .range([0, vm.pWidth]);
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);
              
          
            
            /*
             * Scale up the canvas
             */
            const canvas = d3_select(this.plotSelector);
            const context = canvas.node().getContext('2d');

            const ratio = getRetinaRatio(context);
            const scaledWidth = vm.pWidth * ratio;
            const scaledHeight = vm.pHeight * ratio;

            canvas
                .attr("width", scaledWidth)
                .attr("height", scaledHeight);
            context.scale(ratio, ratio);


            /*
             * Draw the points
             */
            data.forEach((d) => {
                //context.strokeStyle = cScale.color(d[vm.c]);
                context.strokeStyle = "#4682B4";
                context.beginPath();
                context.arc(x(d[vm.x]), y(d[vm.y]), 3, 0, 2*Math.PI);
                context.stroke();
            });

            /*
             * Prepare for interactivity
             */
            const points = data.map((d) => [x(d[vm.x]), y(d[vm.y])]);
            const delaunay = Delaunay.from(points);
            const voronoi = delaunay.voronoi([0, 0, vm.pWidth, vm.pHeight]);

            /*
            // Show the voronoi edges
            context.beginPath();
            voronoi.render(context);
            context.stroke();
            */
            
            /*
             * Listen for mouse events
             */
            const canvasNode = canvas.node();

            const debouncedTooltipDestroy = debounce(vm.tooltipDestroy, TOOLTIP_DEBOUNCE);
            canvas.on("mousemove", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                const i = delaunay.find(mouseX, mouseY);
                const node = data[i];

                if(node) {
                    vm.tooltip(mouseX, mouseY, node[vm.x], node[vm.y]); 
                } else {
                    debouncedTooltipDestroy();
                }
            })
            .on("mouseleave", vm.tooltipDestroy);
        }
    }
}
</script>

<style>
.vdp-plot {
    position: absolute;
}
.vdp-plot-hidden {
    position: absolute;
    display: none;
}

.vdp-tooltip {
    position: absolute;
    border: 1px solid rgb(205, 205, 205);
    background-color: rgba(255, 255, 255, 0.95);
    z-index: 1;
    padding: 0.25rem;
    border-radius: 3px;
    transform: translate(10%, -50%);
}
</style>