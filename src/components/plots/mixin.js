/**
 * @mixin
 * @prop {string} data The data set key.
 * @prop {number} pWidth The plot width.
 * @prop {number} pHeight The plot height.
 * @prop {number} pMarginTop The plot top margin.
 * @prop {number} pMarginLeft The plot left margin.
 * @prop {number} pMarginRight The plot right margin.
 * @prop {number} pMarginBottom The plot bottom margin.
 * @prop {function} getData Function that takes a data key string and returns a DataContainer.
 * @prop {function} getScale Function that takes a scale key string and returns a scale instance.
 * @prop {function} clickHandler Function that will be called upon click of plot.
 */
export default {
    props: {
        'data': {
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
        'clickHandler': {
            type: Function
        }
    },
    data: function() {
        return {
            tooltipPosition: {
                left: null,
                top: null
            },
            showHighlight: false
        };
    },
    computed: {
        plotElemID: function() {
            return 'plot_' + this.uuid;
        },
        hiddenPlotElemID: function() {
            return 'plot_h_' + this.uuid;
        },
        highlightElemID: function() {
            return 'highlight_' + this.uuid;
        },
        tooltipElemID: function() {
            return 'tooltip_' + this.uuid;
        },
        plotSelector: function() {
            return "#" + this.plotElemID;
        },
        hiddenPlotSelector: function() {
            return "#" + this.hiddenPlotElemID;
        },
        highlightSelector: function() {
            return "#" + this.highlightElemID;
        },
        tooltipSelector: function() {
            return "#" + this.tooltipElemID;
        },
        tooltipPositionAttribute: function() {
            if(this.tooltipPosition.left == null || this.tooltipPosition.top == null) {
                return 'display: none;';
            } else {
                return 'left: ' + this.tooltipPosition.left + 'px; top: ' + this.tooltipPosition.top + 'px;';
            }
        }
    },
    watch: {
        width: function () {
            this.drawPlot();
        },
        height: function () {
            this.drawPlot();
        }
    },
    methods: {
        tooltipHide: function() {
            this.tooltipPosition.left = null;
            this.tooltipPosition.top = null;
        },
        tooltipDestroy: function() {
            // stub
        },
        removePlot: function() {
            // stub
        },
        drawPlot: function() {
            // stub
        },
        downloadPlot: function() {
            return document.getElementById(this.plotElemID).toDataURL("image/png");
        }
    }
}