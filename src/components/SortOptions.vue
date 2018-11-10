<template>
    <div>
        Sort <em>{{ getScale(variable).name }}</em> by <em>{{ getData(data).name }}</em> data
        <span>
            on
            <select v-model="selectedKey" v-if="hasOptionScale">
                <option disabled value="">Please select one</option>
                <option v-for="sortVarKey in sortVarKeys" :key="sortVarKey" :value="sortVarKey">
                    {{ _optionScale.toHuman(sortVarKey) }}
                </option>
            </select>
            <span v-if="!hasOptionScale">
                <em>{{ optionName }}</em>
            </span>
            &nbsp;
        </span>
        <span>
            <select v-model="sortAscending">
                <option :value="true">Ascending</option>
                <option :value="false">Descending</option>
            </select>
            &nbsp;
        </span>
        <button @click="go" :disabled="!validSelection(selectedKey)">Go</button>
    </div>
</template>

<script>
import HistoryEvent from '../history/HistoryEvent.js';
import { computedParam } from '../history/HistoryStack.js';
import { EVENT_TYPES, EVENT_SUBTYPES } from '../history/base-events.js';
/**
 * This component helps make simple sorting controls. 
 * To sort by an individual variable use optionName and optionVariable props. 
 * To give provide sort-by options in terms of a scale's domain use optionScale prop instead.
 * @prop {string} variable The key of the scale to be sorted.
 * @prop {string} data The key of the data that will be used to do the sorting.
 * @prop {string} optionScale A categorical scale of variables to sort by. Ignored if using optionVar and optionName props instead.
 * @prop {string} optionVariable A variable to sort by. Ignored if using optionScale instead.
 * @prop {string} optionName The human-readable name of the variable to sort by. Ignored if using optionScale instead.
 * @prop {function} getScale The scale getter function.
 * @prop {function} getStack The stack getter function.
 * @prop {function} getData The data getter function.
 * 
 * @example
 * <SortOptions 
 *    variable="sample_id" 
 *    data="exposure_sbs" 
 *    optionScale="sig_sbs"
 *    :getScale="getScale" 
 *    :getData="getData"
 *    :getStack="getStack"
 * />
 * <SortOptions 
 *    variable="sample_id" 
 *    data="exposure_sbs"
 *    optionVariable="age"
 *    optionName="Age"
 *    :getScale="getScale" 
 *    :getData="getData"
 *    :getStack="getStack"
 * />
 */
let uuid = 0;
export default {
    name: 'SortOptions',
    props: {
        'variable': {
            type: String
        },
        'data': {
            type: String 
        },
        'optionScale': {
            type: String 
        },
        'optionVariable': {
            type: String 
        },
        'optionName': {
            type: String 
        },
        'getScale': {
            type: Function
        },
        'getData': {
            type: Function
        },
        'getStack': {
            type: Function
        }
    },
    data() {
        return {
            hasOptionScale: false,
            selectedKey: null,
            sortAscending: true,
            sortVarKeys: []
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        if(this.optionScale !== undefined && this.optionScale !== null) {
            this.hasOptionScale = true;
            this._optionScale = this.getScale(this.optionScale);
            this.sortVarKeys = this._optionScale.domain;
            this._optionScale.onUpdate(this.uuid, () => {
                this.sortVarKeys = this._optionScale.domain;
            })
        } else {
            this.selectedKey = this.optionVariable;
        }

        this._stack = this.getStack();

    },
    methods: {
        validSelection(varValue) {
            return (varValue !== null);
        },
        go() {
            if(this.validSelection(this.selectedKey)) {
                this.getScale(this.variable).sort(this.getData(this.data), this.selectedKey, this.sortAscending);
                this._stack.push(new HistoryEvent(
                    EVENT_TYPES.SCALE, 
                    EVENT_SUBTYPES.SCALE_DOMAIN_SORT, 
                    this.variable, 
                    "sort", 
                    [
                        computedParam(EVENT_TYPES.DATA, [this.data]),
                        this.selectedKey,
                        this.sortAscending
                    ]
                ));
            }
        }
    }
}
</script>

<style>


</style>