import PlotContainer from './components/PlotContainer.vue';

// Axes
import Axis from './components/axes/Axis.vue';
import GenomeAxis from './components/axes/GenomeAxis.vue';
import DendrogramAxis from './components/axes/DendrogramAxis.vue';

// Plots
import StackedBarPlot from './components/plots/StackedBarPlot.vue';
import BarPlot from './components/plots/BarPlot.vue';
import ScatterPlot from './components/plots/ScatterPlot.vue';
import BoxPlot from './components/plots/BoxPlot.vue';
import MultiBoxPlot from './components/plots/MultiBoxPlot.vue';
import TrackPlot from './components/plots/TrackPlot.vue';
import MultiTrackPlot from './components/plots/MultiTrackPlot.vue';
import HierarchicalMultiTrackPlot from './components/plots/HierarchicalMultiTrackPlot.vue';

// Genome Plots
import GenomeScatterPlot from './components/plots/GenomeScatterPlot.vue';
import GenomeTrackPlot from './components/plots/GenomeTrackPlot.vue';
import GenomeMultiTrackPlot from './components/plots/GenomeMultiTrackPlot.vue';

// Legends
import CategoricalLegend from './components/legends/CategoricalLegend.vue';
import ContinuousLegend from './components/legends/ContinuousLegend.vue';

// Modals
import ColorScalePicker from './components/modals/ColorScalePicker.vue';



/* eslint-disable no-undef */
if (typeof window !== 'undefined' && window.Vue) {
    Vue.component(PlotContainer.name, PlotContainer);
    // Axes
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
    // Genome Plots
    Vue.component(GenomeScatterPlot.name, GenomeScatterPlot);
    Vue.component(GenomeTrackPlot.name, GenomeTrackPlot);
    Vue.component(GenomeMultiTrackPlot.name, GenomeMultiTrackPlot);
    // Legends
    Vue.component(CategoricalLegend.name, CategoricalLegend);
    Vue.component(ContinuousLegend.name, ContinuousLegend);
    //Modals
    Vue.component(ColorScalePicker.name, ColorScalePicker);
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
    GenomeScatterPlot,
    GenomeTrackPlot,
    GenomeMultiTrackPlot,
    CategoricalLegend,
    ContinuousLegend,
    ColorScalePicker
}