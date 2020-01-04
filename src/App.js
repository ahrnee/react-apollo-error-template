import React, { useState, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";

const PERSON_FRAGMENT = gql`
  fragment PersonFragment on Person {
    id
    name
    serverTime
    clientObject @client(always: true)
  }
`;

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      ...PersonFragment
    }
  }
  ${PERSON_FRAGMENT}
`;

export default function App({ client }) {
  //const { loading, data, client } = useQuery(ALL_PEOPLE);
  const [people, setPeople] = useState(null);
  const [cacheLog, setCacheLog] = useState({ snapshots: [] });
  const [showCacheLog, setShowCacheLog] = useState(false);
  const [showIssueNotes, setShowIssueNotes] = useState(true);
  const [userMessage, setUserMessage] = useState(null);

  //
  const evitFieldFromCache = (key, field) => {
    client.cache.evict(key, field);
    addCacheSnapshotToLog(`after ${key} ${field} evict`);
    setUserMessage(`${key} ${field} evicted`);
  };

  //
  const fetch = (fetchPolicy = "cache-first") => {
    client.query({ query: ALL_PEOPLE, fetchPolicy }).then(result => {
      setPeople(result.data.people);
      addCacheSnapshotToLog(`fetch (${fetchPolicy})`);
    });
    setUserMessage(`ALL_People fetch (${fetchPolicy}) executed`);
  };

  //
  const addCacheSnapshotToLog = message => {
    const cacheDisplayItem = {
      message,
      snapshotTime: new Date().toLocaleTimeString(),
      cacheContents: client.cache.extract(),
      delimiter: "-------------------------------------------"
    };

    setCacheLog({ ...cacheLog, snapshots: [cacheDisplayItem, ...cacheLog.snapshots] });
  };

  //
  useEffect(() => {
    fetch("cache-first");
  }, []);

  return (
    <main>
      <h1>Apollo Client Issue Reproduction</h1>
      <h2>
        Issue Notes (
        <a
          onClick={e => {
            e.preventDefault();
            setShowIssueNotes(!showIssueNotes);
          }}
          href="#"
        >
          Toggle Display
        </a>
        )
      </h2>
      {showIssueNotes && <IssueNotes />}
      <hr />
      <h2>Demo</h2>
      <h3>Messages</h3>
      {userMessage ? <div>{userMessage}</div> : <div>No Messages</div>}
      <h3>Names</h3>
      {!people ? (<p>Loading…</p>) : (
        <ul>
          {people.map(person => (
            <li key={person.id}>
              {person.name} ( <span style={{ color: "blue" }}>Server Time: <b>{person.serverTime}</b></span>, <span style={{ color: "green" }}>Client Time: <b>{person.clientObject.clientTime}</b></span> )
            </li>
          ))}
        </ul>
      )}
      <h3> Cache Snapshots Log (<a onClick={e => { e.preventDefault(); setShowCacheLog(!showCacheLog); }} href="#">Toggle Display</a>)</h3>
      {showCacheLog && <pre style={{ border: "solid 1px #888", width: 500, height: 200, overflowY: "scroll" }}>{JSON.stringify(cacheLog, null, 2)}</pre>}
      <h3>Actions</h3>
      <div>
        <div style={{ padding: 5 }}>
          <button onClick={() => { evitFieldFromCache("Person:2", "clientObject"); }}          >
            1. Evict clientObject field on Person 2
          </button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetch("cache-first")}>2. Run ALL_PEOPLE Query (cache-first)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetch("cache-only")}>3. Run ALL_PEOPLE Query (cache-only)</button>
        </div>
      </div>
    </main>
  );
}

function IssueNotes() {
  return (
    <>
      <h3>Expected Behavior</h3>
      On a 'cache-first' Query, missing @client(always: true) fields <i>do not</i> trigger remote (network) resolvers
      <h3>Actual Behavior</h3>
      On a 'cache-first' Query, missing @client(always: true) fields <i>do</i> trigger remote (network) resolvers
      <h3>Reproduction Steps</h3>
      <ol>
        <li>Click Actions - Button 1 (to evict clientObject field).</li>
        <li>Click Actions - Button 2 (to rerun the ALL_PEOPLE query.</li>
        <li>Observe the Server Time has updated for every Person, indicating a remote fetch was triggered</li>
      </ol>
      <h3>Notes</h3>
      <p>
        From the <a href="https://www.apollographql.com/docs/react/v3.0-beta/data/local-state/#client-side-schema">documentation</a>, I have not been able to
        tell if this is expected behaviour or not. However, if all requested data can be supplied by the client cache or client resolvers, it does not seem to
        make sense to trigger a remote request when using a 'cache-first' fetchPolicy{" "}
      </p>
    </>
  );
}
