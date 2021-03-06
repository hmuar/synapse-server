import { gifSuccessProb } from '~/core/hyperparam';
import AdapterFB from '~/adapter/fbmessenger/fbmessenger';
import { EvalStatus } from '~/core/eval';
import sendResp, { sendFeedbackResp } from './webclient_response';

const senderToUser = AdapterFB.senderToUser;
const createUser = AdapterFB.createUser;
const parse = AdapterFB.parse;

function evalSuccess(state) {
  return state && state.evalCtx && state.evalCtx.status === EvalStatus.SUCCESS;
}

function sendResponse(state) {
  return sendResp(state);
}

function sendFeedbackResponse(state) {
  if (!evalSuccess(state)) {
    return state;
  }
  const withSuccessMedia = Math.random() < gifSuccessProb;
  return sendFeedbackResp(state, withSuccessMedia);
}

const AdapterWebClient = {
  senderToUser,
  createUser,
  parse,
  sendResponse,
  sendFeedbackResponse,
};

export default AdapterWebClient;
