<template>
    <div 
        :id="this.axisElemID" 
        class="vdp-axis" 
        :style="{
            'height': this.computedHeight + 'px', 
            'width': this.computedWidth + 'px',
            'top': this.computedTop + 'px',
            'left': this.computedLeft + 'px'
        }"></div>
</template>

<script>
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { axisTop as d3_axisTop, axisLeft as d3_axisLeft, axisRight as d3_axisRight, axisBottom as d3_axisBottom } from 'd3-axis';
import { brushX as d3_brushX, brushY as d3_brushY } from 'd3-brush';
import { event as d3_event } from 'd3';
import { zip as d3_zip } from 'd3-array';

import { saveSvgAsPng } from 'save-svg-as-png';

import GenomeScale from './../scales/GenomeScale.js';
import HistoryEvent from './../history/HistoryEvent.js';

const SIDES = Object.freeze({ "TOP": 1, "LEFT": 2, "RIGHT": 3, "BOTTOM": 4 });
const ORIENTATIONS = Object.freeze({ "VERTICAL": 1, "HORIZONTAL": 2 }); // vertical = left/right, horizontal = top/bottom

let uuid = 0;
/**
 * @prop {string} scaleKey The key for the genome scale instance, passed to getScale.
 * @prop {string} chromosomeVariable The axis chromosome variable key. Default: "chromosome"
 * @prop {string} positionVariable The axis position variable key. Default: "position"
 * @prop {string} side The side for the scale.
 * @prop {number} pWidth The plot width.
 * @prop {number} pHeight The plot height.
 * @prop {number} pMarginTop The plot top margin.
 * @prop {number} pMarginLeft The plot left margin.
 * @prop {number} pMarginRight The plot right margin.
 * @prop {number} pMarginBottom The plot bottom margin.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} getStack Function that returns a HistoryStack instance.
 * @prop {boolean} disableBrushing Whether to disable brushing functionality and hide the zoomed-out "context" view.
 * 
 * @example
 * <GenomeAxis
 *      :scaleKey="genome_scale"
 *      side="bottom" 
 *      :pWidth="500"
 *      :pHeight="300"
 *      :pMarginTop="10"
 *      :pMarginLeft="120"
 *      :pMarginRight="10"
 *      :pMarginBottom="150"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *  />
 */
export default {
    name: 'GenomeAxis',
    props: {
        'scaleKey': {
            type: String
        },
        'chromosomeVariable': {
            type: String,
            default: "chromosome"
        },
        'positionVariable': {
            type: String,
            default: "position"
        },
        'side': {
            type: String
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
        },
        'getStack': {
            type: Function
        },
        'disableBrushing': {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            
        }
    },
    computed: {
        axisElemID: function() {
            return 'g_axis_' + this.uuid;
        },
        axisSelector: function() {
            return "#" + this.axisElemID;
        },
        computedWidth: function() {
            if(this._side === SIDES.BOTTOM || this._side === SIDES.TOP) {
                return this.pMarginLeft + this.pWidth + this.pMarginRight;
            } else if(this._side === SIDES.LEFT) {
                return this.pMarginLeft;
            } else if(this._side === SIDES.RIGHT) {
                return this.pMarginRight;
            }
        },
        computedHeight: function() {
            if(this._side === SIDES.LEFT || this._side === SIDES.RIGHT) {
                return this.pMarginTop + this.pHeight + this.pMarginBottom;
            } else if(this._side === SIDES.TOP) {
                return this.pMarginTop;
            } else if(this._side === SIDES.BOTTOM) {
                return this.pMarginBottom;
            }
        },
        computedTop: function() {
            if(this._side === SIDES.BOTTOM) {
                return this.pMarginTop + this.pHeight;
            }
            return 0;
        },
        computedLeft: function() {
            if(this._side === SIDES.RIGHT) {
                return this.pMarginLeft + this.pWidth;
            }
            return 0;
        },
        computedTranslateX: function() {
            if(this._side === SIDES.LEFT) {
                return this.pMarginLeft - 1;
            } else if(this._side === SIDES.BOTTOM || this._side === SIDES.TOP) {
                return this.pMarginLeft;
            }
            return 0;
        },
        computedTranslateY: function() {
            if(this._side === SIDES.LEFT) {
                return this.pMarginTop;
            } else if(this._side === SIDES.RIGHT) {
                return this.pMarginTop;
            } else if(this._side === SIDES.TOP) {
                return this.pMarginTop - 1;
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
        // Set side and orientation enum values from side prop
        let sideString = this.side.toUpperCase();
        console.assert(Object.keys(SIDES).includes(sideString));
        this._side = SIDES[sideString];
        this._orientation = (this._side === SIDES.TOP || this._side === SIDES.BOTTOM ? ORIENTATIONS.HORIZONTAL : ORIENTATIONS.VERTICAL);
        
        // Set the scale variable
        this._varScale = this.getScale(this.scaleKey);
        console.assert(this._varScale instanceof GenomeScale);
        // Subscribe to event publishers
        this._varScale.onUpdate(this.uuid, this.drawAxis);

        this._stack = this.getStack();
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
            
            const varScale = vm._varScale;
            const stack = vm._stack;
            
            

            let range;
            if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                range = [0, vm.pWidth];
            } else if(vm._orientation === ORIENTATIONS.VERTICAL) {
                range = [vm.pHeight, 0];
            }

            let axisFunction;
            if(vm._side === SIDES.TOP) {
                axisFunction = d3_axisTop;
            } else if(vm._side === SIDES.LEFT) {
                axisFunction = d3_axisLeft;
            } else if(vm._side === SIDES.RIGHT) {
                axisFunction = d3_axisRight;
            } else if(vm._side === SIDES.BOTTOM) {
                axisFunction = d3_axisBottom;
            }

            let chromosomeRatiosCumulative = varScale.getChromosomeRatiosCumulative();
            let chromosomeRatiosCumulativeFiltered = varScale.getChromosomeRatiosCumulativeFiltered();

            console.log(chromosomeRatiosCumulativeFiltered);

            let chromosomeRatioZip = d3_zip(chromosomeRatiosCumulative, varScale.chromosomes);
            let chromosomeRatioZipFiltered = d3_zip(chromosomeRatiosCumulativeFiltered, varScale.chromosomesFiltered);

            const zipToMap = (zip) => {
                let obj = {};
                zip.forEach(function(data){
                    obj[data[0]] = data[1]
                });
                return obj;
            };

            let chromosomeRatioMap = zipToMap(chromosomeRatioZip);
            let chromosomeRatioMapFiltered = zipToMap(chromosomeRatioZipFiltered);

            console.log(chromosomeRatioMap);
            
            
            let scaleZoomedOut = d3_scaleLinear()
                .domain([0, 1])
                .range(range);
            let scaleZoomedIn = d3_scaleLinear()
                .domain([0, 1])
                .range(range);
            let tickSizeOuter = 6;


            /*
             * Create the SVG elements
             */

            const container = d3_select(vm.axisSelector)
                .append("svg")
                    .attr("width", vm.computedWidth)
                    .attr("height", vm.computedHeight);
            
            const containerZoomedIn = container.append("g")
                    .attr("class", "axis-zoomed-in")
                    .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");
            
            /*
             * The zoomed-in axis
             */
            const ticksZoomedIn = containerZoomedIn.call(
                axisFunction(scaleZoomedIn)
                    .tickSizeOuter(tickSizeOuter)
                    .tickValues(chromosomeRatiosCumulativeFiltered)
                    .tickFormat((d) => chromosomeRatioMapFiltered[d])
            );

            

            ticksZoomedIn.selectAll("text")	
                    .style("text-anchor", "middle");
            
            // Get the width/height of the zoomed-in axis, before removing the text
            const axisBboxZoomedIn = container.select(".axis-zoomed-in").node().getBBox();
            



            

            /*
             * The zoomed-out axis
             */

            const betweenAxisMargin = 4;
            let axisBboxZoomedOut;

            let zoomedOutTranslateX = vm.computedTranslateX;
            let zoomedOutTranslateY = vm.computedTranslateY;

            if(vm._side === SIDES.LEFT) {
                zoomedOutTranslateX -= (axisBboxZoomedIn.width + betweenAxisMargin);
            } else if(vm._side === SIDES.BOTTOM) {
                zoomedOutTranslateY += (axisBboxZoomedIn.height + betweenAxisMargin);
            } else if(vm._side === SIDES.TOP) {
                zoomedOutTranslateY -= (axisBboxZoomedIn.height + betweenAxisMargin);
            } else if(vm._side === SIDES.RIGHT) {
                zoomedOutTranslateX += (axisBboxZoomedIn.width + betweenAxisMargin);
            }

            if(!vm.disableBrushing) {
                
                const containerZoomedOut = container.append("g")
                        .attr("class", "axis-zoomed-out")
                        .attr("transform", "translate(" + zoomedOutTranslateX + "," + zoomedOutTranslateY + ")");
                
                const ticksZoomedOut = containerZoomedOut.call(
                    axisFunction(scaleZoomedOut)
                        .tickSizeOuter(tickSizeOuter)
                        .tickValues(chromosomeRatiosCumulativeFiltered)
                        .tickFormat((d) => chromosomeRatioMapFiltered[d])
                );

                ticksZoomedOut.selectAll("text")	
                        .style("text-anchor", "middle");
                
                // Get the width/height of the zoomed-out axis, before removing the text
                axisBboxZoomedOut = container.select(".axis-zoomed-out").node().getBBox();
                

            

                /*
                 * Add brushing to the zoomed-out axis
                 */

                

                /*
                 * Display current zoom state as overlay on zoomed-out axis
                 */
                
                if(vm._orientation === ORIENTATIONS.VERTICAL) {
                    let zoomRectTranslateX;
                    if(vm._side === SIDES.LEFT) {
                        zoomRectTranslateX = (-axisBboxZoomedOut.width-betweenAxisMargin);
                    } else if(vm._side === SIDES.RIGHT) {
                        zoomRectTranslateX = 0;
                    }
                    //let start = varScale.domainFiltered[0];
                    //let end = varScale.domainFiltered[1];
                    let start = 0;
                    let end = 1;
                    containerZoomedOut.append("rect")
                        .attr("width", axisBboxZoomedOut.width+betweenAxisMargin)
                        .attr("height", scaleZoomedOut(start) - scaleZoomedOut(end))
                        .attr("x", 0)
                        .attr("y", scaleZoomedOut(end))
                        .attr("fill", "silver")
                        .attr("fill-opacity", 0.5)
                        .attr("transform", "translate(" + zoomRectTranslateX + ",0)");
                } else if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                    let zoomRectTranslateY;
                    if(vm._side === SIDES.TOP) {
                        zoomRectTranslateY = (-axisBboxZoomedOut.height-betweenAxisMargin);
                    } else if(vm._side === SIDES.BOTTOM) {
                        zoomRectTranslateY = 0;
                    }
                    
                    //let start = varScale.domainFiltered[0];
                    //let end = varScale.domainFiltered[1];
                    let start = 0;
                    let end = 1;
                    containerZoomedOut.append("rect")
                        .attr("width", scaleZoomedOut(end) - scaleZoomedOut(start))
                        .attr("height", axisBboxZoomedOut.height+betweenAxisMargin)
                        .attr("x", scaleZoomedOut(start))
                        .attr("y", 0)
                        .attr("fill", "silver")
                        .attr("fill-opacity", 0.5)
                        .attr("transform", "translate(0," + zoomRectTranslateY + ")");
                    
                }


                let axisContainerSize;
                let brush, brushed;
                if(vm._orientation === ORIENTATIONS.VERTICAL) {
                    axisContainerSize = axisBboxZoomedOut.width;
                    
                    brushed = () => {
                        let s = d3_event.selection || scaleZoomedOut.range().slice().reverse();
                        let s2 = s.map(scaleZoomedOut.invert, scaleZoomedOut);
                        varScale.zoom(s2[1], s2[0]);
                        stack.push(new HistoryEvent(HistoryEvent.types.SCALE, varScale.id, "zoom", [s2[1], s2[0]]));

                    }
                    
                    let brushExtent;
                    if(vm._side === SIDES.LEFT) {
                        brushExtent = [[-axisContainerSize-betweenAxisMargin, 0], [0, vm.pHeight]];
                    } else if(vm._side === SIDES.RIGHT) {
                        brushExtent = [[0, 0], [axisContainerSize+betweenAxisMargin, vm.pHeight]];
                    }
                    brush = d3_brushY()
                        .extent(brushExtent)
                        .on("end." + vm.axisElemID, brushed);
                    
                } else if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                    axisContainerSize = axisBboxZoomedOut.height;
                    brushed = () => {
                        let s = d3_event.selection || scaleZoomedOut.range().slice();
                        let s2 = s.map(scaleZoomedOut.invert, scaleZoomedOut);
                        varScale.zoom(s2[0], s2[1]);
                        stack.push(new HistoryEvent(HistoryEvent.types.SCALE, varScale.id, "zoom", [s2[0], s2[1]]));
                    }
                   
                    let brushExtent;
                    if(vm._side === SIDES.TOP) {
                        brushExtent = [[0, -axisContainerSize-betweenAxisMargin], [vm.pWidth, 0]];
                    } else if(vm._side === SIDES.BOTTOM) {
                        brushExtent = [[0, 0], [vm.pWidth, axisContainerSize+betweenAxisMargin]];
                    }
                    brush = d3_brushX()
                        .extent(brushExtent)
                        .on("end." + vm.axisElemID, brushed);
                }

                containerZoomedOut.append("g")
                    .attr("class", "brush")
                    .call(brush);

            } // end if not disable brushing
            
            /*
             * Axis label text
             */

            const containerLabel = container.append("g")
                    .attr("class", "axis-label")
                    .attr("transform", "translate(" + zoomedOutTranslateX + "," + zoomedOutTranslateY + ")");
            
            const labelText = containerLabel.append("text")
                .style("text-anchor", "middle")
                .text(varScale.name);

            const labelTextBbox = labelText.node().getBBox();

            if(vm.disableBrushing) {
                axisBboxZoomedOut = { width: 0, height: 0 };
            }

            let labelX, labelY, labelRotate;
            if(vm._side === SIDES.LEFT) {
                labelY = -(axisBboxZoomedOut.width + (labelTextBbox.height / 2));
                labelX = -(vm.pHeight / 2);
                labelRotate = -90;
            } else if(vm._side === SIDES.BOTTOM) {
                labelX = (vm.pWidth / 2);
                labelY = (axisBboxZoomedOut.height + (labelTextBbox.height / 2) + (betweenAxisMargin * 2));
                labelRotate = 0;
            } else if(vm._side === SIDES.TOP) {
                labelX = (vm.pWidth / 2);
                labelY = -(axisBboxZoomedOut.height + (labelTextBbox.height / 2));
                labelRotate = 0;
            } else if(vm._side === SIDES.RIGHT) {
                labelY = -(axisBboxZoomedOut.width + (labelTextBbox.height / 2));
                labelX = (vm.pHeight / 2);
                labelRotate = 90;
            }

            labelText
                .attr("x", labelX)
                .attr("y", labelY)
                .attr("transform", "rotate(" + labelRotate + ")");
            
        },
        downloadAxis() {
            let node = d3_select(this.axisSelector).select("svg").node();
            saveSvgAsPng(node, this.axisElemID + ".png");
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