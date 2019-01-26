<template>
    <div>
        <div class="vdp-tooltip" :style="this.tooltipPositionAttribute">
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
import { scaleBand as d3_scaleBand, scaleLinear as d3_scaleLinear, scaleLog as d3_scaleLog } from 'd3-scale';
import { TOOLTIP_DEBOUNCE, BAR_MARGIN_X_DEFAULT, BAR_WIDTH_MIN } from './../../constants.js';
import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';

import dimensionsMixin from '../mixins/dimensions.js';
import canvasMixin from '../mixins/canvas.js';
import dataMixin from '../mixins/data.js';
import tooltipMixin from '../mixins/tooltip.js';

import gettersMixin from '../mixins/getters.js';


import * as PIXI from 'pixi.js';

let uuid = 0;
/**
 * @prop {string} x The x-scale variable key.
 * @prop {string} y The y-scale variable key.
 * @prop {number} barMarginX The value for the horizontal margin between bars. Default: 2
 * @prop {string} barColor A color for all bars. Optional. If provided, overrides using the x scale for colors.
 * @prop {boolean} logY Whether or not to log-scale the y axis. Default: false
 * @extends mixin
 * 
 * @example
 * <BarPlot
 *      data="exposures_single_data"
 *      x="signature" 
 *      y="exposure"
 * />
 */
export default {
    name: 'BarPlot',
    mixins: [
        dimensionsMixin, 
        canvasMixin,
        gettersMixin,
        dataMixin,
        tooltipMixin
    ],
    props: {
        'x': {
            type: String
        },
        'y': {
            type: String
        },
        'barColor': {
            type: String
        },
        'barMarginX': {
            type: Number, 
            default: BAR_MARGIN_X_DEFAULT
        },
        'logY': {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            tooltipInfo: {
                x: '',
                y: ''
            },
            highlightX1: null,
            highlightX2: null,
            highlightScale: null,
            barWidth: 0
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        console.log(this.$props);
        this.stage = new PIXI.Graphics();
        this.canvas.stage.addChild(this.stage);
        // Set data
        this._dataContainer = this.getData(this.data);
        console.assert(this._dataContainer instanceof DataContainer);
        // Set scale variables
        this._xScale = this.getScale(this.x);
        this._yScale = this.getScale(this.y);
        console.assert(this._xScale instanceof AbstractScale);
        console.assert(this._yScale instanceof AbstractScale);

        // Subscribe to event publishers here
        this._xScale.onUpdate(this.uuid, this.draw);
        this._yScale.onUpdate(this.uuid, this.draw);

        // Subscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, this.draw);

        // Subscribe to highlights here
        this._xScale.onHighlight(this.uuid, this.highlightX);
        this._xScale.onHighlightDestroy(this.uuid, this.highlightDestroy);
    },
    mounted() {
        this.draw();

    },
    beforeDestroy() {
        // Unsubscribe to events
        this._yScale.onUpdate(this.uuid, null);
        this._xScale.onUpdate(this.uuid, null);

        // Unsubscribe to data mutations here
        this._dataContainer.onUpdate(this.uuid, null);

        // Unsubscribe to highlights here
        this._xScale.onHighlight(this.uuid, null);
        this._xScale.onHighlightDestroy(this.uuid, null);
    },
    watch: {
        barMarginX() {
            this.draw();
        },
        barColor() {
            this.draw();
        },
        logY() {
            this.draw();
        }
    },
    methods: {
        tooltip: function(mouseX, mouseY, x, y) {
            // Set values
            this.tooltipInfo.x = this._xScale.toHuman(x);
            this.tooltipInfo.y = this._yScale.toHuman(y);

            // Set position
            this.tooltipPosition.left = mouseX;
            this.tooltipPosition.top = mouseY;
            
            // Dispatch highlights
            this._xScale.emitHighlight(x);
            this._yScale.emitHighlight(y);
        },
        tooltipDestroy: function() {
            this.tooltipHide();

            // Destroy all highlights here
            this._xScale.emitHighlightDestroy();
            this._yScale.emitHighlightDestroy();
        },
        highlightX(value) {
            if(this.highlightScale) {
                this.highlightX1 = this.highlightScale(value);
                this.highlightX2 = this.highlightScale(value) + this.barWidth;
            }
        },
        highlightDestroy() {
            this.highlightX1 = null;
            this.highlightX2 = null;
        },
        draw() {
            const vm = this;

            if(vm._dataContainer.isLoading || vm._xScale.isLoading || vm._yScale.isLoading) {
                return;
            }
            
            let data = vm._dataContainer.dataCopy;

            const xScale = this._xScale;
            const yScale = this._yScale;

            data = data.filter((el) => xScale.domainFiltered.includes(el[vm.x]));

            const x = d3_scaleBand()
                .domain(xScale.domainFiltered)
                .range([0, vm.width]);

            vm.highlightScale = x;
            
            let yScaleFunc = d3_scaleLinear;
            if(vm.logY) {
                yScaleFunc = d3_scaleLog;
            }
            const y = yScaleFunc()
                .domain(yScale.domainFiltered)
                .range([vm.height, 0]);

            const barWidth = vm.width / xScale.domainFiltered.length;
            vm.barWidth = barWidth;
            
            /*
             * Draw the bars
             */
            let barMarginX = vm.barMarginX;
            if(barWidth - vm.barMarginX <= BAR_WIDTH_MIN) {
                barMarginX = 0;
            }
            
            
            let heightMinusYOfZero = 0;
            if(!vm.logY) {
                heightMinusYOfZero = vm.height - y(0);
            }

            let rgbToHex = (rgb) => {
                if(rgb.charAt(0) === "#") {
                    return "0x" + rgb.substring(1);
                } else {
                    var a = rgb.split("(")[1].split(")")[0];
                    a = a.split(",");
                    var b = a.map(function(x){             //For each array element
                        x = parseInt(x).toString(16);      //Convert to a base16 string
                        return (x.length==1) ? "0"+x : x;  //Add zero if we get only one character
                    })
                    b = "0x"+b.join("");
                    return b;
                }
            }
            
            data.forEach((d) => {
                if(vm.barColor !== undefined) {
                    this.stage.beginFill(parseInt("0x" + vm.barColor.substring(1)));
                } else {
                    console.log(xScale.color(d[vm.x]));
                    this.stage.beginFill(parseInt(rgbToHex(xScale.color(d[vm.x]))));
                }

                let height = vm.height - y(d[vm.y]) - heightMinusYOfZero;
                vm.stage.drawRect(x(d[vm.x]) + (barMarginX/2), y(d[vm.y]), barWidth - barMarginX, height);
            });
            
          
            
        }
    }
}
</script>

<style>
@import '../../style/plot-style.css';
</style>