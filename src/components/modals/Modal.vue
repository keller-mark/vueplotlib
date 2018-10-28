<template>
   <div>
        <div class="modal">
            <div class="modal-inner">
                <span class="modal-close" v-on:click="$emit('close')">Close</span>
                <h3>{{ this.title }}</h3>
                <slot name="body">
                    default modal body
                </slot>
            </div>
        </div>
        <div class="modal-background" v-on:click="$emit('close')"></div>
    </div>
</template>

<script>

export default {
    name: 'Modal',
    props: {
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

.modal-background {
    z-index: 1;
    top: 0;
    left: 0;
    position: fixed;
    width: 100%;
    height: 100vh;
    background-color: black;
    opacity: 0.4;
}
.modal {
    z-index: 5;
    top: 10vh;
    left: 10%;
    height: 80vh;
    width: 80%;
    position: fixed;
    background-color: white;
    
    .modal-inner {
        box-sizing: border-box;
        height: 100%;
        overflow-y: scroll;
        .modal-close {
            position: absolute;
            right: 1.5rem;
            top: 1rem;
            cursor: pointer;
            user-select: none;
        }
        h3 {
            margin-left: 1.5rem;
        }
    }
}

</style>