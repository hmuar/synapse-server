import { updateSessionForUser } from '~/db/session_assistant';

// Returns promise
export default function pipe(appState) {
  const { userID, subjectID } = appState;
  const { queueIndex, noteQueue, state, globalIndex } = appState.session;
  return updateSessionForUser(userID,
                              subjectID,
                              queueIndex,
                              noteQueue,
                              state,
                              globalIndex)
        .then(() => appState);
}