import { gql, useQuery } from "@apollo/client";
import React, { useEffect, useRef, useState } from "react";
import { IssueNotes } from "./components/IssueNotes";
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
  const { loading, data: useQueryOriginatedData } = useQuery(ALL_PEOPLE);
  const nextNamePostfixNumber = useRef();
  const nextUserIdRef = useRef();

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

  useEffect(() => {
    nextNamePostfixNumber.current = 1;
    nextUserIdRef.current = 4;
  }, [])

  return (
    <main>
      <h1>Notes</h1>
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

      <h3>Users (useQuery originated data)</h3>
      {!useQueryOriginatedData || !useQueryOriginatedData.people ? (<p>No People Loaded</p>) : (
        <ul>
          {useQueryOriginatedData.people.map(personItem => (
            <li key={personItem.id}>
              {personItem.name}
            </li>
          ))}
        </ul>
      )}

      <SnapshotLogViewer />

      <h3>Actions</h3>
      <div>
        <div style={{ padding: 5 }}>
          <button onClick={() => createNewPersonQuery()}>Create New Person</button>
        </div>
      </div>
    </main>
  );
}


