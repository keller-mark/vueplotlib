import { dispatch as d3_dispatch } from "d3-dispatch-nosplit";

const DISPATCH_RECEIVED_EXPECTED_DATA = "received-expected-data";

/** 
 * Represents an object on which an external consumer 
 * may await data from a particular source.
 * 
 * Schema for emitted data payloads:
 * {
 *   "data": {
 *     "my-dataset-id": <some data to pass to a DataContainer>,
 *     ...
 *   },
 *   "scales": {
 *     "my-scale-id": <some data to pass to a scale class>,
 *     ...
 *   }
 * }
 */
export default class Expected {

    /**
     * Create an expected data source object.
     */
    constructor() {
        this._dispatch = d3_dispatch(DISPATCH_RECEIVED_EXPECTED_DATA);
    }

    /**
     * Called by an external data provider that receives data.
     */
    emitData(data) {
        this._dispatch.call(DISPATCH_RECEIVED_EXPECTED_DATA, null, data);
    }

    /**
     * Subscribe to emitted data updates from this data source.
     * @param {string} receiverType The class name of the subscriber, e.g. DataContainer or CategoricalScale
     * @param {string} receiverId The id of the subscriber, e.g. proj_id or age
     * @param {Function} callback The function to call when emitting received data.
     */
    onData(receiverType, receiverId, callback) {
        this._dispatch.on(DISPATCH_RECEIVED_EXPECTED_DATA + "." + "type-" + receiverType + ",id-" + receiverId, callback);
    }
}