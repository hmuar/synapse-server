import { isFailResponse } from '~/core/eval';
import {
  intervalToMinutesFactor,
  intervalToSecondsFactor,
  maxIntervalDays
} from '~/core/hyperparam';

const minToMillisecFactor = 60000;
// const secToMillisecFactor = 1000;

const MAX_INTERVAL = maxIntervalDays;
// Calculate factor used to calculate spaced interval
// 'previousFactor' From 1.3 (hardest) to 2.5 (easiest)
// 'responseQuality' From 0 (worst) to 5 (best)
// Based on algorithm here: https://www.supermemo.com/english/ol/sm2.htm
function calcFactor(previousFactor, responseQuality) {
  // EF':=EF+(0.1-(5-q)*(0.08+(5-q)*0.02))
  // User shouldn't update factor if answer is low quality
  let q = Math.min(responseQuality, 5);
  q = Math.max(q, 0);
  let newFactor = previousFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)); // eslint-disable-line
  newFactor = Math.max(newFactor, 1.3);
  return newFactor;
}

function intervalAttenuation(interval) {
  return interval;
}

// Interval used for spaced repetition
// `prevInterval` - Interval in days
// `count` - Number of times content has been viewed
// return new interval in days
// Based on algorithm here: https://www.supermemo.com/english/ol/sm2.htm
function calcIntervalCore(prevInterval, factor, count) {
  let interval = 0;
  if (count === 0) {
    interval = 0;
  } else if (count === 1) {
    interval = 1;
  } else if (count === 2) {
    interval = 3;
  } else {
    interval = prevInterval * factor;
  }

  const boundedInterval = Math.min(interval, MAX_INTERVAL);
  return intervalAttenuation(boundedInterval);
}

function calcInterval(prevInterval, factor, count, responseQuality) {
  if (isFailResponse(responseQuality)) {
    if (count < 1) {
      return calcIntervalCore(prevInterval, factor, count);
    }
    // treat interval calculation as if this is first time, with count = 1
    // since response quality is bad
    return calcIntervalCore(prevInterval, factor, 1);
  }
  return calcIntervalCore(prevInterval, factor, count);
}

function intervalInMinutes(interval) {
  return interval * intervalToMinutesFactor;
}

// function intervalInSeconds(interval) {
//   return interval * intervalToSecondsFactor;
// }

// TODO: write a test for this function
function calcDueDate(interval) {
  const dueDate = new Date();
  const intervalMin = intervalInMinutes(interval);
  // const intervalMin = intervalInSeconds(interval);
  return new Date(dueDate.getTime() + intervalMin * minToMillisecFactor);
  // return new Date(dueDate.getTime() + (intervalMin * secToMillisecFactor));
}

const SRCore = {
  defaultFactor: 2.5,
  defaultInterval: 1.0,
  defaultCount: 0,
  calcFactor,
  calcInterval,
  intervalInMinutes,
  calcDueDate,
};

export default SRCore;
