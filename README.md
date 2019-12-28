[![Build Status](https://travis-ci.org/keller-mark/vueplotlib.svg?branch=master)](https://travis-ci.org/keller-mark/vueplotlib)
[![Coverage Status](https://coveralls.io/repos/github/keller-mark/vueplotlib/badge.svg?branch=master)](https://coveralls.io/github/keller-mark/vueplotlib?branch=master)
[![npm version](https://img.shields.io/npm/v/vueplotlib.svg)](https://www.npmjs.com/package/vueplotlib)

# vueplotlib

<img src="./examples-src/screenshot.png" alt="V" width="300"/>

This repository will serve as a place for reusable Vue plot components (built with D3).
These components were developed for use in [ExploSig](https://github.com/lrgr/explosig).

- [Demo](https://keller-mark.github.io/vueplotlib/)
- [Documentation](https://keller-mark.github.io/vueplotlib/docs/)

### Features

- **Declarative**: declare scales, data, and styling options
- **Interactive**: hover and click events, axis brushing, downloading (to SVG)
- **Fast**: canvas plots
- **Linked**: declarative API enables automatic linking of scales across plots
- **History**: record interactions for forward/backward navigation, import/export (via JSON)
- **Composable**: axes and legends are separate from plots, mix and match
- **Customizable**: extend the scale classes (see GenomeScale, BinaryScale). extend the history capabilities.

### Installation
```bash
yarn add vueplotlib
```

### Example Usage
Please see the [vueplotlib-examples](https://github.com/keller-mark/vueplotlib-examples) repository for minimal examples of usage.


### Plot Components
- BarPlot :white_check_mark:
- StackedBarPlot :white_check_mark:
- ScatterPlot :white_check_mark:
- TrackPlot :white_check_mark:
- MultiTrackPlot :white_check_mark:
- BoxPlot :white_check_mark:
- MultiBoxPlot :white_check_mark:
- HierarchicalMultiTrackPlot :white_check_mark:

### Stratified Plot Components
- StratifiedBoxPlot :white_check_mark:
- StratifiedScatterPlot :white_check_mark:
- StratifiedSinaPlot :white_check_mark:
- StratifiedKaplanMeierPlot :white_check_mark:

#### Genome Plot Components
- GenomeScatterPlot :white_check_mark:
- GenomeStackedBarPlot :white_check_mark:
- GenomeTrackPlot :white_check_mark:
- GenomeMultiTrackPlot :white_check_mark:

### Axis Components
- Axis :white_check_mark:
- GenomeAxis :white_check_mark:
- DendrogramAxis :white_check_mark:

### Legend Components
- CategoricalLegend :white_check_mark:
- ContinuousLegend :white_check_mark:

### Other Components
- PlotContainer :white_check_mark:
- SortOptions :white_check_mark:

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
