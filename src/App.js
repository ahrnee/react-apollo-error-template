import React, { useState, useEffect, useRef } from "react";
import { gql, useQuery, defaultDataIdFromObject } from "@apollo/client";
import { useCacheSnapshots } from "./helpers/useCacheSnapshots";
import { IssueNotes } from "./components/IssueNotes";

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

  const getUpdatedPersonName = (id) => {
    const personCacheId = defaultDataIdFromObject({ __typename: 'Person', id });
    const person = client.cache.readFragment({ fragment: PERSON_FRAGMENT, id: personCacheId });
    const updatedName = `${person.name} ${nextNamePostfixNumber.current}`;

    nextNamePostfixNumber.current++;

    return updatedName;
  }

  //
  const updatePersonNameViaClient = ({ id }) => {
    client.writeFragment({ fragment: PERSON_FRAGMENT, id: defaultDataIdFromObject({ __typename: 'Person', id }), data: { name: getUpdatedPersonName(id) } });
    addCacheSnapshotToLog(`updatePersonNameOnCache`);
  }

  //
  const updatePersonNameViaCache = ({ id }) => {
    client.cache.writeFragment({ fragment: PERSON_FRAGMENT, id: defaultDataIdFromObject({ __typename: 'Person', id }), data: { name: getUpdatedPersonName(id) } });
    addCacheSnapshotToLog(`updatePersonNameOnCache`);
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
              {personItem.name}:
              <button onClick={() => updatePersonNameViaClient({ id: personItem.id })}>Client Update</button>
              <button onClick={() => updatePersonNameViaCache({ id: personItem.id })}>Cache Update</button>
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


