import HistoryEvent from '../../src/history/HistoryEvent';
import HistoryStack from '../../src/history/HistoryStack';
import CategoricalScale from '../../src/scales/CategoricalScale';

let getScale;
let sampleScale;
beforeEach(() => {
    sampleScale = new CategoricalScale("sample_id", "Samples", ["S1", "S2", "S3", "S4", "S5", "S6"]);
    getScale = () => sampleScale;
});

test('able to create a HistoryStack', () => {
    let stack = new HistoryStack(getScale);
    expect(stack.isEmpty()).toBe(true);
    expect(stack.canGoBack()).toBe(false);
    expect(stack.canGoForward()).toBe(false);
});

test('able to push onto a HistoryStack', () => {
    let stack = new HistoryStack(getScale);
    let event = new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "zoom", [2, 5]);
    stack.push(event);
    expect(stack.isEmpty()).toBe(false);
    expect(stack.canGoBack()).toBe(true);
    expect(stack.canGoForward()).toBe(false);
});

test('able to pop off of a HistoryStack', () => {
    let stack = new HistoryStack(getScale);
    let event = new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "zoom", [2, 5]);
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
    let e1 = new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "zoom", [2, 5]);
    let e2 = new HistoryEvent(HistoryEvent.types.SCALE, "signatures", "filter", [[0, 1]]);
    let e3 = new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "zoom", [1, 5]);
    stack.push(e1);
    stack.push(e2);
    stack.push(e3);
    let prev = stack.getPrevRelated(e3, stack._pointer);
    expect(prev.type).toBe(HistoryEvent.types.SCALE);
    expect(prev.id).toBe("sample_id");
    expect(prev.action).toBe("zoom");
    expect(prev.params.length).toBe(2);
    expect(prev.params[0]).toBe(2);
    expect(prev.params[1]).toBe(5);
});

test('able to execute event, go back and go forward', () => {
    let stack = new HistoryStack(getScale);

    sampleScale.zoom(2, 5);
    let e1 = new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "zoom", [2, 5]);
    expect(sampleScale.domainFiltered.length).toBe(3);
    stack.push(e1);

    sampleScale.filter([0, 1]);
    let e2 = new HistoryEvent(HistoryEvent.types.SCALE, "signatures", "filter", [[0, 1]]);
    expect(sampleScale.domainFiltered.length).toBe(2);
    stack.push(e2);

    sampleScale.zoom(1, 5);
    let e3 = new HistoryEvent(HistoryEvent.types.SCALE, "sample_id", "zoom", [1, 5]);
    expect(sampleScale.domainFiltered.length).toBe(4);
    stack.push(e3);

    expect(stack.canGoBack()).toBe(true);
    stack.goBack();
    expect(sampleScale.domainFiltered.length).toBe(3);

    expect(stack.canGoForward()).toBe(true);
    stack.goForward();
    expect(sampleScale.domainFiltered.length).toBe(4);

});