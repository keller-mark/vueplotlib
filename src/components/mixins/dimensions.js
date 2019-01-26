export default {
    props: {
        'width': {
            type: Number,
            default: 0
        },
        'height': {
            type: Number,
            default: 0
        },
        'marginTop': {
            type: Number,
            default: 0
        },
        'marginLeft': {
            type: Number,
            default: 0
        },
        'marginRight': {
            type: Number,
            default: 0
        },
        'marginBottom': {
            type: Number,
            default: 0
        }
    },
    watch: {
        width() {
            this.draw();
        },
        height() {
            this.draw();
        },
        marginTop() {
            this.draw();
        },
        marginLeft() {
            this.draw();
        },
        marginRight() {
            this.draw();
        },
        marginBottom() {
            this.draw();
        }
    }
}