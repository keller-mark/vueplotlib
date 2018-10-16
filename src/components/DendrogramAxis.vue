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
import { select as d3_select } from 'd3-selection';
import { cluster as d3_cluster, hierarchy as d3_hierarchy } from 'd3-hierarchy';

import { saveSvgAsPng } from 'save-svg-as-png';

import AbstractScale from './../scales/AbstractScale.js';
import DataContainer from './../data/DataContainer.js';
import HistoryEvent from './../history/HistoryEvent.js';
import { filterHierarchy } from '../helpers.js';

const SIDES = Object.freeze({ "TOP": 1, "LEFT": 2, "RIGHT": 3, "BOTTOM": 4 });
const ORIENTATIONS = Object.freeze({ "VERTICAL": 1, "HORIZONTAL": 2 }); // vertical = left/right, horizontal = top/bottom

let uuid = 0;
/**
 * @prop {string} variable The axis variable key.
 * @prop {string} h The hierarchy data container key (passed to getData).
 * @prop {string} side The side for the scale.
 * @prop {number} pWidth The plot width.
 * @prop {number} pHeight The plot height.
 * @prop {number} pMarginTop The plot top margin.
 * @prop {number} pMarginLeft The plot left margin.
 * @prop {number} pMarginRight The plot right margin.
 * @prop {number} pMarginBottom The plot bottom margin.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} getStack Function that returns a HistoryStack instance.
 * @prop {function} getData Function that takes a data key string and returns a DataContainer instance.
 * 
 * @example
 * <DendrogramAxis
 *      variable="sample_id"
 *      h="sample_clusters"
 *      side="top"
 *      :pWidth="500"
 *      :pHeight="300"
 *      :pMarginTop="300"
 *      :pMarginLeft="10"
 *      :pMarginRight="10"
 *      :pMarginBottom="10"
 *      :getData="getData"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *  />
 */
export default {
    name: 'DendrogramAxis',
    props: {
        'variable': {
            type: String
        },
        'h': {
            type: String // hierarcy data container
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
        'getData': {
            type: Function
        },
        'getScale': {
            type: Function
        },
        'getStack': {
            type: Function
        }
    },
    data() {
        return {
            
        }
    },
    computed: {
        axisElemID: function() {
            return 'd_axis_' + this.uuid;
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
            if(this._side === SIDES.BOTTOM || this._side === SIDES.TOP) {
                return this.pMarginLeft;
            }
            return 0;
        },
        computedTranslateY: function() {
            if(this._side === SIDES.LEFT || this._side === SIDES.RIGHT) {
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
        // Set side and orientation enum values from side prop
        let sideString = this.side.toUpperCase();
        console.assert(Object.keys(SIDES).includes(sideString));
        this._side = SIDES[sideString];
        this._orientation = (this._side === SIDES.TOP || this._side === SIDES.BOTTOM ? ORIENTATIONS.HORIZONTAL : ORIENTATIONS.VERTICAL);

        console.assert(this._side === SIDES.TOP); // TODO: implement for other sides
        
        // Set the scale variable
        this._varScale = this.getScale(this.variable);
        console.assert(this._varScale instanceof AbstractScale);

        // Set the data variable
        this._hierarchyContainer = this.getData(this.h);
        console.assert(this._hierarchyContainer instanceof DataContainer);

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
            let hierarchyData = vm._hierarchyContainer.dataCopy;
                        
            // filter hierarchyData by x scale
            hierarchyData = filterHierarchy(hierarchyData, varScale);

            /*
                Prepare the hierarchy
            */
            let size;
            if(this._side === SIDES.BOTTOM) {
                size = [vm.pWidth, vm.pMarginBottom];
            } else if(this._side === SIDES.TOP) {
                size = [vm.pWidth, vm.pMarginTop];
            } else if(this._side === SIDES.LEFT) {
                size = [vm.pMarginLeft, vm.pHeight];
            } else if(this._side === SIDES.RIGHT) {
                size = [vm.pMarginRight, vm.pHeight];
            }
            // TODO: allow for dendrogram on side, bottom ,etc...

            const tree = d3_cluster()
                .size(size)
                .separation(() => 1);
            const root = d3_hierarchy(hierarchyData);
            tree(root);


            /*
                Draw the dendrogram
            */
           const container = d3_select(vm.axisSelector)
                .append("svg")
                    .attr("width", vm.computedWidth)
                    .attr("height", vm.computedHeight);
            
            const gTree = container.append("g")
                .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");

            gTree.selectAll(".link")
                .data(root.descendants().slice(1))
                .enter().append("path")
                .attr("class", "link")
                .attr("d", function(d) {
                    return "M" + d.parent.x + "," + d.parent.y
                        + "H" + d.x
                        + "M" + d.x + "," + d.y
                        + "V" + d.parent.y;
                })
                .attr("fill", "none")
                .attr("stroke", "#555")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", "1.5px");
            
            const nodes = gTree.selectAll(".node")
                .data(root.descendants())
                .enter().append("g")
                .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

            /* nodes.append("text")
                .style("display", (d) => { return d.children ? 'none' : 'normal'; })
                .text((d) => { return d.data.name; })
                .style("font", "10px sans-serif")
                .style("text-anchor", "end")
                .attr("dx", "-.6em")
                .attr("dy", ".6em")
                .attr("transform", "rotate(-65)"); */

            // TODO: add node selection for filtering
           

            
        },
        downloadAxis() {
            let node = d3_select(this.axisSelector).select("svg").node();
            saveSvgAsPng(node, this.axisElemID + ".png");
        }
    }
}
</script>

<style>
@import '../style/axis-style.css';
</style>