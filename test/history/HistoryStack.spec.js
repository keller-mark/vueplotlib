import HistoryEvent from '../../src/history/HistoryEvent';
import HistoryStack, { computedParam } from '../../src/history/HistoryStack';
import CategoricalScale from '../../src/scales/CategoricalScale';
import DataContainer from '../../src/data/DataContainer';
import { EVENT_SUBTYPES } from '../../src/history/base-events';

let getScale;
let getData;
let sampleScale;
let sampleData;
beforeEach(() => {
    sampleScale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    getScale = () => sampleScale;

    sampleData = [
        {
            "sample_id": "S1",
            "age": 3
        },
        {
            "sample_id": "S2",
            "age": 2
        },
        {
            "sample_id": "S3",
            "age": 10
        },
        {
            "sample_id": "S4",
            "age": 1
        },
        {
            "sample_id": "S5",
            "age": 5
        }
    ];

    let sampleDataContainer = new DataContainer("sample_data", "Sample Data", sampleData);

    getData = () => sampleDataContainer;
});

test('able to create a HistoryStack', () => {
    let stack = new HistoryStack(getScale);
    expect(stack.isEmpty()).toBe(true);
    expect(stack.canGoBack()).toBe(false);
    expect(stack.canGoForward()).toBe(false);
});

test('able to push onto a HistoryStack', () => {
    let stack = new HistoryStack(getScale);
    let event = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "zoom", [2, 5]);
    stack.push(event);
    expect(stack.isEmpty()).toBe(false);
    expect(stack.canGoBack()).toBe(true);
    expect(stack.canGoForward()).toBe(false);
});

test('able to pop off of a HistoryStack', () => {
    let stack = new HistoryStack(getScale);
    let event = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "zoom", [2, 5]);
    stack.push(event);
    expect(stack.isEmpty()).toBe(false);
    expect(stack.canGoBack()).toBe(true);
    expect(stack.canGoForward()).toBe(false);
    stack.pop();
    expect(stack.isEmpty()).toBe(true);
    expect(stack.canGoBack()).toBe(false);
    expect(stack.canGoForward()).toBe(false);
});

test('able to get previous related event from HistoryStack', () => {
    let stack = new HistoryStack(getScale);
    let e1 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "zoom", [2, 5]);
    let e2 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "signatures", "filter", [[0, 1]]);
    let e3 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "zoom", [1, 5]);
    stack.push(e1);
    stack.push(e2);
    stack.push(e3);
    let prev = stack.getPrevRelated(e3, stack._pointer);
    expect(prev.type).toBe(EVENT_TYPES.SCALE);
    expect(prev.id).toBe("sample_id");
    expect(prev.action).toBe("zoom");
    expect(prev.params.length).toBe(2);
    expect(prev.params[0]).toBe(2);
    expect(prev.params[1]).toBe(5);
});

test('able to execute event, go back and go forward', () => {
    let stack = new HistoryStack(getScale);

    sampleScale.zoom(2, 5);
    let e1 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "zoom", [2, 5]);
    expect(sampleScale.domainFiltered.length).toBe(3);
    stack.push(e1);

    sampleScale.filter([0, 1]);
    let e2 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "signatures", "filter", [[0, 1]]);
    expect(sampleScale.domainFiltered.length).toBe(2);
    stack.push(e2);

    sampleScale.zoom(1, 5);
    let e3 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "zoom", [1, 5]);
    expect(sampleScale.domainFiltered.length).toBe(4);
    stack.push(e3);

    expect(stack.canGoBack()).toBe(true);
    stack.goBack();
    expect(sampleScale.domainFiltered.length).toBe(3);

    expect(stack.canGoForward()).toBe(true);
    stack.goForward();
    expect(sampleScale.domainFiltered.length).toBe(4);

});

test('able to get computedParam JSON object', () => {
    let cp = computedParam("getData", ["my_data"])
    
    expect(cp).toHaveProperty("$vdp_val_from_getter");
    expect(cp).toHaveProperty("getterFunction");
    expect(cp).toHaveProperty("getterParams");
});

test('able to execute event with computed parameter', () => {
    let stack = new HistoryStack(getScale, getData);

    let e0 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "reset");
    stack.push(e0, true);

    expect(sampleScale.domain).toEqual(sampleScale.domainFiltered);
    expect(sampleScale.domainFiltered).toEqual(["S1", "S2", "S3", "S4", "S5", "S6"]);
    
    // Sort by age ascending, store in stack
    sampleScale.sort(getData(), "age", true);
    let e1 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "sort", [computedParam("getData", []), "age", true]);
    stack.push(e1);

    expect(sampleScale.domain).toEqual(sampleScale.domainFiltered);
    expect(sampleScale.domainFiltered).toEqual(["S6", "S4", "S2", "S1", "S5", "S3"]);

    // Sort by age descending, store in stack
    sampleScale.sort(getData(), "age", false);
    let e2 = new HistoryEvent(EVENT_TYPES.SCALE, EVENT_SUBTYPES.SCALE_DOMAIN_FILTER, "sample_id", "sort", [computedParam("getData", []), "age", false]);
    stack.push(e2);

    expect(sampleScale.domain).toEqual(sampleScale.domainFiltered);
    expect(sampleScale.domainFiltered).toEqual(["S3", "S5", "S1", "S2", "S4", "S6"]);

    // Go back and forward, check resulting domain orderings

    // Back to ascending
    expect(stack.canGoBack()).toBe(true);
    stack.goBack();
    expect(sampleScale.domain).toEqual(sampleScale.domainFiltered);
    expect(sampleScale.domainFiltered).toEqual(["S6", "S4", "S2", "S1", "S5", "S3"]);

    // Forward to descending
    expect(stack.canGoForward()).toBe(true);
    stack.goForward();
    expect(sampleScale.domain).toEqual(sampleScale.domainFiltered);
    expect(sampleScale.domainFiltered).toEqual(["S3", "S5", "S1", "S2", "S4", "S6"]);

    // Back twice to original "reset" ordering
    expect(stack.canGoBack()).toBe(true);
    stack.goBack();
    expect(stack.canGoBack()).toBe(true);
    stack.goBack();
    expect(sampleScale.domain).toEqual(sampleScale.domainFiltered);
    expect(sampleScale.domainFiltered).toEqual(["S1", "S2", "S3", "S4", "S5", "S6"]);

});