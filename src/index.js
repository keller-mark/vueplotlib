import PlotContainer from './components/PlotContainer.vue';
import Axis from './components/Axis.vue';
import GenomeAxis from './components/GenomeAxis.vue';
import DendrogramAxis from './components/DendrogramAxis.vue';

// Plots
import StackedBarPlot from './components/plots/StackedBarPlot.vue';
import BarPlot from './components/plots/BarPlot.vue';
import ScatterPlot from './components/plots/ScatterPlot.vue';
import BoxPlot from './components/plots/BoxPlot.vue';
import MultiBoxPlot from './components/plots/MultiBoxPlot.vue';
import TrackPlot from './components/plots/TrackPlot.vue';
import MultiTrackPlot from './components/plots/MultiTrackPlot.vue';
import DendrogramPlot from './components/plots/DendrogramPlot.vue';
import HierarchicalMultiTrackPlot from './components/plots/HierarchicalMultiTrackPlot.vue';

// Genome Plots
import GenomeScatterPlot from './components/plots/GenomeScatterPlot.vue';



/* eslint-disable no-undef */
if (typeof window !== 'undefined' && window.Vue) {
    Vue.component(PlotContainer.name, PlotContainer);
    Vue.component(Axis.name, Axis);
    Vue.component(GenomeAxis.name, GenomeAxis);
    Vue.component(DendrogramAxis.name, DendrogramAxis);
    // Plots
    Vue.component(StackedBarPlot.name, StackedBarPlot);
    Vue.component(BarPlot.name, BarPlot);
    Vue.component(ScatterPlot.name, ScatterPlot);
    Vue.component(BoxPlot.name, BoxPlot);
    Vue.component(MultiBoxPlot.name, MultiBoxPlot);
    Vue.component(TrackPlot.name, TrackPlot);
    Vue.component(MultiTrackPlot.name, MultiTrackPlot);
    Vue.component(HierarchicalMultiTrackPlot.name, HierarchicalMultiTrackPlot);
    Vue.component(DendrogramPlot.name, DendrogramPlot);
    // Genome Plots
    Vue.component(GenomeScatterPlot.name, GenomeScatterPlot);
}

export {
    PlotContainer,
    Axis,
    GenomeAxis,
    DendrogramAxis,
    StackedBarPlot,
    BarPlot,
    ScatterPlot,
    BoxPlot,
    MultiBoxPlot,
    TrackPlot,
    MultiTrackPlot,
    HierarchicalMultiTrackPlot,
    DendrogramPlot,
    GenomeScatterPlot
}