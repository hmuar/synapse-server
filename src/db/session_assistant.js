import { StudentSession } from '../db/collection';
import { getStartState } from '../core/session_state';

// Return a session if user exists and they have a session already for
// `subjectID` subject.
// --------------------------------
// TODO: need to handle case where user exists, but subject does not better.
// Right now we are hitting the db more than we need to.

function getSessionForUserAndSubject(userID, subjectID) {
  return StudentSession.findOne({ userID }).then((session) => {
    if (session) {
      const subjects = session.subjects;
      const subjectIDString = subjectID.valueOf();
      if (subjects && subjectIDString in subjects) {
        return subjects[subjectIDString];
      }
      // TODO: should return entire session here
      //       so that we can use it to update subjects later,
      //       instead of having to query for session again.
      return null;
    }
    return null;
  });
}

// return Promise
function updateSessionForUser(userID,
                              subjectID,
                              queueIndex,
                              noteQueue,
                              state,
                              conceptGlobalIndex) {
  return StudentSession.findOne({ userID }).then((session) => {
    const subjectIDString = subjectID.valueOf();
    const subjects = session.subjects;

    subjects[subjectIDString] = {
      queueIndex,
      noteQueue,
      state,
      globalIndex: conceptGlobalIndex,
    };

    return StudentSession.findByIdAndUpdate(session._id, {
      $set: { subjects },
    });
  });
}

function createSession(userID,
                       subjectID,
                       queueIndex,
                       noteQueue,
                       conceptGlobalIndex) {
  const conceptIndex = conceptGlobalIndex || 0;

  return StudentSession.findOne({ userID }).then((session) => {
    const subjectIDString = subjectID.valueOf();

    let subjects = {};
    if (!session) {
      subjects = {
        [subjectIDString]: {
          queueIndex: 0,
          noteQueue,
          state: getStartState(),
          globalIndex: conceptIndex,
        },
      };
      const newSession = {
        userID,
        subjects,
      };
      return StudentSession.create(newSession).then(() => (
        subjects[subjectIDString]
      ));
    }
    // session already exists, so need to return subject if exists,
    // and if not add to subjects array
    subjects = session.subjects;
    if (subjectIDString in subjects) {
      return subjects[subjectIDString];
    }
    subjects[subjectIDString] = {
      queueIndex: 0,
      noteQueue,
      state: getStartState(),
      globalIndex: conceptIndex,
    };
    return StudentSession.findByIdAndUpdate(session._id, {
      $set: { subjects },
    }).then(() => (
      subjects[subjectIDString]
    ));
  });
}

const SessionAssist = {
  getSessionForUserAndSubject,
  updateSessionForUser,
  createSession,
};

export default SessionAssist;