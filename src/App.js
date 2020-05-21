import React, { useState, useEffect, useRef } from "react";
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
  const [showIssueNotes, setShowIssueNotes] = useState(false);
  const { methods: { addCacheSnapshotToLog }, components: { SnapshotLogViewer } } = useCacheSnapshots({ client });
  const { loading, data } = useQuery(ALL_PEOPLE);

  const nextUserIdRef = useRef();
  useEffect(() => { nextUserIdRef.current = 4; }, []);

  //
  const fetchPeople = (fetchPolicy = "cache-only") => {
    return client.query({ query: ALL_PEOPLE, fetchPolicy }).then(result => {
      return result.data.people;
    });
  };

  //
  const createNewPersonQuery = () => {
    fetchPeople().then((people) => {
      const newData = { people: [...people, { __typename: 'Person', id: `${nextUserIdRef.current}`, name: `New Person ${nextUserIdRef.current}`, serverTime: new Date().toLocaleTimeString() }] };
      nextUserIdRef.current += 1;
      console.log('writeQuery. newData', newData);
      client.writeQuery({ query: ALL_PEOPLE, data: newData, });
      addCacheSnapshotToLog(`createNewPersonQuery`);
    })
  }

  //
  const createNewPersonWithMissingFieldQuery = () => {
    fetchPeople().then((people) => {
      const newData = { people: [...people, { __typename: 'Person', id: `${nextUserIdRef.current}`, name: `New Person ${nextUserIdRef.current}` }] };
      nextUserIdRef.current += 1;
      console.log('writeQuery. newData', newData);
      client.writeQuery({ query: ALL_PEOPLE, data: newData, });
      addCacheSnapshotToLog(`createNewPersonWithMissingFieldQuery`);
    })
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

      <h3>Users</h3>
      {!data || !data.people ? (<p>No People Loaded</p>) : (
        <ul>
          {data.people.map(personItem => (
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
      If data missing from an object in query results:
      <ul>
        <li>The query continues to return the objects that have all the expected fields</li>
        <li>An error or warning for the omitted objects with the missing fields</li>
      </ul>
      <h3>Actual Behavior</h3>
      <ul>
        <li>As soon as a results object has a missing field, the entire query stops updating</li>
        <li>No error or warning seems to be available indicating the missing fields</li>
      </ul>
      < h3 > Reproduction Steps</h3 >
      <ol>
        <li>Click "Create New Person (all fields)" button - observe the results updating</li>
        <li>Click "Create New Person (missing field)" button - observe the previously added results disappearing, and not 'missing field' error message displaying in the console</li>
      </ol>
    </>
  );
}
