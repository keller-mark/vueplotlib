<template>
    <div>
        <button></button>
    </div>
</template>

<script>

import AbstractScale from './../scales/AbstractScale.js';

let uuid = 0;
export default {
    name: 'SortOptions',
    props: {
        'variable': {
            type: String
        },
        'by': {
            type: Object 
        },
        'getScale': {
            type: Function
        },
        'getData': {
            type: Function
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
    mounted() {
        
    },
    methods: {
        
    }
}
</script>

<style>


</style>