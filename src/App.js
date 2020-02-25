import React, { useState, useEffect } from "react";
import { gql, useQuery } from "@apollo/client";
import { useCacheSnapshots } from "./helpers/useCacheSnapshots";

const PERSON_FRAGMENT = gql`
  fragment PersonFragment on Person {
    id
    name
    serverTime
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
  const [people, setPeople] = useState(null);
  const [showIssueNotes, setShowIssueNotes] = useState(false);
  const [userMessage, setUserMessage] = useState(null);
  const { methods: { addCacheSnapshotToLog }, components: { SnapshotLogViewer } } = useCacheSnapshots({ client });

  //
  const fetchPeople = (fetchPolicy = "cache-first") => {
    setUserMessage(`ALL_PEOPLE fetch (${fetchPolicy}) executing`);
    return client.query({ query: ALL_PEOPLE, fetchPolicy }).then(result => {
      setPeople(result.data.people);
      addCacheSnapshotToLog(`fetch (${fetchPolicy})`);
      return result.data.people;
    });
  };

  //
  const createNewPersonQuery = () => {
    fetchPeople().then((people) => {
      const newData = { people: [...people, { __typename: 'Person', id: `${people.length + 1}`, name: `New Person ${people.length + 1}`, serverTime: new Date().toLocaleTimeString() }] };
      console.log('writeQuery. newData', newData);
      client.writeQuery({ query: ALL_PEOPLE, data: newData, });
    })
  }

  //
  const createNewPersonWithMissingFieldQuery = () => {
    fetchPeople().then((people) => {
      const newData = { people: [...people, { __typename: 'Person', id: `${people.length + 1}`, name: `New Person ${people.length + 1}`, serverTime: new Date().toLocaleTimeString() }] };
      console.log('writeQuery. newData', newData);
      client.writeQuery({ query: ALL_PEOPLE, data: newData, });
    })
  }

  //
  const createNewPersonFragment = ({ id, name }) => {
    console.log('writeFragment');
    client.writeFragment({ fragment: PERSON_FRAGMENT, id: id.toString(), data: { __typename: 'Person', name, serverTime: new Date().toLocaleTimeString() } });
  }

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
              {personItem.name} ( <span style={{ color: "blue" }}>Server Time: <b>{personItem.serverTime}</b></span> )
            </li>
          ))}
        </ul>
      )}

      <SnapshotLogViewer />

      <h3>Actions</h3>
      <div>
        <div style={{ padding: 5 }}>
          <button onClick={() => createNewPersonQuery()}>Create New Person (all fields)</button>
        </div>
        <div style={{ padding: 5 }}>
          <button onClick={() => createNewPersonWithMissingFieldQuery()}>Create New Person (missing field)</button>
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
