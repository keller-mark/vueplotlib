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
import { scaleBand as d3_scaleBand, scaleLinear as d3_scaleLinear, scaleLog as d3_scaleLog } from 'd3-scale';
import { select as d3_select } from 'd3-selection';
import { axisTop as d3_axisTop, axisLeft as d3_axisLeft, axisRight as d3_axisRight, axisBottom as d3_axisBottom } from 'd3-axis';
import { brushX as d3_brushX, brushY as d3_brushY } from 'd3-brush';
import { event as d3_event } from 'd3';

import AbstractScale from './../../scales/AbstractScale.js';
import HistoryEvent from './../../history/HistoryEvent.js';
import HistoryStack from './../../history/HistoryStack.js';

import { EVENT_TYPES, EVENT_SUBTYPES } from './../../history/base-events.js';
import CategoricalScale from './../../scales/CategoricalScale.js';
import ContinuousScale from './../../scales/ContinuousScale.js';

const SIDES = Object.freeze({ "TOP": 1, "LEFT": 2, "RIGHT": 3, "BOTTOM": 4 });
const ORIENTATIONS = Object.freeze({ "VERTICAL": 1, "HORIZONTAL": 2 }); // vertical = left/right, horizontal = top/bottom

let uuid = 0;
/**
 * @prop {string} variable The axis variable key.
 * @prop {string} side The side for the scale.
 * @prop {number} tickRotation An angle used to rotate axis tick text.
 * @prop {number} pWidth The plot width.
 * @prop {number} pHeight The plot height.
 * @prop {number} pMarginTop The plot top margin.
 * @prop {number} pMarginLeft The plot left margin.
 * @prop {number} pMarginRight The plot right margin.
 * @prop {number} pMarginBottom The plot bottom margin.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} getStack Function that returns a HistoryStack instance.
 * @prop {boolean} disableBrushing Whether to disable brushing functionality and hide the zoomed-out "context" view. Default: false
 * @prop {boolean} log Whether to have log scaled variable. Default: false
 * @prop {boolean} showLabel Whether to show the label. Default: true
 * @prop {number} maxCharacters The maximum number of characters, where the rest will be trimmed. Optional.
 * 
 * @example
 * <Axis
 *      variable="y"
 *      side="left" 
 *      :tickRotation="-35"
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
    name: 'Axis',
    props: {
        'variable': {
            type: String
        },
        'side': {
            type: String
        },
        'tickRotation': {
            type: Number,
            default: 0
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
        },
        'showLabel': {
            type: Boolean,
            default: true
        },
        'autoRemoveTicks': {
            type: Boolean,
            default: true
        },
        'log': {
            type: Boolean,
            default: false
        },
        'maxCharacters': {
            type: Number,
            required: false
        }
    },
    data() {
        return {
            
        }
    },
    computed: {
        axisElemID: function() {
            return 'axis_' + this.uuid;
        },
        axisSelector: function() {
            return "#" + this.axisElemID;
        },
        computedWidth: function() {
            if(this._side === SIDES.BOTTOM || this._side === SIDES.TOP) {
                return this.pMarginLeft + this.pWidth + this.pMarginRight;
            } else if(this._side === SIDES.LEFT) {
                return this.pMarginLeft + 1;
            } else if(this._side === SIDES.RIGHT) {
                return this.pMarginRight;
            }
        },
        computedHeight: function() {
            if(this._side === SIDES.LEFT || this._side === SIDES.RIGHT) {
                return this.pMarginTop + this.pHeight + this.pMarginBottom;
            } else if(this._side === SIDES.TOP) {
                return this.pMarginTop + 1;
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
                return this.pMarginLeft;
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
                return this.pMarginTop;
            } else if(this._side === SIDES.BOTTOM) {
                return 0;
            }

        }
    },
    watch: {
        pMarginTop() {
            this.drawAxis();
        },
        pMarginLeft() {
            this.drawAxis();
        },
        pMarginRight() {
            this.drawAxis();
        },
        pMarginBottom() {
            this.drawAxis();
        },
        pWidth() {
            this.drawAxis();
        },
        pHeight() {
            this.drawAxis();
        },
        log() {
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
        this._varScale = this.getScale(this.variable);
        console.assert(this._varScale instanceof AbstractScale);
        // Subscribe to event publishers
        this._varScale.onUpdate(this.uuid, this.drawAxis);

        this._stack = this.getStack();
        console.assert(this._stack instanceof HistoryStack);
    },
    mounted() {
        this.drawAxis();
    },
    beforeDestroy() {
        // Unsubscribe to events
        this._varScale.onUpdate(this.uuid, null);
        this.removeAxis();
    },
    methods: {
        removeAxis() {
            d3_select(this.axisSelector).select("svg").remove();
        },
        drawAxis(d3Node, brushingOverride) {
            const vm = this;
            vm.removeAxis();

            if(vm._varScale.isLoading) {
                return;
            }

            const disableBrushing = (brushingOverride === true) || vm.disableBrushing;
            
            const varScale = vm._varScale;
            const stack = vm._stack;

            let varScaleDomain = varScale.domain;
            let varScaleDomainFiltered = varScale.domainFiltered;
            if(varScale instanceof ContinuousScale) {
                if(vm.log) {
                    if(varScaleDomain[0] == 0) {
                        varScaleDomain = varScaleDomain.slice();
                        varScaleDomain[0] = 1;
                    }
                    if(varScaleDomainFiltered[0] == 0) {
                        varScaleDomainFiltered = varScaleDomainFiltered.slice();
                        varScaleDomainFiltered[0] = 1;
                    }
                }
            }

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

            let scaleZoomedOut, scaleZoomedIn, tickSizeOuter;
            if(varScale instanceof CategoricalScale) {
                if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                    scaleZoomedOut = d3_scaleBand()
                        .domain(varScaleDomain)
                        .range(range);
                    scaleZoomedIn = d3_scaleBand()
                        .domain(varScaleDomainFiltered)
                        .range(range);
                } else if(vm._orientation === ORIENTATIONS.VERTICAL) {
                    scaleZoomedOut = d3_scaleBand()
                        .domain(varScaleDomain.slice().reverse())
                        .range(range);
                    scaleZoomedIn = d3_scaleBand()
                        .domain(varScaleDomainFiltered.slice().reverse())
                        .range(range);
                }
                tickSizeOuter = 0;
            } else if(varScale instanceof ContinuousScale) {
                let continuousScaleFunc = d3_scaleLinear;
                if(vm.log) {
                    continuousScaleFunc = d3_scaleLog;
                }
                scaleZoomedOut = continuousScaleFunc()
                    .domain(varScaleDomain)
                    .range(range);
                scaleZoomedIn = continuousScaleFunc()
                    .domain(varScaleDomainFiltered)
                    .range(range);
                tickSizeOuter = 6;
                // TODO: options for log, etc...
            }

            /*
             * Create the SVG elements
             */
            
            let container;
            if(d3Node) {
                container = d3Node;
            } else {
                container = d3_select(vm.axisSelector)
                    .append("svg")
                        .attr("width", vm.computedWidth)
                        .attr("height", vm.computedHeight);
            }
            
            const containerZoomedIn = container.append("g")
                    .attr("class", "axis-zoomed-in")
                    .attr("transform", "translate(" + vm.computedTranslateX + "," + vm.computedTranslateY + ")");
            
            /*
             * The zoomed-in axis
             */
            let tickFormatFunction = undefined;
            if(varScale instanceof CategoricalScale) {
                tickFormatFunction = ((d) => varScale.toHuman(d));
            }

            let tickFormatFunction2 = undefined;
            if(vm.maxCharacters !== undefined) {
                if(tickFormatFunction !== undefined) {
                    tickFormatFunction2 = (d) => {
                        let humanD = varScale.toHuman(d);
                        if(humanD.length > vm.maxCharacters) {
                            return (humanD.substring(0, vm.maxCharacters) + "...");
                        }
                        return humanD;
                    }
                } else {
                    tickFormatFunction2 = (d) => {
                        if(d.length > vm.maxCharacters) {
                            return (d.substring(0, vm.maxCharacters) + "...");
                        }
                        return d;
                    }
                }
            }
            const ticksZoomedIn = containerZoomedIn.call(
                axisFunction(scaleZoomedIn)
                    .tickSizeOuter(tickSizeOuter)
                    .tickFormat(tickFormatFunction2)
            );


            let textBboxZoomedIn;
            try {
                textBboxZoomedIn = ticksZoomedIn.select("text").node().getBBox();
            } catch(e) {
                // Replace with dummy object on failure
                // TODO: find better solution
                textBboxZoomedIn = { height: 0 };
            }

            const tickTransformFunction = (d, i, v) => {
                let tickBbox;
                try {
                    tickBbox = v[i].getBBox();
                } catch(e) {
                    tickBbox = { height: 0 };
                }
                let tickRotateX = 0;
                let tickRotateY = 0;
                if(vm._side === SIDES.TOP) {
                    tickRotateY = -tickBbox.height;
                } else if(vm._side === SIDES.BOTTOM) {
                    tickRotateY = tickBbox.height;
                } else if(vm._side === SIDES.LEFT) {
                    tickRotateX = -tickBbox.height;
                } else if(vm._side === SIDES.RIGHT) {
                    tickRotateX = tickBbox.height;
                }
                return "rotate(" + vm.tickRotation + "," + tickRotateX + "," + tickRotateY + ")";
            }

            let tickTextAnchor = "middle";
            if(vm.tickRotation !== 0) {
                if(vm._side === SIDES.LEFT || vm._side === SIDES.BOTTOM) {
                    tickTextAnchor = "end";
                } else {
                    tickTextAnchor = "start";
                }
            } else {
                if(vm._side === SIDES.LEFT) {
                    tickTextAnchor = "end";
                } else if(vm._side === SIDES.RIGHT) {
                    tickTextAnchor = "start";
                }
            }

            ticksZoomedIn.selectAll("text")	
                    .attr("text-anchor", tickTextAnchor)
                    .attr("transform", tickTransformFunction);

            
            
            
            // Get the width/height of the zoomed-in axis, before removing the text
            let axisBboxZoomedIn;
            try {
                axisBboxZoomedIn = container.select(".axis-zoomed-in").node().getBBox();
            } catch(e) {
                axisBboxZoomedIn = {
                    height: 0,
                    width: 0,
                };
            }
            
            if(varScale instanceof CategoricalScale) {
                if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                    const barWidth = vm.pWidth / varScaleDomainFiltered.length;
                    if(vm.autoRemoveTicks && barWidth < textBboxZoomedIn.height) {
                        ticksZoomedIn.selectAll("text")
                            .remove();
                    }
                } else if(vm._orientation === ORIENTATIONS.VERTICAL) {
                    const barHeight = vm.pHeight / varScaleDomainFiltered.length;
                    if(vm.autoRemoveTicks && barHeight < textBboxZoomedIn.height) {
                        ticksZoomedIn.selectAll("text")
                            .remove();
                    }
                }
            }


            

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

            if(!disableBrushing) {
                
                const containerZoomedOut = container.append("g")
                        .attr("class", "axis-zoomed-out")
                        .attr("transform", "translate(" + zoomedOutTranslateX + "," + zoomedOutTranslateY + ")");
                
                const ticksZoomedOut = containerZoomedOut.call(
                    axisFunction(scaleZoomedOut)
                        .tickSizeOuter(tickSizeOuter)
                        .tickFormat(tickFormatFunction2)
                );
                let textBboxZoomedOut;
                try {
                    textBboxZoomedOut = ticksZoomedOut.select("text").node().getBBox();
                } catch(e) {
                    textBboxZoomedOut = { height: 0 };
                }

                ticksZoomedOut.selectAll("text")	
                        .style("text-anchor", tickTextAnchor)
                        .attr("transform", tickTransformFunction);
                
                // Get the width/height of the zoomed-out axis, before removing the text
                try {
                    axisBboxZoomedOut = container.select(".axis-zoomed-out").node().getBBox();
                } catch(e) {
                    axisBboxZoomedOut = {
                        height: 0,
                        width: 0,
                    };
                }
                
                if(varScale instanceof CategoricalScale) {
                    const barWidth = vm.pWidth / varScaleDomain.length;
                    if(vm.autoRemoveTicks && barWidth < textBboxZoomedOut.height) {
                        ticksZoomedOut.selectAll("text")
                            .remove();
                    }
                }

            

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
                    if(varScale instanceof ContinuousScale) {  
                        let start = varScaleDomainFiltered[0];
                        let end = varScaleDomainFiltered[1];
                        containerZoomedOut.append("rect")
                            .attr("width", axisBboxZoomedOut.width+betweenAxisMargin)
                            .attr("height", scaleZoomedOut(start) - scaleZoomedOut(end))
                            .attr("x", 0)
                            .attr("y", scaleZoomedOut(end))
                            .attr("fill", "silver")
                            .attr("fill-opacity", 0.5)
                            .attr("transform", "translate(" + zoomRectTranslateX + ",0)");
                    } else if(varScale instanceof CategoricalScale) {
                        let eachBand = vm.pHeight / varScaleDomain.length;
                        for(let domainFilteredItem of varScaleDomainFiltered) {
                            containerZoomedOut.append("rect")
                                .attr("width", axisBboxZoomedOut.width+betweenAxisMargin)
                                .attr("height", eachBand)
                                .attr("x", 0)
                                .attr("y", scaleZoomedOut(domainFilteredItem))
                                .attr("fill", "silver")
                                .attr("fill-opacity", 0.5)
                                .attr("transform", "translate(" + zoomRectTranslateX + ",0)");
                        }
                    }
                } else if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                    let zoomRectTranslateY;
                    if(vm._side === SIDES.TOP) {
                        zoomRectTranslateY = (-axisBboxZoomedOut.height-betweenAxisMargin);
                    } else if(vm._side === SIDES.BOTTOM) {
                        zoomRectTranslateY = 0;
                    }
                    if(varScale instanceof CategoricalScale) {  
                        let eachBand = vm.pWidth / varScaleDomain.length;
                        for(let domainFilteredItem of varScaleDomainFiltered) {
                            containerZoomedOut.append("rect")
                                .attr("width", eachBand)
                                .attr("height", axisBboxZoomedOut.height)
                                .attr("x", scaleZoomedOut(domainFilteredItem))
                                .attr("y", 0)
                                .attr("fill", "silver")
                                .attr("fill-opacity", 0.5)
                                .attr("transform", "translate(0," + zoomRectTranslateY + ")");
                        }
                    } else if(varScale instanceof ContinuousScale) {
                        let start = varScaleDomainFiltered[0];
                        let end = varScaleDomainFiltered[1];
                        containerZoomedOut.append("rect")
                            .attr("width", scaleZoomedOut(end) - scaleZoomedOut(start))
                            .attr("height", axisBboxZoomedOut.height+betweenAxisMargin)
                            .attr("x", scaleZoomedOut(start))
                            .attr("y", 0)
                            .attr("fill", "silver")
                            .attr("fill-opacity", 0.5)
                            .attr("transform", "translate(0," + zoomRectTranslateY + ")");
                    }
                }


                let axisContainerSize;
                let brush, brushed;
                if(vm._orientation === ORIENTATIONS.VERTICAL) {
                    axisContainerSize = axisBboxZoomedOut.width;
                    if(varScale instanceof ContinuousScale) {
                        brushed = () => {
                            if (!d3_event.sourceEvent) return;
                            let s = d3_event.selection || scaleZoomedOut.range().slice().reverse();
                            let s2 = s.map(scaleZoomedOut.invert, scaleZoomedOut);
                            varScale.zoom(s2[1], s2[0]);
                            stack.push(new HistoryEvent(
                                EVENT_TYPES.SCALE, 
                                EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                                varScale.id, 
                                "zoom", 
                                [s2[1], s2[0]]
                            ));
                        }
                    } else if(varScale instanceof CategoricalScale) {
                        brushed = () => {
                            if (!d3_event.sourceEvent) return;
                            let s = d3_event.selection || scaleZoomedOut.range().slice().reverse();
                            let eachBand = vm.pHeight / varScaleDomain.length;
                            let startIndex = Math.floor((s[0] / eachBand));
                            let endIndex = Math.ceil((s[1] / eachBand));
                            varScale.zoom(startIndex, endIndex);
                            stack.push(new HistoryEvent(
                                EVENT_TYPES.SCALE, 
                                EVENT_SUBTYPES.SCALE_DOMAIN_FILTER,
                                varScale.id, 
                                "zoom", 
                                [startIndex, endIndex]
                            ));
                        }
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
                    if(varScale instanceof ContinuousScale) {
                        brushed = () => {
                            if (!d3_event.sourceEvent) return;
                            let s = d3_event.selection || scaleZoomedOut.range().slice();
                            let s2 = s.map(scaleZoomedOut.invert, scaleZoomedOut);
                            varScale.zoom(s2[0], s2[1]);
                            stack.push(new HistoryEvent(
                                EVENT_TYPES.SCALE, 
                                EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, 
                                varScale.id, 
                                "zoom", 
                                [s2[0], s2[1]]
                            ));
                        }
                    } else if(varScale instanceof CategoricalScale) {
                        brushed = () => {
                            if (!d3_event.sourceEvent) return;
                            let s = d3_event.selection || scaleZoomedOut.range().slice();
                            let eachBand = vm.pWidth / varScaleDomain.length;
                            let startIndex = Math.floor((s[0] / eachBand));
                            let endIndex = Math.ceil((s[1] / eachBand));
                            varScale.zoom(startIndex, endIndex);
                            stack.push(new HistoryEvent(
                                EVENT_TYPES.SCALE, 
                                EVENT_SUBTYPES.SCALE_DOMAIN_FILTER,
                                varScale.id, 
                                "zoom", 
                                [startIndex, endIndex]
                            ));
                        }
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

                if(varScale instanceof ContinuousScale) {
                    let brushMoveDomain;
                    if(vm._orientation === ORIENTATIONS.VERTICAL) {
                        brushMoveDomain = scaleZoomedIn.domain().slice().reverse();
                    } else if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                        brushMoveDomain = scaleZoomedIn.domain().slice();
                    }
                    let brushMoveRange = brushMoveDomain.map(scaleZoomedOut);
                    containerZoomedOut.append("g")
                        .attr("class", "brush")
                        .call(brush)
                        .call(brush.move, brushMoveRange);
                } else if(varScale instanceof CategoricalScale) {
                    // Only allow "moving" of the brush if all domainFiltered elements are consecutive/no gaps between
                    let hasGaps = false;
                    let domain = varScaleDomain;
                    let domainFiltered = varScaleDomainFiltered;
                    let currDomainIndex = null;
                    for(let domainFilteredElement of domainFiltered) {
                        let elementIndex = domain.indexOf(domainFilteredElement);
                        if(elementIndex === -1) {
                            hasGaps = true; // stop if encounter any elements of filteredDomain that are not found in domain
                            break;
                        }
                        if(currDomainIndex === null) {
                            currDomainIndex = elementIndex;
                        } else if(elementIndex - currDomainIndex > 1) {
                            hasGaps = true;
                            break;
                        }
                        currDomainIndex = elementIndex;
                    }

                    if(hasGaps) {
                        // Do not allow "moving"
                        containerZoomedOut.append("g")
                            .attr("class", "brush")
                            .call(brush);
                    } else {
                        // No gaps, allow "moving"
                        let eachBand;
                        if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                            eachBand = vm.pWidth / varScaleDomain.length;
                        } else if(vm._orientation === ORIENTATIONS.VERTICAL) {
                            eachBand = vm.pHeight / varScaleDomain.length;
                        }
                        
                        let brushMoveRange = [scaleZoomedOut(domainFiltered[0]), scaleZoomedOut(domainFiltered[domainFiltered.length - 1]) + eachBand];
                        containerZoomedOut.append("g")
                            .attr("class", "brush")
                            .call(brush)
                            .call(brush.move, brushMoveRange);
                    }
                }
                


            } // end if not disable brushing
            
            /*
             * Axis label text
             */

            const containerLabel = container.append("g")
                    .attr("class", "axis-label")
                    .attr("transform", "translate(" + zoomedOutTranslateX + "," + zoomedOutTranslateY + ")");
            
            const labelText = containerLabel.append("text")
                .style("text-anchor", "middle")
                .style("font-family", "Avenir")
                .text(varScale.name);

            let labelTextBbox;
            try {
                labelTextBbox = labelText.node().getBBox();
                if(d3Node) {
                    throw new Error("no bbox, use catch block");
                }
            } catch(e) {
                if(vm._orientation === ORIENTATIONS.HORIZONTAL) {
                    labelTextBbox = {
                        height: vm.computedHeight / 2,
                        width: 0
                    };
                } else if(vm._orientation === ORIENTATIONS.VERTICAL) {
                    labelTextBbox = {
                        height: vm.computedWidth / 2,
                        width: 0
                    };
                }
            }

            if(disableBrushing) {
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
            
            if(!vm.showLabel) {
                labelText.attr("fill-opacity", 0);
            }
            
        }
    }
}
</script>

<style>
@import '../../style/axis-style.css';
</style>