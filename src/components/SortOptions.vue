<template>
    <div>
        Sort <em>{{ getScale(variable).name }}</em> by <em>{{ getData(by.data).name }}</em> data
        <div v-if="is1D">

        </div>

        <span v-if="is2D">
            on
            <select v-model="firstVar2D">
                <option disabled value="">Please select one</option>
                <option v-for="sortVarKey in Object.keys(by.on.variables)" :key="sortVarKey" :value="sortVarKey">
                    {{ getScale(sortVarKey).name }}
                </option>
            </select>

            <span v-if="validSelection(firstVar2D)">
                of
                <select v-model="secondVar2D">
                    <option disabled value="">Please select one</option>
                    <option v-for="sortVarKey in by.on.variables[firstVar2D].variables" :key="sortVarKey" :value="sortVarKey">
                        {{ getScale(sortVarKey).name }}
                    </option>
                </select>
                <span v-if="validSelection(secondVar2D)">
                    <select v-model="thirdVar2D">
                        <option disabled value="">Please select one</option>
                        <option v-for="sortVarValue in getScale(secondVar2D).domain" :key="sortVarValue" :value="sortVarValue">
                            {{ getScale(secondVar2D).toHuman(sortVarValue) }}
                        </option>
                    </select>
                </span>
            </span>
        </span>

        <span v-if="(is1D && validSelection(secondVar1D)) || (is2D && validSelection(thirdVar2D))">
            <select v-model="sortAscending">
                <option :value="true">Ascending</option>
                <option :value="false">Descending</option>
            </select>
        </span>
        
    </div>
</template>

<script>

import AbstractScale from './../scales/AbstractScale.js';
import SortBy from './../sort/SortBy.js';

import SortVars1D from './../sort/SortVars1D.js';
import SortVars2D from './../sort/SortVars2D.js';

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
            firstVar1D: null,
            secondVar1D: null,

            firstVar2D: null,
            secondVar2D: null,
            thirdVar2D: null,

            sortAscending: true
        }
    },
    watch: {
        thirdVar2D: function() {
            this.go();
        },
        sortAscending: function() {
            this.go();
        }
    },
    computed: {
        is1D: function() {
            return (this.by.on instanceof SortVars1D);
        },
        is2D: function() {
            return (this.by.on instanceof SortVars2D);
        }
    },
    created() {
        console.assert(this.by instanceof SortBy);
        // TODO: Make assertions about scale types? depending on if 1D or 2D etc...?
    },
    mounted() {
        
    },
    methods: {
        validSelection(varValue) {
            return (varValue !== null && varValue !== undefined && varValue.length > 0);
        },
        valid1D() {
            return (
                this.validSelection(this.firstVar1D) && 
                this.validSelection(this.secondVar1D)
            );
        },
        valid2D() {
            return (
                this.validSelection(this.firstVar2D) && 
                this.validSelection(this.secondVar2D) && 
                this.validSelection(this.thirdVar2D)
            );
        },
        go() {
            if(this.is2D && this.valid2D()) {
                this.getScale(this.variable).sort(this.getData(this.by.data), this.firstVar2D, this.thirdVar2D, this.sortAscending);
            } else if(this.is1D && this.valid1D()) {
                // TODO: test this
                this.getScale(this.variable).sort(this.getData(this.by.data), this.firstVar1D, undefined, this.sortAscending);
            }
        }
    }
}
</script>

<style>


</style>