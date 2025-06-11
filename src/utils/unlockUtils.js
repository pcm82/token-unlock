export function fetchProcessedUnlockData() {
  // Stub: Replace with actual logic / API calls
  const now = Date.now();
  return Array.from({ length: 12 }, (_, i) => {
    const timestamp = now + i * 86400000;
    const amount = Math.round(Math.random() * 1000);
    const cumulativeAmount = amount * (i + 1);
    const usdValue = amount * 2;
    const cumulativeUsd = cumulativeAmount * 2;
    return { timestamp, amount, usdValue, cumulativeAmount, cumulativeUsd };
  });
}