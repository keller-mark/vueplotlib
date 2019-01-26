[![Build Status](https://travis-ci.org/keller-mark/vueplotlib.svg?branch=master)](https://travis-ci.org/keller-mark/vueplotlib)
[![Coverage Status](https://coveralls.io/repos/github/keller-mark/vueplotlib/badge.svg?branch=master)](https://coveralls.io/github/keller-mark/vueplotlib?branch=master)
[![npm version](https://img.shields.io/npm/v/vueplotlib.svg)](https://www.npmjs.com/package/vueplotlib)

# vueplotlib

:warning: vue-declarative-plots is changing its name to **vueplotlib** in [version 2.0](https://github.com/keller-mark/vueplotlib/tree/v2) :warning:

<img src="./examples-src/screenshot.png" alt="V" width="300"/>

This repository will serve as a place for reusable Vue plot components (built with D3).
These components were developed for use in [iMuSE](https://github.com/lrgr/imuse).

- [Demo](https://keller-mark.github.io/vueplotlib/)
- [Documentation](https://keller-mark.github.io/vueplotlib/docs/)

### Features
- Declarative
- Interactive: hover and click events. axis brushing.
- Fast: WebGL and Canvas rendering via [pixi](https://github.com/pixijs/pixi.js)
- History: record interactions for forward/backward navigation, import/export via JSON
- Composable: axes are separate from plots. subplots via Vue slots.
- Customizable: extend the scale classes (see our [GenomeScale](./src/scales/GenomeScale.js)). extend the history events (see [iMuSE](https://github.com/lrgr/imuse)).


### Installation
```bash
yarn add vueplotlib
```

### Example Usage
Please see the [vueplotlib-examples](https://github.com/keller-mark/vueplotlib-examples) repository for minimal examples of usage.


### Plot Components
- BarPlot 
- StackedBarPlot
- ScatterPlot 
- TrackPlot 
- MultiTrackPlot
- BoxPlot 
- MultiBoxPlot 
- HierarchicalMultiTrackPlot 

### Stratified Plot Components
- StratifiedBoxPlot 
- StratifiedScatterPlot 
- StratifiedSinaPlot 
- StratifiedKaplanMeierPlot 

#### Genome Plot Components
- GenomeScatterPlot 
- GenomeStackedBarPlot 
- GenomeTrackPlot 
- GenomeMultiTrackPlot 

### Axis Components
- Axis 
- GenomeAxis 
- DendrogramAxis 

### Legend Components
- CategoricalLegend 
- ContinuousLegend 

### Other Components
- PlotContainer
- SortOptions 

### Future Plans for Components
- GenomeBarPlot
- GroupedBarPlot
- ViolinPlot
- SinaPlot
- BeeswarmPlot
- JitterPlot
- HorizontalBarPlot
- HorizontalStackedBarPlot
- HorizontalBoxPlot
- HorizontalMultiBoxPlot
- LinePlot
- KaryotypePlot
- GenomeGenePlot



### Development

Install dependencies:
```bash
yarn
```

Serve for development at [http://localhost:8080](http://localhost:8080):
```bash
yarn run serve
```

Build for production (generates `/dist` and `/examples`):
```bash
yarn run build
```

Run tests with [jest](https://jestjs.io/):
```bash
yarn run test
```

Compile documentation with [documentationjs](https://documentation.js.org/):
```bash
yarn run docs
```


<br><br>
This was inspired by the following projects:
- https://altair-viz.github.io/
- https://vega.github.io/vega-lite/
- https://matplotlib.org/
