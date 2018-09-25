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
        }
    },
    data: function() {
        return {
            tooltipPosition: {
                left: null,
                top: null
            }
        };
    },
    computed: {
        plotElemID: function() {
            return 'plot_' + this.uuid;
        },
        hiddenPlotElemID: function() {
            return 'plot_h_' + this.uuid;
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
        }
    }
}