import PlotContainer from './components/PlotContainer.vue';
import Axis from './components/Axis.vue';
// Plots
import StackedBarPlot from './components/plots/StackedBarPlot.vue';
import BarPlot from './components/plots/BarPlot.vue';
import ScatterPlot from './components/plots/ScatterPlot.vue';


/* eslint-disable no-undef */
if (typeof window !== 'undefined' && window.Vue) {
    Vue.component(PlotContainer.name, PlotContainer);
    Vue.component(Axis.name, Axis);
    Vue.component(StackedBarPlot.name, StackedBarPlot);
    Vue.component(BarPlot.name, BarPlot);
    Vue.component(ScatterPlot.name, ScatterPlot);
}

export { PlotContainer, Axis, StackedBarPlot, BarPlot, ScatterPlot }