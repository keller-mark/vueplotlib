<template>
    <div>
        <CategoricalLegend v-if="legendType === 'categorical'"
            :variable="variable"
            :lStyle="lStyle"
            :lWidth="lWidth"
            :lItemHeight="lItemHeight"
            :getScale="getScale"
            :getStack="getStack"
            :clickHandler="clickHandler"
         />
        <ContinuousLegend v-if="legendType === 'continuous'" 
            :variable="variable"
            :lWidth="lWidth"
            :lItemHeight="lItemHeight"
            :getScale="getScale"
            :getStack="getStack"
        />
    </div>
</template>

<script>

import ContinuousLegend from './ContinuousLegend.vue';
import CategoricalLegend from './CategoricalLegend.vue';

import ContinuousScale from '../../scales/ContinuousScale';
import CategoricalScale from '../../scales/CategoricalScale';


let uuid = 0;
/**
 * @prop {string} variable The legend variable key.
 * Accepts any props that CategoricalLegend or ContinuousLegend accept and passes them on.
 * 
 * @example
 * <Legend
 *      variable="y"
 *      :lWidth="500"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *  />
 */
export default {
    name: 'Legend',
    components: {
        ContinuousLegend,
        CategoricalLegend
    },
    props: {
        'variable': {
            type: String
        },
        'lStyle': {
            type: String
        },
        'lWidth': {
            type: Number
        },
        'lItemHeight': {
            type: Number,
            default: 20
        },
        'getScale': {
            type: Function
        },
        'getStack': {
            type: Function
        },
        'clickHandler': {
            type: Function
        }
    },
    data() {
        return {
            legendType: null
        }
    },
    beforeCreate() {
        this.uuid = this.$options.name + uuid.toString();
        uuid += 1;
    },
    created() {
        // Set the scale variable
        const varScale = this.getScale(this.variable);
        if(varScale instanceof ContinuousScale) {
            this.legendType = 'continuous';
        } else if(varScale instanceof CategoricalScale) {
            this.legendType = 'categorical';
        }
    }
}
</script>

<style>
</style>