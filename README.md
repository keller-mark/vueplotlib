[![Build Status](https://travis-ci.org/keller-mark/vue-declarative-plots.svg?branch=master)](https://travis-ci.org/keller-mark/vue-declarative-plots)

# vue-declarative-plots

This repository will serve as a place for reusable Vue plot components (built with D3).
These components were developed for use in [iMuSE](https://github.com/lrgr/mutation-signature-explorer).

This was inspired by the following projects:
- https://altair-viz.github.io/
- https://vega.github.io/vega-lite/


Goals: 
- [x] props should declare visual encodings of data
    - example: the StackedBarPlot component will accept the following props:
        ```js
        x="sample_id"
        y="exposure"
        c="signature" // color
        ```
- [x] props should declare where to find the data
    - data will never be passed directly to a plot - instead it will be globally accessible by a key
    - for now, assume data is stored in a global JSON object with `<key>: <data>` mappings
    - example: for a dataset with key `exposures_data`, the following prop would specify to a plot component that this dataset should be used:
        ```js
        data="exposures_data"
        ```
- [x] props should declare where to find the scales
    - [x] scales will be ES6 classes with different APIs depending on whether categorical, continuous, etc...
    - [x] scales will always expose a domain
    - [x] scales will always expose a domain-var-to-color function
    - [ ] the color scale (or even individual colors) should also be able to be changed programmatically
    - [ ] scales will always expose a domain-var-to-human-readable-text function
    - [ ] categorical scales will always expose a sort function that takes in a comparator function
    - [ ] scales will always expose a filter function (and a corresponding filter-reset function)
        - if categorical, this will accept an array of new values
        - if continuous, this will accept a `[min, max]` array
        - if binary, this will accept a boolean value
    - scales should contain all of the information necessary to draw a legend
    - scales will never be passed directly to a plot - instead they will be globally accessible by a key
    - for now, assume scales are stored in a global JSON object with `<variable>: <scale>` mappings
    - example: for a variable `sample_id`, the following prop would specify to a plot component that this scale object should be used for the x axis:
        ```js
        x="sample_id"
        ```
- [x] plots should assume which type of scale is on which axis
    - for example, a bar plot (with vertical bars) would assume a continuous y scale and a categorical x
- [ ] a global event bus should alert plots when a scale has been mutated
    - these alerts should specify which scale has been updated using a key
    - plot components should listen for these updates and re-draw if necessary
    - scales may be mutated upon filter or zoom
- [ ] data should be immutable
    - even small variations of data sets should be stored in a separate `DataContainer` instance
    - this way, plots are only concerned with subscribing (and then re-drawing) to scale updates
- [x] plots should NOT draw their own axes
    - axes should be independent of plots
    - axes should be contained in their own components
- [x] axes should accept props specifying which scale to use, and where to draw
    - example:
        ```js
        variable="sample_id"
        side="bottom"
        ```
- [x] axes should be brush-able
    - brushing along an axis should trigger a zoom event
    - axes, if their corresponding scale has been "zoomed", should display a "zoomed out"/full view beside the "zoomed-in" view in order to show [context](https://bl.ocks.org/mbostock/34f08d5e11952a80609169b7917d4172)
    - categorical axes should [snap](https://bl.ocks.org/mbostock/6232537)
- [x] plots and axes should accept `width` and `height` props
    - container components should be responsible for keeping plot and axis props in sync if they are dynamic
    - example:
        ```js
        :pWidth="windowWidth"
        :pHeight="300"
        ```
- [x] plots should accept margin props
    - container components should be responsible for keeping margin props in sync if they are dynamic
    - example:
        ```js
        :pMarginTop="10"
        :pMarginLeft="50"
        :pMarginRight="20"
        :pMarginBottom="0"
        ```
- [ ] plots should emit click events, specifying variables in a predefined order to a prop-supplied callback
    - example:
    ```js
    @click="chooseSample" // will be called with chooseSample(x, y, c) if the predefined ordering is [x, y, c]
    ```
- [x] plots should have tooltips
    - tooltips should obtain human-readable variable names from the appropriate scale
- [ ] plots should dispatch applicable hover events
    - dispatching should be done through the scale
    - example:
        - hovering on a section of a bar on a stacked bar plot would cause dispatches for (at least) the `x` and `color` variables
- [x] the internals of the drawing of the plots should be abstracted away as much as possible
    - details of SVG, canvas, etc. implementation should be contained
