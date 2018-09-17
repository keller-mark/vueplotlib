<template>
  <div id="app">
    <StackedBarPlot 
      data="exposures_data"
      x="sample_id" 
      y="exposure"
      color="signature"
      width="600"
      height="300"
      marginTop="10"
      marginLeft="10"
      marginRight="10"
      marginBottom="10"
      :getData="getData"
      :getScale="getScale"
    />
  </div>
</template>

<script>
import * as d3 from 'd3';
// Plots
import StackedBarPlot from '../src/components/StackedBarPlot.vue';
// Data
import exposuresData from './data/exposures.json';
// Scales
import CategoricalScale from '../src/scales/CategoricalScale.js';
import ContinuousScale from '../src/scales/ContinuousScale.js';

const sampleIdScale = new CategoricalScale(
  'sample_id', 
  'Sample', 
  d3.set(exposuresData.map(el => el.sample_id)).values()
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


const getData = function(dataKey) {
  switch(dataKey) {
    case 'exposures_data':
      return exposuresData;
    default:
      return {}
  }
};

const getScale = function(scaleKey) {
  switch(scaleKey) {
    case 'sample_id':
      return sampleIdScale;
    case 'exposure':
      return exposureScale;
    case 'signature':
      return signatureScale;
  }
};

export default {
  name: 'app',
  components: {
    StackedBarPlot
  },
  data() {
    return {
      getData: getData,
      getScale: getScale
    }
  },
  computed: {

  },
  mounted() {
    
  }
}
</script>

<style>

</style>
