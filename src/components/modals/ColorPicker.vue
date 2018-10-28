<template>
    <div>
        <Modal title="Select a color" @close="$emit('close')">
            <div slot="body">
                <div :id="this.pickerElemID"></div>
                <button @click="selectColor">Select</button>
            </div>
        </Modal>
    </div>
</template>

<script>
import Modal from './Modal.vue';

import colorjoe from 'colorjoe';

let uuid = 0;
export default {
    name: 'ColorPicker',
    components: {
        Modal
    },
    props: {
        initialColor: {
            type: String,
            default: "#000000"
        },
        onSelect: {
            type: Function
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    mounted() {
        this.drawPicker();
    },
    beforeDestroy() {
        this.removePicker(); 
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
        selectColor() {
            const color = this.joe.get().css();
            this.onSelect(color);
            this.$emit('close');
        },
        removePicker() {
            const vm = this;
            if(vm.joe !== undefined) {
                vm.joe.removeAllListeners();
            }
        },
        drawPicker() {
            const vm = this;
            vm.joe = colorjoe.rgb(vm.pickerElemID, vm.initialColor);
        }
    }
}
</script>

<style>

@import '~colorjoe/css/colorjoe.css';
.colorPicker {
    background: #FFFFFF;
    border: 0px solid #BBB;
}
</style>