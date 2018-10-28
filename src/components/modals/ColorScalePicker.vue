<template>
    <div>
        <Modal title="Select a color scale" @close="$emit('close')">
            <div slot="body">
                <div :id="this.pickerElemID"></div>
            </div>
        </Modal>
    </div>
</template>

<script>
import Modal from './Modal.vue';

import { scaleBand as d3_scaleBand } from 'd3-scale';

import { select as d3_select } from 'd3-selection';
import debounce from 'lodash/debounce';

import AbstractScale from './../../scales/AbstractScale.js';

let uuid = 0;
export default {
    name: 'ColorScalePicker',
    components: {
        Modal
    },
    props: {
        onSelect: {
            type: Function
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    beforeDestroy() {
        this.removePicker();
    },
    mounted() {
        const vm = this;
        vm.drawPicker();

        window.addEventListener('resize', debounce(vm.drawPicker, 250));
        // TODO: remove event listener upon destroy
    },
    computed: {
        pickerElemID: function() {
            return 'picker_' + this.uuid;
        },
        pickerSelector: function() {
            return "#" + this.pickerElemID;
        }
    },
    methods: {
        selectScale(scaleKey) {
            this.onSelect(scaleKey);
            this.$emit('close');
        },
        removePicker() {
            d3_select(this.pickerSelector).select("svg").remove();
        },
        drawPicker() {
            const vm = this;
            vm.removePicker();
            
            const rectHeight = 30;
            const rectMarginY = 50;
            const rectMarginX = 80;

            const scales = AbstractScale.colorScales;
            const scaleKeys = Object.keys(scales);

            const numScales = scaleKeys.length;

            const pickerHeight = (rectHeight+rectMarginY) * numScales;

            /*
             * Create the SVG elements
             */
            const div = d3_select(vm.pickerSelector);
            const divNode = div.node();
            if(divNode === null || divNode === undefined) {
                return;
            }
            const divWidth = divNode.offsetWidth;
            const container = d3_select(vm.pickerSelector)
                .append("svg")
                    .attr("width", divWidth)
                    .attr("height", pickerHeight);
            
            const defs = container.append("defs");

            const nStops = 10;
            
            for(let scaleKey of scaleKeys) {
                const gradient = defs.append("linearGradient")
                    .attr("id", vm.pickerElemID + '_' + scaleKey);
                
                for(let i = 0; i <= nStops; i++) {
                    let stopColor = scales[scaleKey](i/nStops);
                    gradient.append("stop")
                        .attr("offset", ((100 / nStops) * i) + "%")
                        .attr("stop-color", stopColor);
                }
            }
            
            const picker = container.append("g")
                    .attr("class", "picker");

            const y = d3_scaleBand()
                .domain(scaleKeys)
                .range([pickerHeight, 0]);
            
            const items = picker.selectAll(".csp-item")
                .data(scaleKeys)
                .enter()
                .append("g")
                    .attr("class", "csp-item")
                    .attr("transform", (d) => "translate(0," + y(d) + ")");
                
            
            items.append("rect")
                .attr("x", rectMarginX/2)
                .attr("y", rectMarginY/2)
                .attr("width", divWidth - rectMarginX)
                .attr("height", rectHeight)
                .attr("fill", (d) => ("url(" + vm.pickerSelector + '_' + d + ")"))
                .style("cursor", "pointer")
                .on("click", (d) => {
                    this.selectScale(d);
                });

        }
    }
}
</script>

<style scoped lang="scss">


</style>