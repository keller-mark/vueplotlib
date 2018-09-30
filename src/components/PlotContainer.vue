<script>
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
 * This component is a container for axis and plot components, 
 * which passes its props to its children and imposes styles.
 * @prop {number} pWidth The plot width.
 * @prop {number} pHeight The plot height.
 * @prop {number} pMarginTop The plot top margin.
 * @prop {number} pMarginLeft The plot left margin.
 * @prop {number} pMarginRight The plot right margin.
 * @prop {number} pMarginBottom The plot bottom margin.
 * 
 * @example
 * <PlotContainer
 *    :pWidth="500"
 *    :pHeight="300"
 *    :pMarginTop="10"
 *    :pMarginLeft="120"
 *    :pMarginRight="10"
 *    :pMarginBottom="150"
 *  >
 *    <Axis
 *      slot="axisLeft" <!-- note the slot prop -->
 *      variable="exposure"
 *      side="left" 
 *      :tickRotation="-35"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *      <!-- note the axis props that are omitted because they are being inherited -->
 *    />
 *    <BarPlot
 *      slot="plot" <!-- note the slot prop -->
 *      data="exposures_single_data"
 *      x="signature" 
 *      y="exposure"
 *      :getData="getData"
 *      :getScale="getScale"
 *      <!-- note the plot props that are omitted because they are being inherited -->
 *    />
 *    <Axis
 *      slot="axisBottom" <!-- note the slot prop -->
 *      variable="signature"
 *      side="bottom" 
 *      :tickRotation="-65"
 *      :getScale="getScale"
 *      :getStack="getStack"
 *      :disableBrushing="true"
 *      <!-- note the axis props that are omitted because they are being inherited -->
 *    />
 *  </PlotContainer>
 */
export default {
    name: 'PlotContainer',
    props: {
        'pWidth': {
            type: Number
        },
        'pHeight': {
            type: Number
        },
        'pMarginTop': {
            type: Number
        },
        'pMarginLeft': {
            type: Number
        },
        'pMarginRight': {
            type: Number
        },
        'pMarginBottom': {
            type: Number
        }
    },
    render(h) {
        this.$slots.axisTop = addProp(this.$slots.axisTop, this.$props);
        this.$slots.axisLeft = addProp(this.$slots.axisLeft, this.$props);
        this.$slots.plot = addProp(this.$slots.plot, this.$props);
        this.$slots.axisRight = addProp(this.$slots.axisRight, this.$props);
        this.$slots.axisBottom = addProp(this.$slots.axisBottom, this.$props);
        
        let children = ([]).concat(
            this.$slots.axisTop, 
            this.$slots.axisLeft,
            this.$slots.plot,
            this.$slots.axisRight,
            this.$slots.axisBottom
        );
        let classes = ['vdp-plot-container'];
        let styles = {
            width: (this.pMarginLeft + this.pWidth + this.pMarginRight) + 'px',
            height: (this.pMarginTop + this.pHeight + this.pMarginBottom) + 'px'
        };
        return h('div', { class: classes, style: styles }, children);
    }
}
</script>

<style>
.vdp-plot-container {
    position: relative;
}
</style>