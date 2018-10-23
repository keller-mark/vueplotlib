<template>
  <div id="app">
    <h1>vue-declarative-plots</h1>
    <a href="https://github.com/keller-mark/vue-declarative-plots" title="View on GitHub">
      <svg id="github" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
    </a>

    <button @click="showStack = !showStack" :style="{display: 'block'}">Toggle Stack</button>

    <h3>&lt;StackedBarPlot/&gt;</h3>
    <PlotContainer
      :pWidth="800"
      :pHeight="300"
      :pMarginTop="10"
      :pMarginLeft="120"
      :pMarginRight="10"
      :pMarginBottom="150"
    >
      <Axis
        slot="axisLeft"
        variable="exposure"
        side="left" 
        :tickRotation="-35"
        :getScale="getScale"
        :getStack="getStack"
      />
      <StackedBarPlot
        slot="plot"
        data="exposures_data"
        x="sample_id" 
        y="exposure"
        c="signature"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
      />
      <Axis
        slot="axisBottom"
        variable="sample_id"
        side="bottom" 
        :tickRotation="-65"
        :getScale="getScale"
        :getStack="getStack"
      />
    </PlotContainer>

    <h3>&lt;BarPlot/&gt;</h3>
    <PlotContainer
      :pWidth="500"
      :pHeight="300"
      :pMarginTop="10"
      :pMarginLeft="120"
      :pMarginRight="10"
      :pMarginBottom="100"
    >
      <Axis
        slot="axisLeft"
        variable="exposure"
        side="left" 
        :tickRotation="-35"
        :getScale="getScale"
        :getStack="getStack"
      />
      <BarPlot
        slot="plot"
        data="exposures_single_data"
        x="signature" 
        y="exposure"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
      />
      <Axis
        slot="axisBottom"
        variable="signature"
        side="bottom" 
        :tickRotation="-65"
        :getScale="getScale"
        :getStack="getStack"
        :disableBrushing="true"
      />
    </PlotContainer>

    <h3>&lt;ScatterPlot/&gt;</h3>
    <PlotContainer
      :pWidth="500"
      :pHeight="300"
      :pMarginTop="10"
      :pMarginLeft="120"
      :pMarginRight="10"
      :pMarginBottom="100"
    >
      <Axis
        slot="axisLeft"
        variable="y"
        side="left" 
        :tickRotation="-35"
        :getScale="getScale"
        :getStack="getStack"
      />
      <ScatterPlot
        slot="plot"
        data="xy_data"
        x="x"
        y="y"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
      />
      <Axis
        slot="axisBottom"
        variable="x"
        side="bottom" 
        :tickRotation="0"
        :getScale="getScale"
        :getStack="getStack"
      />
    </PlotContainer>

    <h3>&lt;BoxPlot/&gt;</h3>
    <PlotContainer
      :pWidth="200"
      :pHeight="300"
      :pMarginTop="10"
      :pMarginLeft="120"
      :pMarginRight="10"
      :pMarginBottom="50"
    >
      <Axis
        slot="axisLeft"
        variable="exposure"
        side="left" 
        :tickRotation="-35"
        :getScale="getScale"
        :getStack="getStack"
      />
      <BoxPlot
        slot="plot"
        data="boxplot_data"
        y="exposure"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
        :drawOutliers="true"
      />
    </PlotContainer>

    <h3>&lt;MultiBoxPlot/&gt;</h3>
    <PlotContainer
      :pWidth="500"
      :pHeight="300"
      :pMarginTop="10"
      :pMarginLeft="120"
      :pMarginRight="10"
      :pMarginBottom="180"
    >
      <Axis
        slot="axisLeft"
        variable="exposure"
        side="left" 
        :tickRotation="-35"
        :getScale="getScale"
        :getStack="getStack"
      />
      <MultiBoxPlot
        slot="plot"
        data="exposures_data"
        x="signature"
        y="exposure"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
        :drawOutliers="true"
      />
      <Axis
        slot="axisBottom"
        variable="signature"
        side="bottom" 
        :tickRotation="-65"
        :getScale="getScale"
        :getStack="getStack"
      />
    </PlotContainer>

    <h3>&lt;TrackPlot/&gt;</h3>
    <PlotContainer
      :pWidth="700"
      :pHeight="40"
      :pMarginTop="10"
      :pMarginLeft="10"
      :pMarginRight="10"
      :pMarginBottom="180"
    >
      <TrackPlot
        slot="plot"
        data="clinical_data"
        x="sample_id"
        c="age"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
      />
      <Axis
        slot="axisBottom"
        variable="sample_id"
        side="bottom" 
        :tickRotation="-65"
        :getScale="getScale"
        :getStack="getStack"
      />
    </PlotContainer>

    <h3>&lt;GenomeScatterPlot/&gt;</h3>
    <PlotContainer
      :pWidth="800"
      :pHeight="500"
      :pMarginTop="20"
      :pMarginLeft="150"
      :pMarginRight="20"
      :pMarginBottom="80"
    > 
      <Axis
        slot="axisLeft"
        variable="mut_dist"
        side="left"
        :getScale="getScale"
        :getStack="getStack"
      />
      <GenomeScatterPlot
        slot="plot"
        data="rainfall_data"
        g="genome"
        chromosomeVariable="chr"
        positionVariable="pos"
        c="cat"
        y="mut_dist"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
      />
      <GenomeAxis
        slot="axisBottom"
        scaleKey="genome"
        side="bottom"
        :getScale="getScale"
        :getStack="getStack"
      />
    </PlotContainer>

    <h3>&lt;MultiTrackPlot/&gt;</h3>
    <PlotContainer
      :pWidth="780"
      :pHeight="500"
      :pMarginTop="20"
      :pMarginLeft="180"
      :pMarginRight="20"
      :pMarginBottom="20"
    >
      <Axis
        slot="axisLeft"
        variable="signature"
        side="left"
        :getScale="getScale"
        :getStack="getStack"
      />
      <MultiTrackPlot
        slot="plot"
        data="exposures_data"
        x="sample_id"
        y="signature"
        c="exposure"
        :getScale="getScale"
        :getStack="getStack"
        :getData="getData"
        :clickHandler="exampleClickHandler"
      />
    </PlotContainer>

    <h3>&lt;DendrogramAxis/&gt; and &lt;HierarchicalMultiTrackPlot/&gt;</h3>
    <PlotContainer
      :pWidth="780"
      :pHeight="500"
      :pMarginTop="200"
      :pMarginLeft="180"
      :pMarginRight="20"
      :pMarginBottom="20"
    >
      <DendrogramAxis
        slot="axisTop"
        variable="sample_id"
        h="clustering"
        side="top"
        :getScale="getScale"
        :getStack="getStack"
        :getData="getData"
        :clickHandler="exampleClickHandler"
      />
      <Axis
        slot="axisLeft"
        variable="signature"
        side="left"
        :getScale="getScale"
        :getStack="getStack"
      />
      <HierarchicalMultiTrackPlot
        slot="plot"
        data="exposures_data"
        h="clustering"
        x="sample_id"
        y="signature"
        c="exposure"
        :getScale="getScale"
        :getStack="getStack"
        :getData="getData"
        :clickHandler="exampleClickHandler"
      />
    </PlotContainer>

    <h3>&lt;GenomeTrackPlot/&gt;</h3>
    <PlotContainer
      :pWidth="800"
      :pHeight="40"
      :pMarginTop="20"
      :pMarginLeft="20"
      :pMarginRight="20"
      :pMarginBottom="80"
    > 
      <GenomeTrackPlot
        slot="plot"
        data="rand_genome_data"
        g="genome"
        eventColor="#fa0000"
        lineColor="#DCDCDC"
        chromosomeVariable="chr"
        positionVariable="pos"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
      />
      <GenomeAxis
        slot="axisBottom"
        scaleKey="genome"
        side="bottom"
        :getScale="getScale"
        :getStack="getStack"
      />
    </PlotContainer>

    <h3>&lt;GenomeMultiTrackPlot/&gt;</h3>
    <PlotContainer
      :pWidth="800"
      :pHeight="700"
      :pMarginTop="20"
      :pMarginLeft="150"
      :pMarginRight="20"
      :pMarginBottom="80"
    > 
      <Axis
        slot="axisLeft"
        variable="sample_id"
        side="left"
        :getScale="getScale"
        :getStack="getStack"
      />
      <GenomeMultiTrackPlot
        slot="plot"
        data="rand_genome_multi_data"
        g="genome"
        c="e_type"
        y="sample_id"
        lineColor="#DCDCDC"
        chromosomeVariable="chr"
        positionVariable="pos"
        :getData="getData"
        :getScale="getScale"
        :clickHandler="exampleClickHandler"
      />
      <GenomeAxis
        slot="axisBottom"
        scaleKey="genome"
        side="bottom"
        :getScale="getScale"
        :getStack="getStack"
      />
    </PlotContainer>


    <h3>&lt;SortOptions/&gt;</h3>
    <SortOptions 
      variable="sample_id" 
      :by="sampleSortByExposures" 
      :getScale="getScale" 
      :getData="getData"
      :getStack="getStack"
    />
    <SortOptions 
      variable="sample_id" 
      :by="sampleSortByAge" 
      :getScale="getScale" 
      :getData="getData"
      :getStack="getStack"
    />


    <div class="stack-wrapper" v-show="showStack">
      <h3>&lt;Stack/&gt;</h3>
      <Stack :getStack="getStack" />
    </div>
  </div>
</template>

<script>
import { set as d3_set } from 'd3-collection';
// Components
import { 
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
  GenomeMultiTrackPlot
} from '../src/index.js';


// Data
import DataContainer from '../src/data/DataContainer.js';

import exposuresData from './data/exposures.json';
import exposuresSingleData from './data/exposures_single.json';
import rainfallData from './data/rainfall.json';
import xyData from './data/xy.json';
import boxplotData from './data/boxplot_data.json';
import clinicalData from './data/clinical_data.json';
import clusteringData from './data/clustering.json';
import randomGenomeData from './data/random_genome_data.json';
import randomGenomeMultiData from './data/random_genome_multi_data.json';


// Scales
import CategoricalScale from '../src/scales/CategoricalScale.js';
import ContinuousScale from '../src/scales/ContinuousScale.js';
import GenomeScale from '../src/scales/GenomeScale.js';

// Sort
import SortOptions from '../src/components/SortOptions.vue';

import SortBy from '../src/sort/SortBy.js';

// History
import Stack from './Stack.vue';
import HistoryStack from './../src/history/HistoryStack.js';
import HistoryEvent from './../src/history/HistoryEvent.js';

const exposuresDataContainer = new DataContainer(
  'exposures_data', 
  'SBS Exposures', 
  exposuresData
);
const exposuresSingleDataContainer = new DataContainer(
  'exposures_single_data', 
  'SBS Exposures for SA542425', 
  exposuresSingleData
);
const rainfallDataContainer = new DataContainer(
  'rainfall_data', 
  'Rainfall for SA543567', 
  rainfallData
);
const xyDataContainer = new DataContainer(
  'xy_data',
  'Random Data',
  xyData
);
const boxplotDataContainer = new DataContainer(
  'boxplot_data',
  'COSMIC 1 Exposures',
  boxplotData
);
const clinicalDataContainer = new DataContainer(
  'clinical_data',
  'Clinical Data',
  clinicalData
);
const clusteringDataContainer = new DataContainer(
  'clustering',
  'Samples clustered by Exposure',
  clusteringData
);
const randomGenomeDataContainer = new DataContainer(
  'rand_genome_data',
  'Random Genome Data',
  randomGenomeData
);
const randomGenomeMultiDataContainer = new DataContainer(
  'rand_genome_multi_data',
  'Random Genome Multi Data',
  randomGenomeMultiData
);


// Initialize data
const getData = function(dataKey) {
  switch(dataKey) {
    case 'exposures_data':
      return exposuresDataContainer;
    case 'exposures_single_data':
      return exposuresSingleDataContainer;
    case 'rainfall_data':
      return rainfallDataContainer;
    case 'xy_data':
      return xyDataContainer;
    case 'boxplot_data':
      return boxplotDataContainer;
    case 'clinical_data':
      return clinicalDataContainer;
    case 'clustering':
      return clusteringDataContainer;
    case 'rand_genome_data':
      return randomGenomeDataContainer;
    case 'rand_genome_multi_data':
      return randomGenomeMultiDataContainer;
  }
};


// Initialize scales
const sampleIdScale = new CategoricalScale(
  'sample_id', 
  'Sample', 
  d3_set(exposuresData.map(el => el.sample_id)).values()
);
const exposureScale = new ContinuousScale(
  'exposure',
  'Exposure',
  [0, 90000]
);
const signatureScale = new CategoricalScale(
  'signature',
  'Signature',
  ["COSMIC 1","COSMIC 2","COSMIC 3","COSMIC 4","COSMIC 5","COSMIC 6","COSMIC 7","COSMIC 8","COSMIC 9","COSMIC 10","COSMIC 11","COSMIC 12","COSMIC 13","COSMIC 14","COSMIC 15","COSMIC 16","COSMIC 17","COSMIC 18","COSMIC 19","COSMIC 20","COSMIC 21","COSMIC 22","COSMIC 23","COSMIC 24","COSMIC 25","COSMIC 26","COSMIC 27","COSMIC 28","COSMIC 29","COSMIC 30","5* A"]
);
const xyYScale = new ContinuousScale(
  'y',
  'Random Y',
  [0, 100]
);
const xyXScale = new ContinuousScale(
  'x',
  'Random X',
  [0, 50]
);
const ageScale = new ContinuousScale(
  'age',
  'Age',
  [0, 100]
);
const genomeScale = new GenomeScale("genome", "Genome");
const SBS_96_CATEGORIES = [
    'A[C>A]A', 'A[C>A]C', 'A[C>A]G', 'A[C>A]T', 
    'C[C>A]A', 'C[C>A]C', 'C[C>A]G', 'C[C>A]T', 
    'G[C>A]A', 'G[C>A]C', 'G[C>A]G', 'G[C>A]T', 
    'T[C>A]A', 'T[C>A]C', 'T[C>A]G', 'T[C>A]T', 
    
    'A[C>G]A', 'A[C>G]C', 'A[C>G]G', 'A[C>G]T', 
    'C[C>G]A', 'C[C>G]C', 'C[C>G]G', 'C[C>G]T', 
    'G[C>G]A', 'G[C>G]C', 'G[C>G]G', 'G[C>G]T', 
    'T[C>G]A', 'T[C>G]C', 'T[C>G]G', 'T[C>G]T', 
    
    'A[C>T]A', 'A[C>T]C', 'A[C>T]G', 'A[C>T]T', 
    'C[C>T]A', 'C[C>T]C', 'C[C>T]G', 'C[C>T]T',
    'G[C>T]A', 'G[C>T]C', 'G[C>T]G', 'G[C>T]T', 
    'T[C>T]A', 'T[C>T]C', 'T[C>T]G', 'T[C>T]T',  
    
    'A[T>A]A', 'A[T>A]C', 'A[T>A]G', 'A[T>A]T', 
    'C[T>A]A', 'C[T>A]C', 'C[T>A]G', 'C[T>A]T', 
    'G[T>A]A', 'G[T>A]C', 'G[T>A]G', 'G[T>A]T',
    'T[T>A]A', 'T[T>A]C', 'T[T>A]G', 'T[T>A]T', 
    
    'A[T>C]A', 'A[T>C]C', 'A[T>C]G', 'A[T>C]T', 
    'C[T>C]A', 'C[T>C]C', 'C[T>C]G', 'C[T>C]T', 
    'G[T>C]A', 'G[T>C]C', 'G[T>C]G', 'G[T>C]T', 
    'T[T>C]A', 'T[T>C]C', 'T[T>C]G', 'T[T>C]T', 
    
    'A[T>G]A', 'A[T>G]C', 'A[T>G]G', 'A[T>G]T', 
    'C[T>G]A', 'C[T>G]C', 'C[T>G]G', 'C[T>G]T', 
    'G[T>G]A', 'G[T>G]C', 'G[T>G]G', 'G[T>G]T', 
    'T[T>G]A', 'T[T>G]C', 'T[T>G]G', 'T[T>G]T'
];
const catScale = new CategoricalScale(
  'cat',
  'Mutation Category',
  SBS_96_CATEGORIES
);
const mutDistScale = new ContinuousScale(
  'mut_dist',
  'Distance to Previous Mutation',
  [0, 6000000]
);
const projScale = new CategoricalScale(
  'proj_id',
  'Project',
  ["ICGC-BRCA-EU","TCGA-UCEC","TCGA-BRCA"]
);
const eventScale = new CategoricalScale(
  'e_type',
  'Event Type',
  ["e1","e2","e3"],
  ["My Event 1","My Event 2","My Event 3"]
);


const getScale = function(scaleKey) {
  switch(scaleKey) {
    case 'sample_id':
      return sampleIdScale;
    case 'exposure':
      return exposureScale;
    case 'signature':
      return signatureScale;
    case 'y':
      return xyYScale;
    case 'x':
      return xyXScale;
    case 'age':
      return ageScale;
    case 'genome':
      return genomeScale;
    case 'cat':
      return catScale;
    case 'mut_dist':
      return mutDistScale;
    case 'proj_id':
      return projScale;
    case 'e_type':
      return eventScale;
  }
};


// Initialize the stack
const stack = new HistoryStack(getScale, getData);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "exposure", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "signature", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "y", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "x", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "age", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "genome", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "cat", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "mut_dist", "reset"), true);



const getStack = function() {
  return stack;
}

const sampleSortByExposures = new SortBy(
  "exposures_data", 
  signatureScale.domain
);

const sampleSortByAge = new SortBy(
  'clinical_data', 
  ['age']
);


export default {
  name: 'app',
  components: {
    PlotContainer,
    Axis,
    GenomeAxis,
    DendrogramAxis,
    StackedBarPlot,
    BarPlot,
    SortOptions,
    Stack,
    ScatterPlot,
    BoxPlot,
    MultiBoxPlot,
    TrackPlot,
    MultiTrackPlot,
    HierarchicalMultiTrackPlot,
    GenomeScatterPlot,
    GenomeTrackPlot,
    GenomeMultiTrackPlot
  },
  data() {
    return {
      getData: getData,
      getScale: getScale,
      getStack: getStack,
      showStack: false,
      sampleSortByExposures: sampleSortByExposures,
      sampleSortByAge: sampleSortByAge
    }
  },
  created() {
    
  },
  methods: {
    exampleClickHandler() {
      alert("You clicked something with data: " + JSON.stringify([...arguments]));
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=IBM+Plex+Mono');

#app {
  font-family: Avenir,Helvetica,Arial,sans-serif;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 1em;
  position: relative;
}
pre {
  font-family: 'IBM Plex Mono', monospace;
  background-color: #DDD;
  padding: 1em;
}
h1 {
  display: inline-block;
}
a {
  color: black;
  text-decoration: none;
}
#github {
  float: right;
  top: 10px;
  display: inline-block;
  position: relative;
}

.clearfix {
  float: none;
  clear: both;
}

.plot-group {
  position: relative;
}

.stack-wrapper {
  float: right;
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  background-color: lightsteelblue;
  padding: 0.5rem;
  height: 90vh;
  
}

.stack-wrapper h3 {
  margin: 5px auto;
}

.stack-wrapper > div > div > div {
  overflow-x: scroll;
  white-space: nowrap;
  border-left: 3px solid dimgray;
  padding: 3px;
  margin-bottom: 5px;
}


</style>
