import React, { useState, useEffect } from "react";

export function useCacheSnapshots({ client }) {

    const [cacheLog, setCacheLog] = useState({ snapshots: [] });
    const [showCacheLog, setShowCacheLog] = useState(false);

    const addCacheSnapshotToLog = message => {
        const cacheDisplayItem = {
            message,
            snapshotTime: new Date().toLocaleTimeString(),
            cacheContents: client.cache.extract(),
            delimiter: "-------------------------------------------"
        };

        setCacheLog({ ...cacheLog, snapshots: [cacheDisplayItem, ...cacheLog.snapshots] });
    };

    const SnapshotLogViewer = () => <>
        <h3> Cache Snapshots Log (<a onClick={e => { e.preventDefault(); setShowCacheLog(!showCacheLog); }} href="#">Toggle Display</a>)</h3>
        {showCacheLog && <pre style={{ border: "solid 1px #888", width: 500, height: 200, overflowY: "scroll" }}>{JSON.stringify(cacheLog, null, 2)}</pre>}
    </>;

    return { methods: { addCacheSnapshotToLog }, components: { SnapshotLogViewer } }
}