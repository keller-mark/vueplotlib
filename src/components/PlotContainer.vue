<script>
import { getRetinaRatio } from './../helpers.js';
import { DOWNLOAD_PATH } from './../icons.js';
import { create as d3_create } from 'd3';


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
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
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
        }
    },
    data() {
        return {
            initialKey: 1,
        };
    },
    render(h) {
        this.$slots.axisTop = addProp(this.$slots.axisTop, this.$props);
        this.$slots.axisLeft = addProp(this.$slots.axisLeft, this.$props);
        this.$slots.plot = addProp(this.$slots.plot, this.$props);
        this.$slots.axisRight = addProp(this.$slots.axisRight, this.$props);
        this.$slots.axisBottom = addProp(this.$slots.axisBottom, this.$props);

        const downloadChildren = [];
        if(this.showDownloadButton) {
            downloadChildren.push(h('svg', { class: 'vdp-plot-container-dl-btn', attrs: {'width': this.downloadButtonSize, 'height': this.downloadButtonSize, 'viewBox': '0 0 24 24'}, style: {'top': (this.downloadButtonOffsetY + 'px'), 'left': (this.downloadButtonOffsetX + 'px')}, on: { click: ()=>{this.downloadViaButton();} } }, [h('path', {attrs: {'d': DOWNLOAD_PATH, 'fill': this.downloadButtonFill }})]));
        }
        
        const children = ([]).concat(
            this.$slots.axisTop, 
            this.$slots.axisLeft,
            this.$slots.plot,
            this.$slots.axisRight,
            this.$slots.axisBottom,
            h('div', { key: this.initialKey }, downloadChildren)
        );  

        let classes = ['vdp-plot-container'];
        let styles = {
            width: this.fullWidth + 'px',
            height: this.fullHeight + 'px'
        };
        return h('div', { class: classes, style: styles }, children);
    },
    computed: {
        fullWidth() {
            return this.pMarginLeft + this.pWidth + this.pMarginRight;
        },
        fullHeight() {
            return this.pMarginTop + this.pHeight + this.pMarginBottom;
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
            const uri = this.download()
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", uri);
            downloadAnchorNode.setAttribute("download", this.downloadName + ".svg");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },
        download() {
            const svg = d3_create("svg")
                .attr("width", this.fullWidth)
                .attr("height", this.fullHeight);
            
            const defs = svg
                .append("defs");
            
            const renderAxisToContext = (axisType) => {
                if(this.$slots[axisType].length > 0) {
                    const x = this.$slots[axisType][0].componentInstance.computedLeft;
                    const y = this.$slots[axisType][0].componentInstance.computedTop;
                    const width = this.$slots[axisType][0].componentInstance.computedWidth;
                    const height = this.$slots[axisType][0].componentInstance.computedHeight;

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
                    const x = this.pMarginLeft;
                    const y = this.pMarginTop;
                    const width = this.pWidth;
                    const height = this.pHeight;

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

            return svgToUri(svg.node());
        }
    }
}
</script>

<style>
.vdp-plot-container {
    position: relative;
    
}
.vdp-plot-container .vdp-plot-container-dl-btn {
    position: relative;
    cursor: pointer;
}
</style>