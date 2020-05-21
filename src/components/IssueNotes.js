import React from "react";
export function IssueNotes() {
    return (<>
        <h3>Expected Behavior</h3>
        <p>ApolloClient.writeFragment and ApolloCache.writeQuery to have the same behavior</p>
        <h3>Actual Behavior</h3>
        <p>ApolloClient.writeFragment updates are reflected in the Apollo Dev Tools client, whereas ApolloCache.writeFragment updates are not </p>
        <h3> Reproduction Steps</h3>
        <p>
            <ol>
                <li>Click 'Create New Person' button (to initialize the cache)</li>
                <li>Open Apollo Dev Tools, and select Cache -> 'Person 1' to view the JSON contents</li>
                <li>Click 'Client Update' button next to the first person in the list (John Smith). Observe that 'Person 1' contents update in the Apollo Dev Tools client </li>
                <li>Click 'Cache Update' button. Observe the 'Person 1' contents do not update in the Apollo Dev Tools client </li>
            </ol>
        </p>
    </>);
}
