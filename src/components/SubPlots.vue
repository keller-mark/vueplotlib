<script>
import dimensionsMixin from './mixins/dimensions.js';
import gettersMixin from './mixins/getters.js';
import * as PIXI from 'pixi.js';

/**
 * Function that takes in array of VNodes and adds props from a provided props object.
 * @private
 * @param {array} slotArray Array of named slot VNodes.
 * @param {object} newProps Object mapping prop keys to values.
 * @return {array} The updated array of VNode with the added props.
 */
const addProp = function(slotArray, newProps) {
    if (slotArray) {
        slotArray = slotArray.map((vnode) => {
            if (vnode.componentOptions && vnode.componentOptions.propsData) {
                const newNode = vnode;
                for(let propName of Object.keys(newProps)) {
                    newNode.componentOptions.propsData[propName] = newProps[propName];
                }
                return newNode;
            }
            return vnode;
        });
        return slotArray
    }
    return [];
}
/**
 * This component enables single-canvas multi-faceted plots.
 * @prop {number} ncols The number of plot columns. Default: 1
 * @prop {number} nrows The number of plot rows. Default: 1
 * @prop {number} width The total width.
 * @prop {number} height The total height.
 * @prop {number} marginTop The top margin.
 * @prop {number} marginLeft The left margin.
 * @prop {number} marginRight The right margin.
 * @prop {number} marginBottom The bottom margin.
 * @prop {number} colMargin The margin between columns.
 * @prop {number} rowMargin The margin between rows.
 * 
 * @example
 * <SubPlots
 *    :ncols="2"
 *    :nrows="1"
 *    :width="200"
 *    :height="300"
 *    :marginTop="10"
 *    :marginLeft="10"
 *    :marginRight="10"
 *    :marginBottom="10"
 *    :getData="getData"
 *    :getScale="getScale"
 *    :getStack="getStack"
 *  >
 *    <BarPlot
 *      slot="1"
 *      plotDataKey="exposures_single_data"
 *      x="signature" 
 *      y="exposure"
 *    >
 *      <Axis
 *          slot="left"
 *          :width="80"
 *          y="exposure"
 *          :tickRotation="-35"
 *      />
 *      <Axis
 *          slot="bottom"
 *          :height="80"
 *          variable="signature"
 *          :tickRotation="-65"
 *      />
 *    </BarPlot>
 *    <BarPlot
 *      slot="2"
 *      plotDataKey="exposures_single_data"
 *      x="signature" 
 *      y="exposure"
 *    >
 *      <Axis
 *          slot="bottom"
 *          :height="80"
 *          variable="signature"
 *          :tickRotation="-65"
 *      />
 *    </BarPlot>
 *  </SubPlots>
 */
export default {
    name: 'SubPlots',
    props: {
        'nrows': {
            type: Number,
            default: 1
        },
        'ncols': {
            type: Number,
            default: 1
        },
        'colMargin': {
            type: Number,
            default: 0
        },
        'rowMargin': {
            type: Number,
            default: 0
        }
    },
    mixins: [
        dimensionsMixin, 
        gettersMixin
    ],
    created() {
        this.pixi = new PIXI.Application({
            width: this.width, 
            height: this.height,
            antialias: true,
            transparent: true
        });
    },
    mounted() {
        this.$el.appendChild(this.pixi.view);
    },
    render(h) {
        console.log(this.$props);
        this.$slots["1"] = addProp(this.$slots["1"], {
            canvas: this.pixi, 
            getData: this.getData, 
            getScale: this.getScale, 
            getStack: this.getStack, 
            width: this.width, 
            height: this.height
        });
        
        let children = ([]).concat(
            this.$slots["1"]
        );
        let classes = ['vpl-subplots'];
        let styles = {
            width: this.width + 'px',
            height: this.height + 'px'
        };
        return h('div', { class: classes, style: styles }, children);
    }
}
</script>

<style>

</style>