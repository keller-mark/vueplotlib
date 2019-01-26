
export default {
    data() {
        return {
            tooltipPosition: {
                left: null,
                top: null
            }
        };
    },
    computed: {
        tooltipPositionAttribute() {
            if(this.tooltipPosition.left == null || this.tooltipPosition.top == null) {
                return 'display: none;';
            } else {
                return 'left: ' + this.tooltipPosition.left + 'px; top: ' + this.tooltipPosition.top + 'px;';
            }
        }
    },
    methods: {
        tooltipHide() {
            this.tooltipPosition.left = null;
            this.tooltipPosition.top = null;
        }
    }
}