# Token Unlock & DLOM Tracker

This project is designed to provide a web-based tool for tracking and visualizing token unlock schedules while applying a fair market value discount based on the Discount for Lack of Marketability (DLOM). The application helps non-technical users like accounting and operations teams manage locked token positions, understand their unlocking timelines, and evaluate discounted valuation over time.

---

## Live Demo

Try the live deployed app here:
[https://pcm82.github.io/token-unlocks-app/](https://pcm82.github.io/token-unlocks-app/)

---

## Project Structure

```
token-unlocks-app/
├── public/
├── src/
│   ├── components/
│   │   ├── TokenForm.jsx        # Input form for token schedule and parameters
│   │   └── ...
│   ├── utils/
│   │   └── optionsMath.js       # Black-Scholes and option pricing utilities
│   └── App.jsx                  # Main app component and result rendering
├── README.md
├── package.json
└── ...
```

---

## Core Features

* **Flexible Vesting Schedule Input:**
  Users can enter complex vesting schedules including cliffs, linear unlocks, multi-phase unlocks, and multiple unlock dates. This flexibility allows for realistic modeling of a variety of contractual token lockups.

* **Key Metrics Summary:**
  The app calculates and displays:

  * The number of tokens currently unlocked and still locked.
  * The discounted value of locked tokens using DLOM.
  * Percentage discount applied relative to spot price.
  * Total portfolio value accounting for locked and unlocked tokens.

* **Visualizations:**
  A time-series line chart shows portfolio unlock value evolution over time split by locked, unlocked, and total value components.

* **Detailed Unlock Events Table:**
  Displays each unlock event with exact date, amount unlocked, discounted price, DLOM percentage, and token symbol.

* **Manual Entry of Volatility and Spot Price:**
  Users provide the spot price and implied volatility inputs, allowing calculation of option premiums for discounting.

---

## How DLOM and Volatility Are Calculated

The Discount for Lack of Marketability (DLOM) represents the price reduction applied to tokens that cannot be sold immediately due to lockups. It is estimated here as the premium of an at-the-money (ATM) European put option that expires on the token unlock date, reflecting the cost of illiquidity.

### Option Pricing Model

* **Black-Scholes Formula:**
  Utilized to compute the put option premium, which is taken as the DLOM price haircut.

* **Parameters:**

  * Spot price (S): Provided by user input (future iterations aim to fetch this automatically).
  * Strike price (K): Assumed equal to spot price for ATM options.
  * Volatility (σ): Estimated annualized volatility based on historical price data.
  * Time to maturity (T): Calculated as the time between current date and unlock date.

### Volatility Estimation

* Obtained by calculating the annualized standard deviation of daily log returns over the past year from historical token price data.

* Formula for annualized volatility:

  $$
  \sigma_{annual} = \text{std}(\log(\frac{p_t}{p_{t-1}})) \times \sqrt{365}
  $$

* Historical price data is sourced externally from CoinGecko’s public API.

---

## External APIs & Libraries Used

* **CoinGecko API:**
  Used to fetch historical token prices for volatility calculation and spot price reference (manual input still allowed).

* **Recharts:**
  For building responsive, interactive charts visualizing unlock values over time.

* **date-fns:**
  Utility library for robust date and time manipulation.

---

## Architecture Summary

* **Frontend:**
  Single-page React application hosted on GitHub Pages.

* **Main Components:**

  * `TokenForm.jsx`: Collects user inputs including token symbol, spot price, volatility, and vesting schedule details.
  * `App.jsx`: Manages application state and renders results.
  * `ResultsDisplay`: Displays calculation outputs with charts and tables.

* **Utilities:**
  Implements Black-Scholes option pricing in `optionsMath.js` for DLOM calculation.

---

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/pcm82/token-unlocks-app.git
   cd token-unlocks-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the app locally for development:**

   ```bash
   npm start
   ```

4. **Build the app for production deployment:**

   ```bash
   npm run build
   ```

5. **Deploy to GitHub Pages:**

   ```bash
   npm run deploy
   ```

   (Requires GitHub Pages branch set up and `homepage` configured in `package.json`)

---

## Reflection

### 1. Assumptions Made & Validation

* Volatility based on 365 days of historical prices accurately represents token price uncertainty.
* ATM European put option is a reasonable proxy for DLOM given market illiquidity.
* Simplified unlock schedules modeled as cliffs plus linear unlocks capture the majority of real-world cases.
* Manual spot and volatility inputs suffice as MVP, with API automation planned.

Validation was performed by cross-checking calculated volatility against CoinGecko price charts and comparing option premiums with known market data.

### 2. Hardest Technical/Product Hurdles

* Designing an intuitive yet flexible vesting schedule input that accommodates varying unlock structures.
* Handling date-based unlock event aggregation and value calculation dynamically with precision.
* Ensuring responsive visualization and table rendering with real-time input changes.

These were tackled through iterative design, a clean data model for unlock events, and React state management.

### 3. Trade-offs & Limitations

* Currently supports only manual entry of spot price and volatility; full automation is planned.
* Unlock schedule input UI could be enhanced to support more granular and non-linear schedules.
* No backend means reliance on client-side data fetching which might face rate limits and exposure.
* No authentication or data persistence beyond browser session.

### 4. Vulnerabilities or Operational Concerns

* API rate limits on CoinGecko may restrict volatility updates or cause data inconsistencies.
* Client-side calculations and storage limit data security and scalability.
* Assumptions in option pricing may not fully capture real-world DLOM nuances, especially for illiquid or low-volume tokens.

### 5. Additional Features for Future Development

* Full automation of spot price and volatility fetching for all major tokens.
* Support for multiple fiat currencies and currency conversion.
* More sophisticated vesting schedules, including fractional and revocable unlocks.
* Export functionality for unlock schedules and reports (CSV, Excel).
* User account system to save portfolios and preferences.
* Scheduled backend jobs to periodically refresh price and volatility data.
* Enhanced charting with zoom, filters, and annotations.
* Multi-token portfolio tracking with aggregation and comparative analytics.

---

## Contact

For questions or feedback, please reach out to [Peter Munn](https://github.com/pcm82).
