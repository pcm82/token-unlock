export const getSpotPriceAndVolatility = async (token) => {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${token}`);
    const data = await res.json();
    return {
      price: data.market_data.current_price.usd,
      volatility: 0.7
    };
  } catch {
    return { price: 100, volatility: 0.7 };
  }
};