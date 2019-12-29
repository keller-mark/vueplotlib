<script>
import { DOWNLOAD_PATH } from './../icons.js';
import { create as d3_create, event as d3_event } from 'd3';
import { select as d3_select } from 'd3-selection';
import { drag as d3_drag } from 'd3-drag';


/**
 * Function that takes in array of VNodes and adds props from a provided props object.
 * @private
 * @param {array} slotArray Array of named slot VNodes.
 * @param {object} newProps Object mapping prop keys to values.
 * @return {array} The updated array of VNode with the added props.
 */
const addProp = function(slotArray, newProps) {
    if (slotArray) {
        slotArray = slotArray.map((vnode) => {
            if (vnode.componentOptions && vnode.componentOptions.propsData) {
                const newNode = vnode;
                for(let propName of Object.keys(newProps)) {
                    newNode.componentOptions.propsData[propName] = newProps[propName];
                }
                return newNode;
            }
            return vnode;
        });
        return slotArray
    }
    return [];
}

/**
 * Given an SVG DOM node, return the SVG contents as a data URI that can be saved to a file.
 * @private
 * @param {any} svg The SVG node.
 * @returns {string}
 */
const svgToUri = function(svg) {
    // Reference: https://stackoverflow.com/a/23218877
    const serializer = new XMLSerializer();
    var source = serializer.serializeToString(svg);

    // Add namespace.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // Add xml declaration.
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    // Convert svg source to URI.
    //return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    return source;
};


/**
 * This component is a container for axis and plot components, 
 * which passes its props to its children and imposes styles.
 * @prop {number} pWidth The plot width.
 * @prop {number} pHeight The plot height.
 * @prop {number} pMarginTop The plot top margin.
 * @prop {number} pMarginLeft The plot left margin.
 * @prop {number} pMarginRight The plot right margin.
 * @prop {number} pMarginBottom The plot bottom margin.
 * @prop {boolean} showDownloadButton Show a download button (in top left corner). Optional. Default: false.
 * @prop {number} downloadButtonOffsetX x-offset of the download button. Optional. Only makes sense to use if showDownloadButton is true.
 * @prop {number} downloadButtonOffsetY y-offset of the download button. Optional. Only makes sense to use if showDownloadButton is true.
 * @prop {number} downloadButtonSize size of the download button. Optional. Default: 16. Only makes sense to use if showDownloadButton is true.
 * @prop {string} downloadButtonFill color of the download button. Optional. Default: "#C0C0C0". Only makes sense to use if showDownloadButton is true.
 * 
 * @example
 * <PlotContainer
 *    :pWidth="500"
 *    :pHeight="300"
 *    :pMarginTop="10"
 *    :pMarginLeft="120"
 *    :pMarginRight="10"
 *    :pMarginBottom="150"
 *  >
 *    <Axis
 *      slot="axisLeft" <!-- note the slot prop -->
 *      variable="exposure"
 *      side="left" 
 *      :tickRotation="-35"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *      <!-- note the axis props that are omitted because they are being inherited -->
 *    />
 *    <BarPlot
 *      slot="plot" <!-- note the slot prop -->
 *      data="exposures_single_data"
 *      x="signature" 
 *      y="exposure"
 *      :getData="getData"
 *      :getScale="getScale"
 *      <!-- note the plot props that are omitted because they are being inherited -->
 *    />
 *    <Axis
 *      slot="axisBottom" <!-- note the slot prop -->
 *      variable="signature"
 *      side="bottom" 
 *      :tickRotation="-65"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *      :disableBrushing="true"
 *      <!-- note the axis props that are omitted because they are being inherited -->
 *    />
 *  </PlotContainer>
 */
export default {
    name: 'PlotContainer',
    props: {
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
        'showDownloadButton': {
            type: Boolean,
            default: false
        },
        'downloadButtonOffsetX': {
            type: Number,
            default: 0
        },
        'downloadButtonOffsetY': {
            type: Number,
            default: 0
        },
        'downloadButtonSize': {
            type: Number,
            default: 16
        },
        'downloadButtonFill': {
            type: String,
            default: "#C0C0C0"
        },
        'downloadName': {
            type: String,
            default: "plot"
        },
        'showResizeButton': {
            type: Boolean,
            default: false
        },
        'resizeButtonSize': {
            type: Number,
            default: 16
        },
        'resizeButtonColor': {
            type: String,
            default: "gray"
        },
    },
    data() {
        return {
            initialKey: 1,
            initialY: 0,
            offsetY: 0,
        };
    },
    mounted() {
        this.initResizeButton();
    },
    render(h) {
        const props = Object.assign({}, this.$props);
        props["pHeight"] = this.pHeight + this.offsetY;

        this.$slots.axisTop = addProp(this.$slots.axisTop, props);
        this.$slots.axisLeft = addProp(this.$slots.axisLeft, props);
        this.$slots.plot = addProp(this.$slots.plot, props);
        this.$slots.axisRight = addProp(this.$slots.axisRight, props);
        this.$slots.axisBottom = addProp(this.$slots.axisBottom, props);

        const buttonChildren = [];
        if(this.showDownloadButton) {
            buttonChildren.push(h('svg', 
                { 
                    key: `dl-btn-${this.initialKey}`,
                    class: 'vdp-plot-container-dl-btn', 
                    attrs: {
                        'width': this.downloadButtonSize, 
                        'height': this.downloadButtonSize, 
                        'viewBox': '0 0 24 24'
                    }, 
                    style: {
                        'top': (this.downloadButtonOffsetY + 'px'), 
                        'left': (this.downloadButtonOffsetX + 'px')
                    }, 
                    on: { click: ()=>{this.downloadViaButton();} } 
                }, 
                [h('path', {attrs: {'d': DOWNLOAD_PATH, 'fill': this.downloadButtonFill }})]
            ));
        }
        if(this.showResizeButton) {
            buttonChildren.push(h('svg', 
                { 
                    ref: 'resizeButton',
                    class: 'vdp-plot-container-rs-btn', 
                    attrs: {
                        'width': this.resizeButtonSize, 
                        'height': this.resizeButtonSize, 
                        'viewBox': '0 0 24 24'
                    }, 
                    style: {
                        'left': ((this.pMarginLeft + this.pWidth + this.pMarginRight - this.resizeButtonSize) + 'px'),
                        'top': ((this.pMarginTop + props["pHeight"] + this.pMarginBottom - this.resizeButtonSize) + 'px'),
                    }
                }, 
                [
                    h('line', {attrs: {
                        'x1': 0,
                        'y1': 26,
                        'x2': 26,
                        'y2': 0,
                        'stroke': this.resizeButtonColor, 
                        'stroke-width': 1 
                    }}),
                    h('line', {attrs: {
                        'x1': 0,
                        'y1': 32,
                        'x2': 32,
                        'y2': 0,
                        'stroke': this.resizeButtonColor, 
                        'stroke-width': 1 
                    }}),
                    h('line', {attrs: {
                        'x1': 0,
                        'y1': 38,
                        'x2': 38,
                        'y2': 0,
                        'stroke': this.resizeButtonColor, 
                        'stroke-width': 1 
                    }}),
                    h('line', {attrs: {
                        'x1': 0,
                        'y1': 44,
                        'x2': 44,
                        'y2': 0,
                        'stroke': this.resizeButtonColor, 
                        'stroke-width': 1 
                    }})
                ]
            ));
        }
        
        const children = ([]).concat(
            h('div', { key: `axisTop-${this.initialKey}` }, [ this.$slots.axisTop ]), 
            h('div', { key: `axisLeft-${this.initialKey}` }, [ this.$slots.axisLeft ]),
            h('div', { key: `plot-${this.initialKey}` }, [ this.$slots.plot ]),
            h('div', { key: `axisRight-${this.initialKey}` }, [ this.$slots.axisRight ]),
            h('div', { key: `axisBottom-${this.initialKey}` }, [ this.$slots.axisBottom ]),
            h('div', { key: `buttons-${this.initialKey}` }, buttonChildren)
        );  

        let classes = ['vdp-plot-container'];
        let styles = {
            width: this.fullWidth + 'px',
            height: this.fullHeight + 'px'
        };

        this.$nextTick(this.initResizeButton);

        return h('div', { class: classes, style: styles }, children);
    },
    computed: {
        fullWidth() {
            return this.pMarginLeft + this.pWidth + this.pMarginRight;
        },
        fullHeight() {
            return this.pMarginTop + this.pHeight + this.offsetY + this.pMarginBottom;
        }
    },
    watch: {
        pWidth() {
            this.initialKey++;
        },
        pHeight() {
            this.initialKey++;
        },
        pMarginTop() {
            this.initialKey++;
        },
        pMarginLeft() {
            this.initialKey++;
        },
        pMarginRight() {
            this.initialKey++;
        },
        pMarginBottom() {
            this.initialKey++;
        }
    },
    methods: {
        downloadViaButton() {
            const blob = this.download();
            const url = URL.createObjectURL(blob);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", url);
            downloadAnchorNode.setAttribute("download", this.downloadName + ".svg");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },
        initResizeButton() {
            if(this.showResizeButton) {
                if(this.$refs.resizeButton) {
                    const resizeDiv = d3_select(this.$refs.resizeButton);
                    resizeDiv.call(
                        d3_drag()
                            .on("start", () => {
                                this.dragState = 0;
                                this.initialY = d3_event.sourceEvent.pageY - this.offsetY;
                                this.initialKey++;
                            })
                            .on("drag", () => {
                                this.offsetY = Math.max(-this.pHeight, d3_event.sourceEvent.pageY - this.initialY);
                                this.initialKey++;
                            })
                            .on("end", () => {
                                this.initialY = d3_event.sourceEvent.pageY;
                                this.initialKey++;
                            })
                    );
                }
            }
        },
        download() {
            const pHeight = this.pHeight + this.offsetY;

            const svg = d3_create("svg")
                .attr("width", this.fullWidth)
                .attr("height", this.fullHeight);
            
            const defs = svg
                .append("defs");
            
            const renderAxisToContext = (axisType) => {
                if(this.$slots[axisType].length > 0) {
                    try {
                        this.$slots[axisType][0].componentInstance.pHeight = pHeight;
                        this.$slots.plot[0].componentInstance.pHeight = pHeight;
                    } catch(e) {
                        console.log(e);
                    }

                    const x = this.$slots[axisType][0].componentInstance.computedLeft;
                    let y = this.$slots[axisType][0].componentInstance.computedTop;
                    const width = this.$slots[axisType][0].componentInstance.computedWidth;
                    let height = this.$slots[axisType][0].componentInstance.computedHeight
                    
                    if(axisType === "axisLeft" || axisType === "axisRight") {
                        height += this.offsetY;
                    }
                    if(axisType === "axisBottom") {
                        y += this.offsetY;
                    }

                    defs
                        .append("clipPath")
                            .attr("id", `cp-${axisType}`)
                        .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                    const axisSvg = d3_create("svg")
                        .attr("width", width)
                        .attr("height", height);

                    this.$slots[axisType][0].componentInstance.drawAxis(axisSvg, true);
                    this.$slots[axisType][0].componentInstance.drawAxis();

                    const axisG = svg
                        .append("g")
                            .attr("class", `download-g-${axisType}`)
                            .attr("width", width)
                            .attr("height", height)
                            .attr("transform", `translate(${x},${y})`)
                            .attr("clip-path", `url(#cp-${axisType})`);
                    
                    axisG.html(axisSvg.node().innerHTML);
                }
            };

            const renderPlotToContext = () => {
                if(this.$slots.plot.length > 0) {
                    try {
                        this.$slots.plot[0].componentInstance.pHeight = pHeight;
                    } catch(e) {
                        console.log(e);
                    }

                    const x = this.pMarginLeft;
                    const y = this.pMarginTop;
                    const width = this.pWidth;
                    const height = pHeight;

                    defs
                        .append("clipPath")
                            .attr("id", `cp-plot`)
                        .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                    const plotSvg = d3_create("svg")
                        .attr("width", width)
                        .attr("height", height);
                    
                    this.$slots.plot[0].componentInstance.drawPlot(plotSvg);
                    this.$slots.plot[0].componentInstance.drawPlot();

                    const plotG = svg
                        .append("g")
                            .attr("class", `download-g-plot`)
                            .attr("width", width)
                            .attr("height", height)
                            .attr("transform", `translate(${x},${y})`)
                            .attr("clip-path", `url(#cp-plot)`);
                    plotG.html(plotSvg.node().innerHTML);
                }
            };
            
            renderAxisToContext("axisTop");
            renderAxisToContext("axisLeft");
            renderPlotToContext();
            renderAxisToContext("axisRight");
            renderAxisToContext("axisBottom");

            const svgContent = svgToUri(svg.node());

            const blob = new Blob([svgContent], {'type': 'image/svg+xml'});

            return blob;
        }
    }
}
</script>

<style>
.vdp-plot-container {
    position: relative;
    
}
.vdp-plot-container .vdp-plot-container-dl-btn {
    position: absolute;
    cursor: pointer;
}

.vdp-plot-container .vdp-plot-container-rs-btn {
    position: absolute;
    cursor: ns-resize;
}
</style>