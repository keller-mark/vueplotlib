<template>
    <div>
        <canvas 
            :id="this.axisElemID" 
            class="vdp-axis" 
            :style="{
                'height': this.computedHeight + 'px', 
                'width': this.computedWidth + 'px',
                'top': this.computedTop + 'px',
                'left': this.computedLeft + 'px'
            }"
        ></canvas>
        <div v-show="this.highlightX !== null && this.highlightY != null" 
            :style="{
                'position': 'absolute',
                'pointer-events': 'none',
                'height': '14px', 
                'width': '14px',
                'border-radius': '50%',
                'opacity': 0.6,
                'background-color': '#555',
                'top': (this.computedTop + this.highlightY - 7) + 'px',
                'left': (this.computedLeft + this.highlightX - 7) + 'px'
            }"
            class="vdp-axis-highlight"
        ></div>
    </div>
</template>

<script>
import Two from '../../two.js';
import { select as d3_select } from 'd3-selection';
import { cluster as d3_cluster, hierarchy as d3_hierarchy } from 'd3-hierarchy';
import { mouse as d3_mouse } from 'd3';
import debounce from 'lodash/debounce';
import { TOOLTIP_DEBOUNCE } from './../../constants.js';

import AbstractScale from './../../scales/AbstractScale.js';
import DataContainer from './../../data/DataContainer.js';
import HistoryEvent from './../../history/HistoryEvent.js';
import HistoryStack, { computedParam } from './../../history/HistoryStack.js';
import { filterHierarchy, getDelaunay } from '../../helpers.js';


import { EVENT_TYPES, EVENT_SUBTYPES } from './../../history/base-events.js';

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
            highlightX: null,
            highlightY: null,
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

        console.assert(this._side === SIDES.TOP || this._side === SIDES.BOTTOM); // TODO: implement for other sides
        
        // Set the scale variable
        this._varScale = this.getScale(this.variable);
        console.assert(this._varScale instanceof AbstractScale);

        // Set the data variable
        this._hierarchyContainer = this.getData(this.h);
        console.assert(this._hierarchyContainer instanceof DataContainer);

        // Subscribe to event publishers
        this._varScale.onUpdate(this.uuid, this.drawAxis);
        this._hierarchyContainer.onUpdate(this.uuid, this.drawAxis);

        this._stack = this.getStack();
        console.assert(this._stack instanceof HistoryStack);
    },
    mounted() {
        this.drawAxis();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._varScale.onUpdate(this.uuid, null);
        this._hierarchyContainer.onUpdate(this.uuid, null);
        this.removeAxis();
    },
    methods: {
        removeAxis() {
            d3_select(this.axisSelector).select("svg").remove();
        },
        tooltip(x, y) {
            this.highlightX = x;
            this.highlightY = y;
        },
        tooltipDestroy() {
            this.highlightX = null;
            this.highlightY = null;
        },
        drawAxis(d3Node) {
            const vm = this;
            vm.removeAxis();

            if(vm._varScale.isLoading || vm._hierarchyContainer.isLoading) {
                return;
            }
            
            const varScale = vm._varScale;
            const stack = vm._stack;

            let hierarchyData = vm._hierarchyContainer.dataCopy;
                        
            // filter hierarchyData by x scale
            hierarchyData = filterHierarchy(hierarchyData, varScale.domainFiltered);

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

            const descendants = root.descendants();


            /*
                Draw the dendrogram
            */
            let canvas;
            if(d3Node) {
                canvas = d3Node;
            } else {
                canvas = d3_select(this.axisSelector);
            }

            const canvasNode = canvas.node();

            if(!canvasNode) {
                return;
            }

            const two = new Two({ 
                width: vm.computedWidth, 
                height: vm.computedHeight, 
                domElement: canvasNode
            });

            let pathFunction;
            if(this._side === SIDES.TOP) {
                pathFunction = (d) => {
                    return two.makePath(
                        d.parent.x + vm.computedTranslateX, d.parent.y + vm.computedTranslateY, // M
                        d.x + vm.computedTranslateX, d.parent.y + vm.computedTranslateY, // H d.x
                        d.x + vm.computedTranslateX, d.y + vm.computedTranslateY, // M
                        d.x + vm.computedTranslateX, d.parent.y + vm.computedTranslateY // V d.parent.y
                    );
                }
            } else if(this._side === SIDES.BOTTOM) {
                pathFunction = (d) => {
                    return two.makePath(
                        d.parent.x + vm.computedTranslateX, (vm.pMarginBottom - d.parent.y) + vm.computedTranslateY, // M
                        d.x + vm.computedTranslateX, (vm.pMarginBottom - d.parent.y) + vm.computedTranslateY, // H d.x
                        d.x + vm.computedTranslateX, (vm.pMarginBottom - d.y) + vm.computedTranslateY, // M
                        d.x + vm.computedTranslateX, (vm.pMarginBottom - d.parent.y) + vm.computedTranslateY // V (vm.pMarginBottom - d.parent.y)
                    );
                }
            }

            let nodeTransformFunction;
            if(this._side === SIDES.TOP) {
                nodeTransformFunction = (d) => { 
                    return [d.x + vm.computedTranslateX, d.y + vm.computedTranslateY]; 
                }
            } else if(this._side === SIDES.BOTTOM) {
                nodeTransformFunction = (d) => { 
                    return [d.x + vm.computedTranslateX, (vm.pMarginBottom - d.y) + vm.computedTranslateY];
                }
            }

            const nodePoints = [];

            descendants.forEach((d, i) => {
                if(i > 0) {
                    const path = pathFunction(d);
                    path.stroke = "#555";
                    path.opacity = 0.6;
                    path.linewidth = 1.5;
                }
                nodePoints.push(nodeTransformFunction(d));
            });
            

            two.update();

            if(d3Node) {
                return;
            }

            const delaunay = getDelaunay(nodePoints, true);

            /*
             * Listen for mouse events
             */
            const getDataFromMouse = (mouseX, mouseY) => {
                const i = delaunay.find(mouseX, mouseY);
                return descendants[i];
            };

            const debouncedTooltipDestroy = debounce(vm.tooltipDestroy, TOOLTIP_DEBOUNCE);
            canvas.on("mousemove", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                const node = getDataFromMouse(mouseX, mouseY);

                if(node) {
                    const nodePoint = nodeTransformFunction(node);
                    vm.tooltip(nodePoint[0], nodePoint[1]); 
                } else {
                    debouncedTooltipDestroy(node);
                }
            })
            .on("mouseleave", vm.tooltipDestroy);

            canvas.on("click", () => {
                const mouse = d3_mouse(canvasNode);
                const mouseX = mouse[0];
                const mouseY = mouse[1];

                const node = getDataFromMouse(mouseX, mouseY);

                if(node) {
                    /* 
                    varScale.sortByHierarchy(vm._hierarchyContainer);
                    stack.push(new HistoryEvent(
                        EVENT_TYPES.SCALE,
                        EVENT_SUBTYPES.SCALE_DOMAIN_SORT,
                        vm.variable,
                        "sortByHierarchy",
                        [computedParam(EVENT_TYPES.DATA, [vm.h])]
                    ));
                    */
                    varScale.filterByHierarchy(vm._hierarchyContainer, node.data.name);
                    stack.push(new HistoryEvent(
                        EVENT_TYPES.SCALE,
                        EVENT_SUBTYPES.SCALE_DOMAIN_FILTER,
                        vm.variable,
                        "filterByHierarchy",
                        [computedParam(EVENT_TYPES.DATA, [vm.h]), node.data.name]
                    ));
                }
            });
            
        }
    }
}
</script>

<style>
@import '../../style/axis-style.css';
</style>