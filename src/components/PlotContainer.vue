<script>
import { getRetinaRatio } from './../helpers.js';
import { DOWNLOAD_PATH } from './../icons.js';


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
 * Given a canvas context, x and y offsets, and an image URI, render the image to the context.
 * @private
 * @param {Context} ctx The canvas context.
 * @param {string} uri The image data URI.
 * @param {int} x The x offset.
 * @param {int} y The y offset.
 */
const renderToContext = function(ctx, uri, x, y, width, height) {
    return new Promise((resolve, reject) => {
        var img = new Image;
        img.onload = () => {
            ctx.drawImage(img, x, y, width, height);
            resolve();
        };
        img.src = uri;
    });
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
        renderToContext(ctx, x, y, uri) {
            var img = new Image;
            img.onload = () => {
                ctx.drawImage(img, x, y); // Or at whatever offset you like
            };
            img.src = uri;
        },
        downloadViaButton() {
            this.downloadWithoutAxisBrushing()
            .then((uri) => {
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", uri);
                downloadAnchorNode.setAttribute("download", this.downloadName + ".png");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            });
        },
        downloadWithoutAxisBrushing() {
            let axisTopDisableBrushing = this.$slots.axisTop.forEach((vnode) => { vnode.componentInstance.preDownload(); });
            let axisLeftDisableBrushing = this.$slots.axisLeft.forEach((vnode) => { vnode.componentInstance.preDownload(); });
            let axisRightDisableBrushing = this.$slots.axisRight.forEach((vnode) => { vnode.componentInstance.preDownload(); });
            let axisBottomDisableBrushing = this.$slots.axisBottom.forEach((vnode) => { vnode.componentInstance.preDownload(); });

            return new Promise((resolve, reject) => {
                Promise.all([axisTopDisableBrushing, axisLeftDisableBrushing, axisRightDisableBrushing, axisBottomDisableBrushing]).then(() => {
                    this.download().then((uri) => {
                        resolve(uri);
                        this.$slots.axisTop.forEach((vnode) => { vnode.componentInstance.postDownload(); });
                        this.$slots.axisLeft.forEach((vnode) => { vnode.componentInstance.postDownload(); });
                        this.$slots.axisRight.forEach((vnode) => { vnode.componentInstance.postDownload(); });
                        this.$slots.axisBottom.forEach((vnode) => { vnode.componentInstance.postDownload(); });
                    });
                });
            });
        },
        download() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const ratio = getRetinaRatio(ctx);
            const scaledWidth = this.fullWidth * ratio;
            const scaledHeight = this.fullHeight * ratio;

            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            ctx.scale(ratio, ratio);

            const renderAxisToContext = (axisType) => {
                if(this.$slots[axisType].length > 0) {
                    return this.$slots[axisType][0].componentInstance.downloadAxis()
                        .then((uri) => {
                            const x = this.$slots[axisType][0].componentInstance.computedLeft;
                            const y = this.$slots[axisType][0].componentInstance.computedTop;
                            const width = this.$slots[axisType][0].componentInstance.computedWidth;
                            const height = this.$slots[axisType][0].componentInstance.computedHeight;
                            return renderToContext(ctx, uri, x, y, width, height);
                        });
                }
                return Promise.resolve();
            };

            const renderPlotToContext = () => {
                if(this.$slots.plot.length > 0) {
                    return this.$slots.plot[0].componentInstance.downloadPlot()
                        .then((uri) => {
                            const x = this.pMarginLeft;
                            const y = this.pMarginTop;
                            const width = this.pWidth;
                            const height = this.pHeight;
                            return renderToContext(ctx, uri, x, y, width, height);
                        });
                }
                return Promise.resolve();
            };
            
            const renderPromises = [];
            renderPromises.push(renderAxisToContext("axisTop"));
            renderPromises.push(renderAxisToContext("axisLeft"));
            renderPromises.push(renderPlotToContext());
            renderPromises.push(renderAxisToContext("axisRight"));
            renderPromises.push(renderAxisToContext("axisBottom"));

            return new Promise((resolve, reject) => {
                Promise.all(renderPromises).then(() => {
                    const uri = canvas.toDataURL("image/png");
                    resolve(uri);
                });
            });
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