<template>
    <div>
        Sort <em>{{ getScale(variable).name }}</em> by <em>{{ getData(by.data).name }}</em> data
        <span>
            on
            <select v-model="firstVar">
                <option disabled value="">Please select one</option>
                <option v-for="(sortVarKey, index) in by.on.variables" :key="sortVarKey" :value="index">
                    {{ getScale(sortVarKey).name }}
                </option>
            </select>

            <span v-if="validSelection(firstVar)">
                <select v-model="secondVar">
                    <option disabled value="">Please select one</option>
                    <option v-for="sortVarValue in getScale(by.on.variables[firstVar]).domain" :key="sortVarValue" :value="sortVarValue">
                        {{ getScale(by.on.variables[firstVar]).toHuman(sortVarValue) }}
                    </option>
                </select>
            </span>
        </span>

        <span v-if="validSelection(firstVar) && validSelection(secondVar)">
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

import SortVars from './../sort/SortVars.js';

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
            firstVar: null,
            secondVar: null,
            sortAscending: true
        }
    },
    watch: {
        secondVar: function() {
            this.go();
        },
        sortAscending: function() {
            this.go();
        }
    },
    created() {
        console.assert(this.by instanceof SortBy);
        // TODO: Make assertions about scale types?
    },
    methods: {
        validSelection(varValue) {
            return (varValue !== null);
        },
        go() {
            console.log(this.firstVar, this.secondVar);
            if(this.validSelection(this.firstVar) && this.validSelection(this.secondVar)) {
                this.getScale(this.variable).sort(this.getData(this.by.data), this.secondVar, undefined, this.sortAscending);
            }
        }
    }
}
</script>

<style>


</style>