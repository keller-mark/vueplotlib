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

    <h3>&lt;SortOptions/&gt;</h3>
    <SortOptions 
      variable="sample_id" 
      :by="sampleSortBy" 
      :getScale="getScale" 
      :getData="getData"
    />

    <h3>&lt;BarPlot/&gt;</h3>
    <PlotContainer
      :pWidth="500"
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
      <BarPlot
        slot="plot"
        data="exposures_single_data"
        x="signature" 
        y="exposure"
        :getData="getData"
        :getScale="getScale"
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
      :pMarginBottom="150"
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


    <div class="stack-wrapper" v-show="showStack">
      <h3>&lt;Stack/&gt;</h3>
      <Stack :getStack="getStack" />
    </div>
  </div>
</template>

<script>
import { set as d3_set } from 'd3-collection';
// Plots
import PlotContainer from '../src/components/PlotContainer.vue';
import Axis from '../src/components/Axis.vue';

import StackedBarPlot from '../src/components/plots/StackedBarPlot.vue';
import BarPlot from '../src/components/plots/BarPlot.vue';
import ScatterPlot from '../src/components/plots/ScatterPlot.vue';

// Data
import DataContainer from '../src/data/DataContainer.js';

import exposuresData from './data/exposures.json';
import exposuresSingleData from './data/exposures_single.json';
import rainfallData from './data/rainfall.json';
import xyData from './data/xy.json';

// Scales
import CategoricalScale from '../src/scales/CategoricalScale.js';
import ContinuousScale from '../src/scales/ContinuousScale.js';
import GenomeScale from '../src/scales/GenomeScale.js';


// Sort
import SortOptions from '../src/components/SortOptions.vue';

import SortBy from '../src/sort/SortBy.js';
import SortVars1D from '../src/sort/SortVars1D.js';
import SortVars2D from '../src/sort/SortVars2D.js';

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
    default:
      return {}
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
  }
};


// Initialize the stack
const stack = new HistoryStack(getScale);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "exposure", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "signature", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "y", "reset"), true);
stack.push(new HistoryEvent(HistoryEvent.types.SCALE, "x", "reset"), true);


const getStack = function() {
  return stack;
}

const sampleSortBy = new SortBy(
  "exposures_data", 
  new SortVars2D({
    "exposure": new SortVars1D(["signature"])
  })
);



export default {
  name: 'app',
  components: {
    PlotContainer,
    Axis,
    StackedBarPlot,
    BarPlot,
    SortOptions,
    Stack,
    ScatterPlot
  },
  data() {
    return {
      getData: getData,
      getScale: getScale,
      sampleSortBy: sampleSortBy,
      getStack: getStack,
      showStack: false
    }
  },
  created() {
    let gScale = new GenomeScale("genome", "Genome");

    console.log(gScale.convertPositionToRatio("1", 2000))
    console.log(gScale.convertPositionToRatioFiltered("1", 2000))

    console.log(gScale.convertPositionToRatio("5", 3000))
    console.log(gScale.convertPositionToRatioFiltered("5", 3000))
    
  },
  methods: {

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
