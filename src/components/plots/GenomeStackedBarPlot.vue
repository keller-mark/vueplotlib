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
        <div v-show="this.highlightX1 !== null" 
            :style="{
                'height': (this.pHeight) + 'px', 
                'width': '1px',
                'top': (this.pMarginTop) + 'px',
                'left': (this.pMarginLeft + this.highlightX1 - 0.5) + 'px'
            }"
            class="vdp-plot-highlight"
        ></div>
        <div :id="this.tooltipElemID" class="vdp-tooltip" :style="this.tooltipPositionAttribute">
            <table>
                <tr>
                    <th>Chromosome</th>
                    <td>{{ this.tooltipInfo.chromosome }}</td>
                </tr>
                <tr>
                    <th>Position</th>
                    <td>{{ this.tooltipInfo.position }}</td>
                </tr>
                <tr>
                    <th>{{ this._yScale.name }}</th>
                    <td>{{ this.tooltipInfo.y }}</td>
                </tr>
                <tr>
                    <th>{{ this._cScale.name }}</th>
                    <td>{{ this.tooltipInfo.c }}</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { stack as d3_stack, stackOrderNone as d3_stackOrderNone, stackOffsetNone as d3_stackOffsetNone } from 'd3-shape';
import { select as d3_select } from 'd3-selection';
import { mouse as d3_mouse } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';
import { getRetinaRatio } from './../../helpers.js';

import AbstractScale from './../../scales/AbstractScale.js';
import GenomeScale from './../../scales/GenomeScale.js';

import DataContainer from './../../data/DataContainer.js';

import mixin from './mixin.js';

let uuid = 0;
/**
 * @prop {string} g The genome-scale variable key.
 * @prop {string} y The y-scale variable key.
 * @prop {string} c The color-scale variable key.
 * @prop {string} chromosomeVariable The axis chromosome variable key. Default: "chromosome"
 * @prop {string} positionVariable The axis position variable key. Default: "position"
 * @extends mixin
 * 
 * @example
 * <GenomeStackedBarPlot
 *      data="rainfall_data"
 *      g="genome" 
 *      y="exposure"
 *      c="signature"
 *      :pWidth="500"
 *      :pHeight="300"
 *      :pMarginTop="10"
 *      :pMarginLeft="120"
 *      :pMarginRight="10"
 *      :pMarginBottom="150"
 *      :getData="getData"
 *      :getScale="getScale"
 *      :clickHandler="myClickHandler"
 * />
 */
export default {
    name: 'GenomeStackedBarPlot',
    mixins: [mixin],
    props: {
        'g': {
            type: String // genome
        },
        'y': {
            type: String
        },
        'c': {
            type: String // color
        },
        'chromosomeVariable': {
            type: String,
            default: "chromosome"
        },
        'positionVariable': {
            type: String,
            default: "position"
        }
    },
    data() {
        return {
            tooltipInfo: {
                chromosome: '',
                position: '',
                y: '',
                c: ''
            },
            highlightGScales: null,
            highlightX1: null
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
        this._gScale = this.getScale(this.g);
        this._yScale = this.getScale(this.y);
        this._cScale = this.getScale(this.c);
        console.assert(this._gScale instanceof GenomeScale);
        console.assert(this._yScale instanceof AbstractScale);
        console.assert(this._cScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._gScale.onUpdate(this.uuid, this.drawPlot);
        this._yScale.onUpdate(this.uuid, this.drawPlot);
        this._cScale.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.drawPlot);

        // Subscribe to highlights here
        this._gScale.onHighlight(this.uuid, this.highlightG);
        this._gScale.onHighlightDestroy(this.uuid, this.highlightDestroy);

    },
    mounted() {
        this.drawPlot();
    },
    methods: {
        tooltip: function(mouseX, mouseY, chromosome, position, y, c) {
            // Set values
            this.tooltipInfo.chromosome = chromosome;
            this.tooltipInfo.position = position.toLocaleString();

            this.tooltipInfo.y = this._yScale.toHuman(y);
            this.tooltipInfo.c = this._cScale.toHuman(c);

            // Set position
            this.tooltipPosition.left = mouseX + this.pMarginLeft;
            this.tooltipPosition.top = mouseY + this.pMarginTop;
            
            // Dispatch highlights
            this._gScale.emitHighlight(chromosome, position);
            this._yScale.emitHighlight(y);
            this._cScale.emitHighlight(c);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._gScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
            this._cScale.emitHighlightDestroy();
        },
        highlightG(chromosome, position) {
            this.highlightX1 = this.highlightGScales[chromosome](position);
        },
        highlightDestroy() {
            this.highlightX1 = null;
        },
        drawPlot() {
            const vm = this;
            
            let data = this._dataContainer.dataCopy;
            const cScale = this._cScale;
            const yScale = this._yScale;
            const gScale = this._gScale;

            let chromosomes = gScale.chromosomesFiltered;

            data = data.filter((d) => chromosomes.includes(d[vm.chromosomeVariable]));


            const g = {};
            
            let domains = gScale.getDomainsFiltered();
            let chromosomeRatios = gScale.getChromosomeRatiosFiltered();
            let chromosomeRatiosCumulative = gScale.getChromosomeRatiosCumulativeFiltered();

            for(let i = 0; i < chromosomeRatios.length; i++) {
                let currChromosome = chromosomes[i];
                let currDomain = domains[i];
                let currRatio = chromosomeRatios[i];
                let currRatioCumulative = chromosomeRatiosCumulative[i];
                g[currChromosome] = d3_scaleLinear()
                    .domain(currDomain)
                    .range([vm.pWidth * currRatioCumulative, vm.pWidth * (currRatioCumulative + currRatio)]);
            }

            vm.highlightGScales = g;
            
            const y = d3_scaleLinear()
                .domain(yScale.domainFiltered)
                .range([vm.pHeight, 0]);


            vm.highlightYScale = y;

            const stack = d3_stack()
                .keys(cScale.domainFiltered.slice().reverse())
                .value((d, key) => { return d[key] || 0; })
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

                    nextCol += 20;
                }
                let col = "rgb(" + ret.join(',') + ")";
                return col;
            }

            /*
             * Draw the bars
             */
            series.forEach((layer) => {
                context.fillStyle = cScale.color(layer["key"]); 
                layer.forEach((d, i) => {
                    const col = genColor();
                    colToNode[col] = { 
                        "chr": d.data[vm.chromosomeVariable], 
                        "pos": d.data[vm.positionVariable], 
                        "y": d.data[layer["key"]], 
                        "c": layer["key"] 
                    };
                    contextHidden.fillStyle = col;
                    let height = y(d[0]) - y(d[1]);
                    if(height + y(d[1]) > vm.pHeight) {
                        height = vm.pHeight - y(d[1]);
                    }
                    const xVal = g[d.data[vm.chromosomeVariable]](d.data[vm.positionVariable]);
                    // Compute width: get x val of next data point.
                    // TODO: THIS ASSUMES SORTED DATA
                    let barWidth = 0;
                    if((i+1) < data.length) {
                        const nextD = data[i+1];
                        // Check for same chromosome
                        if(nextD[vm.chromosomeVariable] === d.data[vm.chromosomeVariable]) {
                            const nextXVal = g[nextD[vm.chromosomeVariable]](nextD[vm.positionVariable]);
                            barWidth = nextXVal - xVal;
                        }
                    }
                    if(barWidth === 0) {
                        // Bar width has not yet been found, set to max of current chromosome scale
                        barWidth = g[d.data[vm.chromosomeVariable]].range()[1] - xVal;
                    }
                    context.fillRect(xVal, y(d[1]), barWidth, height);
                    contextHidden.fillRect(xVal, y(d[1]), barWidth, height);
                });
            });

            /*
             * Listen for mouse events
             */
            const canvasNode = canvas.node();

            const getDataFromMouse = (mouseX, mouseY) => {
                // Get the corresponding pixel color on the hidden canvas
                const col = contextHidden.getImageData(mouseX * ratio, mouseY * ratio, scaledWidth, scaledHeight).data;
                const colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
                // Look up the node in our map
                return colToNode[colString];
            };

            const debouncedTooltipDestroy = debounce(vm.tooltipDestroy, TOOLTIP_DEBOUNCE);
            canvas.on("mousemove", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                const node = getDataFromMouse(mouseX, mouseY);

                if(node) {
                    vm.tooltip(mouseX, mouseY, node["chr"], node["pos"], node["y"], node["c"]); 
                } else {
                    debouncedTooltipDestroy();
                }
            })
            .on("mouseleave", vm.tooltipDestroy);
            
            if(vm.clickHandler !== undefined) {
                canvas.on("click", () => {
                    const mouse = d3_mouse(canvasNode);
                    const mouseX = mouse[0];
                    const mouseY = mouse[1];

                    const node = getDataFromMouse(mouseX, mouseY);

                    if(node) {
                        vm.clickHandler(node["chr"], node["pos"], node["y"], node["c"]); 
                    }
                })
            }
        }
    }
}
</script>

<style>
@import '../../style/plot-style.css';
</style>