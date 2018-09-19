<template>
  <div id="app">
    <h1>vue-declarative-plots</h1>
    <a href="https://github.com/keller-mark/vue-declarative-plots" title="View on GitHub">
      <svg id="github" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
    </a>
    <h3>&lt;StackedBarPlot/&gt;</h3>
    <PlotContainer
      :pWidth="800"
      :pHeight="300"
      :pMarginTop="100"
      :pMarginLeft="100"
      :pMarginRight="100"
      :pMarginBottom="100"
    >
      <Axis
        slot="axisTop"
        variable="sample_id"
        orientation="top" 
        :tickRotation="65"
        :getScale="getScale"
      />
      <Axis
        slot="axisLeft"
        variable="exposure"
        orientation="left" 
        :tickRotation="0"
        :getScale="getScale"
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
        slot="axisRight"
        variable="exposure"
        orientation="right" 
        :tickRotation="0"
        :getScale="getScale"
      />
      <Axis
        slot="axisBottom"
        variable="sample_id"
        orientation="bottom" 
        :tickRotation="-65"
        :getScale="getScale"
      />
    </PlotContainer>
    <pre>&lt;PlotContainer<br/>
  :pWidth=&quot;800&quot;<br/>
  :pHeight=&quot;300&quot;<br/>
  :pMarginTop=&quot;10&quot;<br/>
  :pMarginLeft=&quot;50&quot;<br/>
  :pMarginRight=&quot;50&quot;<br/>
  :pMarginBottom=&quot;50&quot;<br/>
&gt;<br/>
  &lt;Axis<br/>
    slot=&quot;axisLeft&quot;<br/>
    variable=&quot;exposure&quot;<br/>
    orientation=&quot;left&quot;<br/>
    :tickRotation=&quot;0&quot;<br/>
    :getScale=&quot;getScale&quot;<br/>
  /&gt;<br/>
  &lt;StackedBarPlot<br/>
    slot=&quot;plot&quot;<br/>
    data=&quot;exposures_data&quot;<br/>
    x=&quot;sample_id&quot;<br/>
    y=&quot;exposure&quot;<br/>
    c=&quot;signature&quot;<br/>
    :getData=&quot;getData&quot;<br/>
    :getScale=&quot;getScale&quot;<br/>
  /&gt;<br/>
  &lt;Axis<br/>
    slot=&quot;axisBottom&quot;<br/>
    variable=&quot;sample_id&quot;<br/>
    orientation=&quot;bottom&quot;<br/>
    :tickRotation=&quot;-65&quot;<br/>
    :getScale=&quot;getScale&quot;<br/>
  /&gt;<br/>
&lt;/PlotContainer&gt;</pre>
  </div>
</template>

<script>
import { set as d3_set } from 'd3-collection';
// Plots
import PlotContainer from '../src/components/PlotContainer.vue';
import Axis from '../src/components/Axis.vue';
import StackedBarPlot from '../src/components/StackedBarPlot.vue';

// Data
import exposuresData from './data/exposures.json';
// Scales
import CategoricalScale from '../src/scales/CategoricalScale.js';
import ContinuousScale from '../src/scales/ContinuousScale.js';

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
    PlotContainer,
    Axis,
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
@import url('https://fonts.googleapis.com/css?family=IBM+Plex+Mono');

#app {
  font-family: Avenir,Helvetica,Arial,sans-serif;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 1em;
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
</style>
