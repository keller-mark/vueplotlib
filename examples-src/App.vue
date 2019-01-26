<template>
  <div id="app">
    <h1>vueplotlib</h1>
    <a href="https://github.com/keller-mark/vueplotlib" title="View on GitHub">
      <svg id="github" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
    </a>

    <button @click="showStack = !showStack" :style="{display: 'block'}">Toggle Stack</button>

    <div :style="{'border': '1px solid gray', 'display': 'inline-block', 'margin-top': '20px', 'padding': 0}">
      <SubPlots
        :width="300"
        :height="200"
        :getData="getData"
        :getScale="getScale"
        :getStack="getStack"
      >
        <BarPlot
          slot="1"
          data="exposures_single_data"
          x="signature"
          y="exposure"
        />
      </SubPlots>
    </div>
    


    <div class="stack-wrapper" v-show="showStack">
      <h3>&lt;Stack/&gt;</h3>
      <Stack :getStack="getStack" />
    </div>
  </div>
</template>

<script>
import { set as d3_set } from 'd3-collection';

import { 
  // Components
    SubPlots,
    BarPlot,
    CategoricalLegend,
    ContinuousLegend,
    // Classes
    DataContainer,
    HistoryStack,
    CategoricalScale,
    ContinuousScale,
    GenomeScale,
} from '../src/index.js';


// Data
import exposuresData from './data/exposures.json';
import exposuresSingleData from './data/exposures_single.json';
import exposuresErrorSingleData from './data/error_single.json';
import rainfallData from './data/rainfall.json';
import xyData from './data/xy.json';
import clinicalData from './data/clinical_data.json';
import clusteringData from './data/clustering.json';
import randomGenomeData from './data/random_genome_data.json';
import randomGenomeMultiData from './data/random_genome_multi_data.json';
import genomeBinsData from './data/genome_bins.json';
import vueData from './data/vue.json';
import survivalData from './data/survival.json';


// History
import Stack from './Stack.vue';
import { EVENT_TYPES, EVENT_SUBTYPE_RESETS } from '../src/history/base-events.js';

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
const exposuresErrorSingleDataContainer = new DataContainer(
  'exposures_error_single_data', 
  'SBS Exposures Error for SA542425', 
  exposuresErrorSingleData
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
const genomeBinsDataContainer = new DataContainer(
  'genome_bins_data',
  'Signature Exposures across the Genome',
  genomeBinsData
);
const vueDataContainer = new DataContainer(
  'vue_data',
  'Vue Logo',
  vueData
);

const carsAsyncDataContainer = new DataContainer(
  'async_cars_data',
  'Cars',
  fetch('https://vega.github.io/vega-datasets/data/cars.json', {mode: 'cors'}).then(function(response) {
    return response.json();
  })
);

const survivalDataContainer = new DataContainer(
  'survival_data',
  'Survival',
  survivalData
);


// Initialize data
const getData = function(dataKey) {
  switch(dataKey) {
    case 'exposures_data':
      return exposuresDataContainer;
    case 'exposures_single_data':
      return exposuresSingleDataContainer;
    case 'exposures_error_single_data':
      return exposuresErrorSingleDataContainer;
    case 'rainfall_data':
      return rainfallDataContainer;
    case 'xy_data':
      return xyDataContainer;
    case 'clinical_data':
      return clinicalDataContainer;
    case 'clustering':
      return clusteringDataContainer;
    case 'rand_genome_data':
      return randomGenomeDataContainer;
    case 'rand_genome_multi_data':
      return randomGenomeMultiDataContainer;
    case 'genome_bins_data':
      return genomeBinsDataContainer;
    case 'async_cars_data':
      return carsAsyncDataContainer;
    case 'vue_data':
      return vueDataContainer;
    case 'survival_data':
      return survivalDataContainer;
  }
};


// Initialize scales
const sampleIdScale = new CategoricalScale(
  'sample_id', 
  'Sample', 
  d3_set(exposuresData.map(el => el.sample_id)).values()
);
const numSamplesScale = new ContinuousScale(
  'num_samples', 
  'Number of Samples', 
  [0, d3_set(exposuresData.map(el => el.sample_id)).values().length]
);
const exposureScale = new ContinuousScale(
  'exposure',
  'Exposure',
  [0, 1000]
);
const exposureErrorScale = new ContinuousScale(
  'exposure_error',
  'Error',
  [-10, 10]
);
const signatureScale = new CategoricalScale(
  'signature',
  'Signature',
  ["COSMIC 1","COSMIC 2","COSMIC 3","COSMIC 4","COSMIC 5","COSMIC 6","COSMIC 7","COSMIC 8","COSMIC 9","COSMIC 10","COSMIC 11","COSMIC 12","COSMIC 13","COSMIC 14","COSMIC 15","COSMIC 16","COSMIC 17","COSMIC 18","COSMIC 19","COSMIC 20","COSMIC 21","COSMIC 22","COSMIC 23","COSMIC 24","COSMIC 25","COSMIC 26","COSMIC 27","COSMIC 28","COSMIC 29","COSMIC 30","5* A"],
  undefined,
  {"5* A": "#FF0000"}
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
const sexScale = new CategoricalScale(
  'sex',
  'Sex',
  ["Male", "Female"]
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
  [1, 6000000]
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

const genomeExposureScale = new ContinuousScale(
  'genome_exposure',
  'Exposure per Genome Bin',
  [0, 50]
);

const carsCylinderScale = new ContinuousScale(
  'Cylinders',
  'Cylinders',
  [0, 10]
);
const carsHorsepowerScale = new ContinuousScale(
  'Horsepower',
  'Horsepower',
  [0, 400]
);

const vueXScale = new ContinuousScale(
  'vue_x',
  'Vue X',
  [0, 12]
);
const vueYScale = new ContinuousScale(
  'vue_y',
  'Vue Y',
  [-0.5, 10]
);
const vueColorScale = new CategoricalScale(
  'vue_c',
  'Vue Color',
  ["0", "1", "2"],
  undefined,
  { "0": "#45B280", "1": "#36495D" }
);


const survivalPctScale = new ContinuousScale(
  'survival_pct',
  'Percent Survival',
  [0, 100]
);

const survivalTimeScale = new ContinuousScale(
  'survival_time',
  'Days',
  [0, 4680]
);

const survivalPatientScale = new CategoricalScale(
  'survival_patient',
  'Patient',
  Array.from((new Set(survivalData.map(d => d["survival_patient"]))).values())
);




const getScale = function(scaleKey) {
  switch(scaleKey) {
    case 'sample_id':
      return sampleIdScale;
    case 'num_samples':
      return numSamplesScale;
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
    case 'sex':
      return sexScale;
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
    case 'genome_exposure':
      return genomeExposureScale;
    case 'Cylinders':
      return carsCylinderScale;
    case 'Horsepower':
      return carsHorsepowerScale;
    case 'vue_x':
      return vueXScale;
    case 'vue_y':
      return vueYScale;
    case 'vue_c':
      return vueColorScale;
    case 'exposure_error':
      return exposureErrorScale;
    case 'survival_pct':
      return survivalPctScale;
    case 'survival_time':
      return survivalTimeScale;
    case 'survival_patient':
      return survivalPatientScale;
  }
};


// Initialize the stack
const stack = new HistoryStack(
  {
    [EVENT_TYPES.SCALE]: getScale,
    [EVENT_TYPES.DATA]: getData
  }, 
  EVENT_SUBTYPE_RESETS
);



const getStack = function() {
  return stack;
}



export default {
  name: 'app',
  components: {
    SubPlots,
    BarPlot,
    Stack,
    CategoricalLegend,
    ContinuousLegend
  },
  data() {
    return {
      getData: getData,
      getScale: getScale,
      getStack: getStack,
      showStack: false
    }
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

.stack-wrapper {
  float: right;
  position: fixed;
  top: 8vh;
  right: 1rem;
  width: 400px;
  background-color: lightsteelblue;
  padding: 0.5rem;
  height: 89vh;
  
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
