import React from "react";
export function IssueNotes() {
    return (<>
        <h3>Expected Behavior</h3>
        <p>Apollo Dev Tools client, Query Tab, Works</p>
        <h3>Actual Behavior</h3>
        <p>Apollo Dev Tools client, Query Tab, is broken (as of AC3 v3.0.0-beta.40)</p>
        <h3> Reproduction Steps</h3>
        <p>
            <ol>
                <li>Open Apollo Dev Tools</li>
                <li>View Query Tab</li>
                <li>Click 'Create New Person' button, to initiate query</li>
                <li>Observe the entire Apollo Dev Tools tab (disappear) </li>
            </ol>
        </p>
    </>);
}
