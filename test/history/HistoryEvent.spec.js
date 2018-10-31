import HistoryEvent from '../../src/history/HistoryEvent';
import { EVENT_TYPES } from '../../src/history/base-events';

test('able to create a HistoryEvent', () => {
    let event = new HistoryEvent(EVENT_TYPES.SCALE, "sample_id", "zoom", [2, 5]);
    expect(event.type).toBe(EVENT_TYPES.SCALE);
    expect(event.id).toBe("sample_id");
    expect(event.action).toBe("zoom");
    expect(event.params.length).toBe(2);
    expect(event.params[0]).toBe(2);
    expect(event.params[1]).toBe(5);
});

test('able to check for a related HistoryEvent', () => {
    let event = new HistoryEvent(EVENT_TYPES.SCALE, "sample_id", "zoom", [2, 5]);
    let other = new HistoryEvent(EVENT_TYPES.SCALE, "sample_id", "filter", [[6, 7, 8, 9]]);
    expect(event.isRelated(other)).toBe(true);
});

test('able to check for a non-related HistoryEvent', () => {
    let event = new HistoryEvent(EVENT_TYPES.SCALE, "sample_id", "zoom", [2, 5]);
    let other = new HistoryEvent(EVENT_TYPES.SCALE, "signature", "filter", [[6, 7, 8, 9]]);
    expect(event.isRelated(other)).toBe(false);
});

test('can serialize HistoryEvent using toJson method', () => {
    let event = new HistoryEvent(EVENT_TYPES.SCALE, "sample_id", "zoom", [2, 5]);
    let eventJson = JSON.stringify(event.toJson());
    let expectedJson = JSON.stringify({
        "type": EVENT_TYPES.SCALE,
        "id": "sample_id",
        "action": "zoom",
        "params": [2, 5]
    })
    expect(eventJson).toBe(expectedJson);
});