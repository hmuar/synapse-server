import { SessionState, getEntryStateForNoteType } from '~/core/session_state';
import { getNextNotes, TARGET_NUM_NOTES_IN_SESSION } from '~/core/scheduler';
import { EvalStatus, isFailResponse } from '~/core/eval';

// Given current info in app state, determine next study state for user.
// Only need to look at current session state to determine next state.

// set current app state as the pre eval state
function setPreEvalState(appState) {
  if (!appState.session || !appState.session.state) {
    return appState;
  }
  return {
    ...appState,
    preEvalState: appState.session.state,
  };
}

function isValidEval(appState) {
  if (!appState || !appState.evalCtx) {
    return false;
  }
  return appState.evalCtx.status !== EvalStatus.INVALID;
}

function setPostEvalState(appState) {
  if (!appState.session || !appState.session.state || !appState.evalCtx) {
    return appState;
  }

  const sessionState = appState.session.state;
  let postEvalState = sessionState;
  const validEval = isValidEval(appState);

  switch (sessionState) {
    case SessionState.INTRO:
    case SessionState.INIT:
      if (validEval) {
        postEvalState = SessionState.START_QUEUE;
      }
      break;
    case SessionState.RECALL:
      if (validEval) {
        postEvalState = SessionState.RECALL_RESPONSE;
      }
      break;
    case SessionState.DONE_QUEUE:
      if (validEval) {
        const { evalCtx, } = appState;
        postEvalState = isFailResponse(evalCtx.answerQuality)
          ? SessionState.DONE_QUEUE
          : SessionState.START_NEW_SESSION;
      }
      break;
    case SessionState.SHOW_PATHS:
    case SessionState.INFO:
    case SessionState.INPUT:
    case SessionState.RECALL_RESPONSE:
    case SessionState.MULT_CHOICE:
      if (validEval) {
        // if min quality response, check for possible note paths
        // if (isFailResponse(appState.evalCtx.answerQuality)) {
        //   const paths = getPaths(appState.session);
        //   postEvalState = paths ? SessionState.SHOW_PATHS : SessionState.WAIT_NEXT_IN_QUEUE;
        // } else {
        postEvalState = SessionState.WAIT_NEXT_IN_QUEUE;
        // }
      }
      break;
    default:
      break;
  }

  return {
    ...appState,
    postEvalState,
  };
}

// if postEvalState === WAIT_NEXT_IN_QUEUE, need to advance noteQueue, next state
function advanceState(appState) {
  if (!appState) {
    return appState;
  }

  // if necessary, advance queueIndex
  // set proper next state based on next note
  if (appState.session && appState.postEvalState) {
    if (appState.postEvalState === SessionState.DONE_QUEUE) {
      const { evalCtx, } = appState;
      const { correctAnswer, } = evalCtx;
      return Promise.resolve({
        ...appState,
        session: {
          ...appState.session,
          remainingWaitHours: correctAnswer.remainingWaitHours,
        },
      });
    }

    if (appState.postEvalState === SessionState.START_NEW_SESSION) {
      // update note queue
      // update queueIndex
      // update globalIndex

      const { evalCtx, } = appState;
      const { cutoffDate, } = evalCtx.correctAnswer;
      const { userID, subjectID, } = appState;
      const nextGlobalIndex = appState.session.nextGlobalIndex;

      return getNextNotes(
        userID,
        subjectID,
        nextGlobalIndex,
        TARGET_NUM_NOTES_IN_SESSION,
        cutoffDate
      ).then(notesInfo => {
        const nextNotes = notesInfo.notes;
        if (nextNotes && nextNotes.length > 0) {
          return {
            ...appState,
            // postEvalState: null,
            session: {
              ...appState.session,
              noteQueue: nextNotes,
              queueIndex: 0,
              globalIndex: notesInfo.globalIndex,
              nextGlobalIndex: notesInfo.nextGlobalIndex,
              baseQueueLength: nextNotes.length,
              state: getEntryStateForNoteType(nextNotes[0].type),
            },
          };
        }
        // no new notes exist, user has finished everything.
        return appState;
      });
    }

    if (
      appState.postEvalState === SessionState.WAIT_NEXT_IN_QUEUE ||
      appState.postEvalState === SessionState.START_QUEUE
    ) {
      const { queueIndex, noteQueue, } = appState.session;
      let nextSessionState = appState.postEvalState;
      let nextQueueIndex = queueIndex;

      let transitionFromPathToMain = false;

      if (noteQueue && queueIndex != null) {
        // only advance queue if waiting for next in queue
        // (e.g. shouldn't advance note if we are just START_QUEUE)
        if (appState.postEvalState === SessionState.WAIT_NEXT_IN_QUEUE) {
          nextQueueIndex = queueIndex + 1;
        }
        if (nextQueueIndex < noteQueue.length) {
          const nextNote = noteQueue[nextQueueIndex];
          nextSessionState = getEntryStateForNoteType(nextNote.type);
          if (noteQueue[queueIndex].addedFromPath && !noteQueue[nextQueueIndex].addedFromPath) {
            transitionFromPathToMain = true;
          }
        } else {
          nextSessionState = SessionState.DONE_QUEUE;
        }
      }

      return {
        ...appState,
        transitionFromPathToMain,
        session: {
          ...appState.session,
          queueIndex: nextQueueIndex,
          state: nextSessionState,
          lastCompleted: nextSessionState === SessionState.DONE_QUEUE
            ? new Date()
            : appState.session.lastCompleted,
        },
      };
    }

    if (appState.postEvalState) {
      return {
        ...appState,
        session: {
          ...appState.session,
          state: appState.postEvalState,
        },
      };
    }
  }

  return appState;
}

export default function pipe(appState) {
  let nextAppState = setPreEvalState(appState);
  nextAppState = setPostEvalState(nextAppState);
  nextAppState = advanceState(nextAppState);
  return nextAppState;
}
