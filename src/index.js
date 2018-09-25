import StackedBarPlotSVG from './components/StackedBarPlotSVG.vue'
import StackedBarPlotCanvas from './components/StackedBarPlotCanvas.vue'


if (typeof window !== 'undefined' && window.Vue) {
    Vue.component(StackedBarPlotSVG.name, StackedBarPlotSVG);
    Vue.component(StackedBarPlotCanvas.name, StackedBarPlotCanvas)
}

export { StackedBarPlotSVG, StackedBarPlotCanvas }