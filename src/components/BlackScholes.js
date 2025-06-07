// Standard normal cumulative distribution function (CDF) approximation
function cdf(x) {
  // Abramowitz and Stegun formula 7.1.26 approximation
  const k = 1 / (1 + 0.2316419 * Math.abs(x));
  const a1 = 0.319381530;
  const a2 = -0.356563782;
  const a3 = 1.781477937;
  const a4 = -1.821255978;
  const a5 = 1.330274429;

  const poly = a1 * k + a2 * k * k + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5);
  const approx = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * poly;

  return x >= 0 ? approx : 1 - approx;
}

// Black-Scholes European put option pricing formula
export function blackScholesPut(S, K, T, r, sigma) {
  if (T === 0) return 0;
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return (
    K * Math.exp(-r * T) * cdf(-d2) -
    S * cdf(-d1)
  );
}
