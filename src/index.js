import PlotContainer from './components/PlotContainer.vue'
import Axis from './components/Axis.vue'
import StackedBarPlot from './components/StackedBarPlot.vue'
import BarPlot from './components/BarPlot.vue'


if (typeof window !== 'undefined' && window.Vue) {
    Vue.component(PlotContainer.name, PlotContainer);
    Vue.component(Axis.name, Axis);
    Vue.component(StackedBarPlot.name, StackedBarPlot);
    Vue.component(BarPlot.name, BarPlot)
}

export { PlotContainer, Axis, StackedBarPlot, BarPlot }