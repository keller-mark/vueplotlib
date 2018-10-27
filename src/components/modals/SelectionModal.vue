<template>
   <div>
        <Modal :title="this.title" @close="$emit('close')">
            <div slot="body">
                <slot name="body">
                    default selection modal body
                </slot>
                <button class="select-button" @click="this.onSelect">Select</button>
            </div>
            
        </Modal>
    </div>
</template>

<script>
import Modal from './Modal.vue';

export default {
    name: 'SelectionModal',
    components: {
        Modal
    },
    props: {
        onSelect: {
            type: Function
        },
        title: {
            type: String
        }
    },
    data() {
        return {
            
        }
    },
    watch: {
        
    },
    created() {
        
    },
    methods: {
        
    }
}
</script>

<style scoped lang="scss">

.select-button {
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
}

</style>