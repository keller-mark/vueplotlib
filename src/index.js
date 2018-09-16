import StackedBarPlot from './components/StackedBarPlot.vue'


if (typeof window !== 'undefined' && window.Vue) {
    Vue.component(StackedBarPlot.name, StackedBarPlot)
}

export { StackedBarPlot }