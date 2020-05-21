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
  const [watchQueryOriginatedData, setWatchQueryOriginatedData] = useState();
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

  //
  const updatePersonNameOnCache = ({ id, name }) => {
    console.log('updatePersonNameOnCache', { id, name });
    client.cache.writeFragment({ fragment: PERSON_FRAGMENT, id: defaultDataIdFromObject({ __typename: 'Person', id }), data: { name } });
    nextNamePostfixNumber.current++;
  }

  //
  const updatePersonNameOnCachNoBroadcast = ({ id, name }) => {
    console.log('updatePersonNameOnCachNoBroadcast', { id, name });
    client.cache.writeFragment({ fragment: PERSON_FRAGMENT, id: defaultDataIdFromObject({ __typename: 'Person', id }), data: { name }, broadcast: false });
    nextNamePostfixNumber.current++;
  }

  //
  const initQueryWatch = () => {
    const watchedQuery = client.watchQuery({ query: ALL_PEOPLE });
    watchedQuery.subscribe(next => {
      setWatchQueryOriginatedData(next?.data);
      console.log(`CLIENT WATCH QUERY CALLBACK - ALL_PEOPLE`, next)
    });
    console.log('Started Query Watch for Query', ALL_PEOPLE);
  }

  useEffect(() => {
    initQueryWatch();
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
              <button onClick={() => updatePersonNameOnCache({ id: personItem.id, name: personItem.name + ` ${nextNamePostfixNumber.current}` })}>Update name via cache</button>
              <button onClick={() => updatePersonNameOnCachNoBroadcast({ id: personItem.id, name: personItem.name + ` ${nextNamePostfixNumber.current}` })}>Update name via cache (no broadcast)</button>
            </li>
          ))}
        </ul>
      )}

      <h3>Users (watchQuery originated data)</h3>
      {!watchQueryOriginatedData || !watchQueryOriginatedData.people ? (<p>No People Loaded</p>) : (
        <ul>
          {watchQueryOriginatedData.people.map(personItem => (
            <li key={personItem.id}>
              {personItem.name}:
              <button onClick={() => updatePersonNameOnCache({ id: personItem.id, name: personItem.name + ` ${nextNamePostfixNumber.current}` })}>Update name via cache</button>
              <button onClick={() => updatePersonNameOnCachNoBroadcast({ id: personItem.id, name: personItem.name + ` ${nextNamePostfixNumber.current}` })}>Update name via cache (no broadcast)</button>
            </li>
          ))}
        </ul>
      )}

      <h3>Actions</h3>
      <div>
        <div style={{ padding: 5 }}>
          <button onClick={() => createNewPersonQuery()}>Create New Person (all fields)</button>
        </div>
      </div>
    </main>
  );
}


