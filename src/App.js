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
  const updatePersonName = ({ id, name }) => {
    console.log('writeFragment');
    client.writeFragment({ fragment: PERSON_FRAGMENT, id: defaultDataIdFromObject({ __typename: 'Person', id }), data: { name } });
  }

  const updatePersonNameSilently = ({ id, name }) => {
    console.log('writeFragment');
    client.cache.writeFragment({ fragment: PERSON_FRAGMENT, id: defaultDataIdFromObject({ __typename: 'Person', id }), data: { name } });
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

  const startQueryWatch = (query) => {
    client.cache.watch({
      query,
      optimistic: false,
      callback: (data) => {
        console.log('CACHE WATCH QUERY CALLBACK - ALL_PEOPLE', data);
      },
    });

    const watchedQuery = client.watchQuery({
      query,
    })
    watchedQuery.subscribe(next => console.log(`CLIENT WATCH QUERY CALLBACK - ALL_PEOPLE`, next, watchedQuery));

    console.log('Started Query Watch for Query', ALL_PEOPLE);
  }

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

      <h3>Users</h3>
      {!data || !data.people ? (<p>No People Loaded</p>) : (
        <ul>
          {data.people.map(personItem => (
            <li key={personItem.id}>
              {personItem.name}
              <button onClick={() => updatePersonName({ id: personItem.id, name: personItem.name + '-' })}>Person Name Update</button>
              <button onClick={() => updatePersonNameSilently({ id: personItem.id, name: personItem.name + '-' })}>Person Name Silent Update</button>
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
        <div style={{ padding: 5 }}>
          <button onClick={() => startQueryWatch(ALL_PEOPLE)}>Start Query Watch - ALL_PEOPLE</button>
        </div>
      </div>
    </main>
  );
}


