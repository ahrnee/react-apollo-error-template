import React, { useState, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";

const PERSON_FRAGMENT = gql`
  fragment PersonFragment on Person {
    id
    name
    serverTime
    #clientObject @client(always: true)
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

const ONE_PERSON = gql`
  query OnePerson($id: ID) {
    person(id: $id) {
      ...PersonFragment
    }
  }
  ${PERSON_FRAGMENT}
`;

export default function App({ client }) {
  const [people, setPeople] = useState(null);
  const [person, setPerson] = useState(null);
  const [cacheLog, setCacheLog] = useState({ snapshots: [] });
  const [showCacheLog, setShowCacheLog] = useState(false);
  const [showIssueNotes, setShowIssueNotes] = useState(false);
  const [userMessage, setUserMessage] = useState(null);

  //
  const evitFieldFromCache = (key, field) => {
    client.cache.evict(key, field);
    addCacheSnapshotToLog(`after ${key} ${field} evict`);
    setUserMessage(`${key} ${field} evicted`);
  };

  //
  const fetchPeople = (fetchPolicy = "cache-first") => {
    client.query({ query: ALL_PEOPLE, fetchPolicy }).then(result => {
      setPeople(result.data.people);
      addCacheSnapshotToLog(`fetch (${fetchPolicy})`);
    });
    setUserMessage(`ALL_PEOPLE fetch (${fetchPolicy}) executed`);
  };

  //
  const fetchOnePerson = (id, fetchPolicy = "cache-first") => {
    client.query({ query: ONE_PERSON, variables: { id }, fetchPolicy }).then(result => {
      setPerson(result.data.person);
      addCacheSnapshotToLog(`fetch (${fetchPolicy})`);
    });
    setUserMessage(`ONE_PERSON fetch (${fetchPolicy}) executed`);
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
      {!people ? (<p>No People Loaded</p>) : (
        <ul>
          {people.map(personItem => (
            <li key={personItem.id}>
              {personItem.name} ( <span style={{ color: "blue" }}>Server Time: <b>{personItem.serverTime}</b></span>, <span style={{ color: "green" }}>Client Time: <b>{/* personItem.clientObject.clientTime */}</b></span> )
            </li>
          ))}
        </ul>
      )}

      <h3>Person</h3>
      {!person || !person.id ? (<p>No Person Loaded</p>) : (
        <ul>
          <li key={person.id}>
            {person.name} ( <span style={{ color: "blue" }}>Server Time: <b>{person.serverTime}</b></span>, <span style={{ color: "green" }}>Client Time: <b>{/* person.clientObject.clientTime */}</b></span> )
            </li>
        </ul>
      )}

      <h3> Cache Snapshots Log (<a onClick={e => { e.preventDefault(); setShowCacheLog(!showCacheLog); }} href="#">Toggle Display</a>)</h3>
      {showCacheLog && <pre style={{ border: "solid 1px #888", width: 500, height: 200, overflowY: "scroll" }}>{JSON.stringify(cacheLog, null, 2)}</pre>}
      <h3>Actions</h3>
      <div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetchOnePerson(1, "cache-first")}>2. Run ONE_PERSON Query (cache-first)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => { evitFieldFromCache("Person:2", "clientObject"); }}          >
            1. Evict clientObject field on Person 2
          </button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetchPeople("cache-first")}>2. Run ALL_PEOPLE Query (cache-first)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => fetchPeople("cache-only")}>3. Run ALL_PEOPLE Query (cache-only)</button>
        </div>
      </div>
    </main>
  );
}

function IssueNotes() {
  return (
    <>
      <h3>Expected Behavior</h3>
      TBD
      <h3>Actual Behavior</h3>
      TBD
      <h3>Reproduction Steps</h3>
      <ol>
        <li>TBD.</li>
      </ol>
      <h3>Notes</h3>
      <p>
        TBD
      </p>
    </>
  );
}
