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
        <canvas 
            :id="this.hiddenPlotElemID" 
            class="vdp-plot-hidden" 
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
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
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
import { debounce } from 'lodash';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import mixin from './../../mixin.js';

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
        tooltip: function(mouseX, mouseY, x, y, c) {
            // Set values
            this.tooltipInfo.x = x; // TODO: scale .toHuman
            this.tooltipInfo.y = y; // TODO: scale .toHuman
            this.tooltipInfo.c = c; // TODO: scale .toHuman

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

            
            /*
             * Scale up the canvas
             */
            const canvas = d3_select(this.plotSelector);
            const context = canvas.node().getContext('2d');

            const canvasHidden = d3_select(this.hiddenPlotSelector);
            const contextHidden = canvasHidden.node().getContext('2d');

            const ratio = getRetinaRatio(context);
            const scaledWidth = vm.pWidth * ratio;
            const scaledHeight = vm.pHeight * ratio;

            canvas
                .attr("width", scaledWidth)
                .attr("height", scaledHeight);
            context.scale(ratio, ratio);

            canvasHidden
                .attr("width", scaledWidth)
                .attr("height", scaledHeight);
            contextHidden.scale(ratio, ratio);

            /*
             * Set up the color mappings
             */
            const colToNode = {};

            /*
             * Generates the next color in the sequence, 
             * going from 0,0,0 to 255,255,255.
             */
            let nextCol = 1;
            const genColor = () => {
                let ret = [];
                // via http://stackoverflow.com/a/15804183
                if(nextCol < 16777215){
                    ret.push(nextCol & 0xff); // R
                    ret.push((nextCol & 0xff00) >> 8); // G 
                    ret.push((nextCol & 0xff0000) >> 16); // B

                    nextCol += 1;
                }
                let col = "rgb(" + ret.join(',') + ")";
                return col;
            }

            /*
             * Draw the bars
             */
            series.forEach((layer) => {
                context.fillStyle = cScale.color(layer["key"]); 
                layer.forEach((d) => {
                    const col = genColor();
                    colToNode[col] = { "x": d.data[vm.x], "y": d.data[vm.y][layer["key"]], "c": layer["key"] };
                    contextHidden.fillStyle = col;
                    let height = y(d[0]) - y(d[1]);
                    if(height + y(d[1]) > vm.pHeight) {
                        height = vm.pHeight - y(d[1]);
                    }
                    context.fillRect(x(d.data[vm.x]), y(d[1]), barWidth, height);
                    contextHidden.fillRect(x(d.data[vm.x]), y(d[1]), barWidth, height);
                })
            });
            
            /*
             * Listen for mouse events
             */
            const canvasNode = canvas.node();

            const debouncedTooltipDestroy = debounce(vm.tooltipDestroy, TOOLTIP_DEBOUNCE);
            canvas.on("mousemove", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                // Get the corresponding pixel color on the hidden canvas
                const col = contextHidden.getImageData(mouseX * ratio, mouseY * ratio, scaledWidth, scaledHeight).data;
                const colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
                // Look up the node in our map
                const node = colToNode[colString];

                if(node) {
                    vm.tooltip(mouseX, mouseY, node["x"], node["y"], node["c"]); 
                } else {
                    debouncedTooltipDestroy();
                }
            });
            
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