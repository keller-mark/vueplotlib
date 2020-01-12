import PlotContainer from './components/PlotContainer.vue';
import SortOptions from './components/SortOptions.vue';
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
import RectPlot from './components/plots/RectPlot.vue';
import MultiDataRectPlot from './components/plots/MultiDataRectPlot.vue';
import MultiTrackPlot from './components/plots/MultiTrackPlot.vue';
import MultiDataTrackPlot from './components/plots/MultiDataTrackPlot.vue';
import HierarchicalMultiTrackPlot from './components/plots/HierarchicalMultiTrackPlot.vue';
import StratifiedBoxPlot from './components/plots/StratifiedBoxPlot.vue';
import DoubleStratifiedBoxPlot from './components/plots/DoubleStratifiedBoxPlot.vue';
import StratifiedScatterPlot from './components/plots/StratifiedScatterPlot.vue';
import DoubleStratifiedScatterPlot from './components/plots/DoubleStratifiedScatterPlot.vue';
import StratifiedSinaPlot from './components/plots/StratifiedSinaPlot.vue';
import DoubleStratifiedSinaPlot from './components/plots/DoubleStratifiedSinaPlot.vue';
import StratifiedKaplanMeierPlot from './components/plots/StratifiedKaplanMeierPlot.vue';
import CountBarPlot from './components/plots/CountBarPlot.vue';

// Genome Plots
import GenomeScatterPlot from './components/plots/GenomeScatterPlot.vue';
import GenomeTrackPlot from './components/plots/GenomeTrackPlot.vue';
import GenomeMultiTrackPlot from './components/plots/GenomeMultiTrackPlot.vue';
import GenomeStackedBarPlot from './components/plots/GenomeStackedBarPlot.vue';

// Legends
import CategoricalLegend from './components/legends/CategoricalLegend.vue';
import ContinuousLegend from './components/legends/ContinuousLegend.vue';
import Legend from './components/legends/Legend.vue';

// Classes
import DataContainer from './data/DataContainer';
import HistoryStack, { computedParam } from './history/HistoryStack';
import HistoryEvent from './history/HistoryEvent';
import AbstractScale from './scales/AbstractScale';
import BinaryScale from './scales/BinaryScale';
import CategoricalScale from './scales/CategoricalScale';
import ContinuousScale from './scales/ContinuousScale';
import GenomeScale from './scales/GenomeScale';
import Expected from './expected';

// Other
import { EVENT_TYPES, EVENT_SUBTYPES, EVENT_SUBTYPE_RESETS } from './history/base-events';

// Reference: https://stackoverflow.com/questions/28282295/getbbox-of-svg-when-hidden
const _getBBox = SVGGraphicsElement.prototype.getBBox;   
SVGGraphicsElement.prototype.getBBox = function() {
  let bbox, tempDiv, tempSvg;
  if (document.contains(this)) {
    return _getBBox.apply(this);
  } else {
    tempDiv = document.createElement("div");
    tempDiv.setAttribute("style", "position:absolute; visibility:hidden; width:0; height:0");
    if (this.tagName === "svg") {
      tempSvg = this.cloneNode(true);
     } else {
      tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tempSvg.appendChild(this.cloneNode(true));
    }
    tempDiv.appendChild(tempSvg);
    document.body.appendChild(tempDiv);
    bbox = _getBBox.apply(tempSvg);
    document.body.removeChild(tempDiv);
    return bbox;
  }
};

export {
    // Components
    PlotContainer,
    SortOptions,
    Axis,
    GenomeAxis,
    DendrogramAxis,
    StackedBarPlot,
    BarPlot,
    ScatterPlot,
    BoxPlot,
    MultiBoxPlot,
    TrackPlot,
    RectPlot,
    MultiDataRectPlot,
    MultiTrackPlot,
    MultiDataTrackPlot,
    HierarchicalMultiTrackPlot,
    StratifiedBoxPlot,
    DoubleStratifiedBoxPlot,
    StratifiedScatterPlot,
    DoubleStratifiedScatterPlot,
    StratifiedSinaPlot,
    DoubleStratifiedSinaPlot,
    StratifiedKaplanMeierPlot,
    CountBarPlot,
    GenomeScatterPlot,
    GenomeTrackPlot,
    GenomeMultiTrackPlot,
    GenomeStackedBarPlot,
    CategoricalLegend,
    ContinuousLegend,
    Legend,
    // Classes
    DataContainer,
    HistoryStack,
    HistoryEvent,
    AbstractScale,
    BinaryScale,
    CategoricalScale,
    ContinuousScale,
    GenomeScale,
    Expected,
    // Other
    computedParam,
    EVENT_TYPES, EVENT_SUBTYPES, EVENT_SUBTYPE_RESETS,
}