// Use a built-in or custom erf implementation if you don't have a reliable one
// Here's a simple erf approximation you can use if you don't want to import one:

function erf(x) {
  // Abramowitz and Stegun approximation for erf
  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);

  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

export const calculateDLOM = ({ spot, volatility, timeToExpiry }) => {
  if (
    typeof spot !== 'number' || spot <= 0 ||
    typeof volatility !== 'number' || volatility <= 0 ||
    typeof timeToExpiry !== 'number' || timeToExpiry < 0
  ) {
    return NaN; // or throw error if you prefer
  }

  if (timeToExpiry === 0) {
    return 0; // option expired, no value
  }

  const S = spot;
  const K = spot; // strike price same as spot for at-the-money put
  const sigma = volatility;
  const r = 0.05; // risk free rate

  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * timeToExpiry) / (sigma * Math.sqrt(timeToExpiry));
  const d2 = d1 - sigma * Math.sqrt(timeToExpiry);

  // Standard normal cumulative distribution function using erf
  const N = (x) => 0.5 * (1 + erf(x / Math.sqrt(2)));

  // Put option price formula (Black-Scholes)
  const putPrice = K * Math.exp(-r * timeToExpiry) * N(-d2) - S * N(-d1);

  return putPrice;
};
