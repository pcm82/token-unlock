# Token Unlocks Tracker

## Website: [https://pcm82.github.io/token-unlock/](pcm82.github.io/token-unlock)

## Overview

An investment team regularly acquires tokens from project treasuries at a negotiated discount with contractual lock-ups. Locked tokens cannot be sold until they vest, and their value is discounted due to lack of marketability (DLOM). The DLOM is estimated using the premium of an at-the-money European put option expiring on the unlock date.

This web application enables accounting, operations, and investment teams to:

* Track token unlock schedules and quantities unlocked vs locked over time.
* Calculate discounted token values applying DLOM.
* Visualize unlock events and portfolio value changes with intuitive tables and charts.
* Enter spot price and implied volatility manually or fetch them automatically for common tokens (stretch feature).

---

## Features

* Flexible input of unlocking schedules (cliffs, linear unlocks, multiple events).
* Calculation of discounted values using Black-Scholes put option pricing.
* Interactive tables displaying detailed unlock events and discount percentages.
* Time series charts showing locked, unlocked, and total portfolio value.
* Responsive UI suitable for non-technical users.
* Table can be sorted by any column ascending or descending
* Current view can be exported and imported for easy sharing

---

## Getting Started

### Prerequisites

* Node.js (v16 or higher recommended)
* npm or yarn package manager

### Installation

```bash
git clone https://github.com/pcm82/token-unlock.git
cd token-unlock
npm install
```

### Running Locally

```bash
npm start
```

This launches the app on `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

The build output will be in the `build` folder, which can be deployed to any static hosting service (e.g., GitHub Pages).

---

## Architecture Summary

* **Frontend:** React with functional components and hooks.
* **Charts:** Recharts library for interactive data visualization.
* **Option Pricing:** Implements Black-Scholes model to calculate DLOM as the price of an at-the-money European put option.
* **Data Model:** Unlock events are stored as arrays of objects with date, amount, discounted price, and discount percent.
* **Spot Price & Volatility:** Users input manually or pull automatically via CoinGecko API (if available).
* **State Management:** Local React state (`useState`) handles form input and calculation results.

---

## External Data Sources

* **CoinGecko API:** Used to fetch token spot prices and historical data for volatility calculation.
* **Historical price data:** Volatility is calculated from the last year of daily prices using standard deviation of log returns.

---

## Reflections

1. **Assumptions & Validation**

   * Assumed lockup schedules can be represented as discrete unlock events or linear unlocks.
   * Validated option pricing via Black-Scholes formula implemented in JavaScript against known values.
   * Used historical price data from CoinGecko for volatility estimation.

2. **Technical/UX Challenges**

   * Handling flexible and complex unlocking schedules in a user-friendly form was challenging.
   * Computing volatility robustly from noisy historical data required data cleaning and validation.
   * Ensuring smooth, responsive charts with large data sets while maintaining clarity.

3. **Trade-offs and Limitations**

   * The app relies on manual input for some tokens if automatic price/volatility fetching is unavailable.
   * Black-Scholes model assumes lognormal returns and constant volatility, which may not hold in practice.
   * No backend; all processing happens client-side, limiting scalability for large datasets.

4. **Vulnerabilities & Operational Concerns**

   * Dependence on external APIs (CoinGecko) for pricing data introduces a potential single point of failure.
   * Client-side computations mean sensitive data is not protected beyond the user's environment.
   * Lack of automated tests could affect maintainability as the codebase grows.

5. **Future Enhancements**

   * Add support for cron-like flexible schedules (e.g., unlock every weekday, monthly, quarterly).
   * Enable input and display of values in multiple currencies with real-time conversion.
   * Implement persistent backend storage for user profiles and saved portfolios.
   * Add unit and integration tests for critical functions.
   * Incorporate additional pricing models or Monte Carlo simulation for DLOM.
   * Enhance UI with improved accessibility and error handling.
   * Add URL service to save a view as a shortened URL for easy sharing
