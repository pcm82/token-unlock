// Black-Scholes put premium calculator for DLOM
export const calculateDLOM = ({ spot, strike, timeToExpiry, volatility }) => {
  if (timeToExpiry <= 0) return 0;

  const r = 0.05; // risk free rate
  const sigma = volatility;
  const S = spot;
  const K = strike;
  const T = timeToExpiry;

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  // Standard normal CDF using error function approximation
  const erf = (x) => {
    // Abramowitz and Stegun formula 7.1.26 approximation
    const sign = x < 0 ? -1 : 1;
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
  };

  const N = x => 0.5 * (1 + erf(x / Math.sqrt(2)));

  const put = K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
  return put > 0 ? put : 0;
};
