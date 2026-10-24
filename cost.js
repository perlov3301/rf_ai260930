// Scoring of one candidate set of lines for passband AND stopband at once.
//
//   passband  : the frequencies where the match must be good  -> low VSWR
//   stopband  : the frequencies that must be rejected          -> high VSWR
//
// The candidate is judged by ONE number, the cost (smaller is better):
//
//   cost = worst passband VSWR  +  weight * stopband shortfall
//
//   shortfall = max(0, (target - lowest stopband VSWR) / target)
//
// The shortfall runs from 0 (every stopband frequency reaches the required
// VSWR, nothing is added) up to about 1 (the stopband is not rejected at all).
// weight says how many VSWR units a completely missed stopband costs.
// Without stopband frequencies the cost is just the worst passband VSWR,
// which is exactly the old behaviour of the program.

// A lossless network can reflect everything: gamma = 1 gives VSWR = Infinity,
// and rounding can even push gamma slightly above 1 (negative VSWR). For the
// stopband that is the BEST possible result, so it is limited to this value
// instead of being thrown away as an error.
const STOP_VSWR_CAP = 1000;

/**
 * Brings a stopband VSWR into the range 1 ... STOP_VSWR_CAP.
 * @param {number} vswr
 * @returns {number}
 */
function limitStopVswr(vswr) {
  if (Number.isNaN(vswr)) {
    throw new Error("cost;stopband VSWR is not a number.");
  }
  if (!Number.isFinite(vswr) || vswr < 1 || vswr > STOP_VSWR_CAP) {
    return STOP_VSWR_CAP;
  }
  return vswr;
}

/**
 * Mismatch loss in dB (the part of the power that is reflected away).
 * @param {number} vswr
 * @returns {number} rejection in dB, 0 for a perfect match
 */
function rejectionDb(vswr) {
  const gamma = (vswr - 1) / (vswr + 1);
  return -10 * Math.log10(1 - gamma * gamma);
}

/**
 * @param {number[]} passVswrs  VSWR at every passband frequency
 * @param {number[]} stopVswrs  VSWR at every stopband frequency (may be empty)
 * @param {number} target       wanted lowest VSWR in the stopband (> 1)
 * @param {number} weight       cost of a completely missed stopband (>= 0)
 * @returns {{passMax:number, stopMin:(number|null), shortfall:number, cost:number}}
 */
function candidateCost(passVswrs, stopVswrs, target, weight) {
  const passMax = Math.max(...passVswrs);
  if (stopVswrs.length === 0) {
    return { passMax, stopMin: null, shortfall: 0, cost: passMax };
  }
  const stopMin = Math.min(...stopVswrs);
  const shortfall = Math.max(0, (target - stopMin) / target);
  return { passMax, stopMin, shortfall, cost: passMax + weight * shortfall };
}

export { STOP_VSWR_CAP, limitStopVswr, rejectionDb, candidateCost };