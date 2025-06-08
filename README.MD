Got it! Here's your updated `README.md` with **no mention of `cronstrue` or `cron-parser`**, keeping the rest clean and professional:

---

# 📈 Token Unlock & DLOM Tracker

This project is a technical assignment for ParaFi, providing a web-based tool to model and visualize token unlock schedules and apply fair market value discounts using the Discount for Lack of Marketability (DLOM). It enables operations and accounting teams to flexibly track locked token positions and assess their value over time.

## 🚀 Live Demo

[https://pcm82.github.io/token-unlocks-app/](https://pcm82.github.io/token-unlocks-app/)

## 📁 Project Structure

```
token-unlocks-app/
├── public/
├── src/
│   ├── components/
│   │   ├── TokenForm.jsx
│   │   └── ...
│   ├── utils/
│   │   ├── optionsMath.js
│   └── App.jsx
├── README.md
├── package.json
└── ...
```

## 🧠 Core Features

* 📅 Flexible input for vesting schedules: daily, weekly, cliffs, and multi-phase unlocks
* 📊 Summary metrics including:

  * Unlocked/Locked token amounts
  * DLOM-adjusted value
  * Discount percentages
* 📈 Visual chart of unlock value over time
* 📝 Tabular view of each unlock event and its DLOM calculation
* 💱 Accepts user-supplied spot price and volatility

## 🔍 How DLOM & Volatility Are Calculated

The DLOM is approximated using the **Black-Scholes put option premium** for an at-the-money (ATM) European option:

* **Spot price**: user input (future version: automatic fetch)
* **Strike price**: same as spot (ATM assumption)
* **Volatility**: estimated from the past year’s historical price data

### Volatility Source

Volatility is fetched or inferred via:

* CoinGecko API for historical price data
* Computed using the annualized standard deviation of daily log returns:

  ```
  σ_annual = std(log(p_t / p_{t-1})) * sqrt(365)
  ```

## 🌐 External APIs & Libraries Used

* [CoinGecko API](https://www.coingecko.com/en/api) – token spot price & historical data
* [recharts](https://recharts.org/en-US/) – unlock value line charts
* [date-fns](https://date-fns.org/) – time handling

## 🏗️ Architecture Summary

* **Frontend**: React SPA hosted on GitHub Pages
* **Components**:

  * `TokenForm`: collects user input
  * `App.jsx`: manages state and renders `ResultsDisplay`
  * `ResultsDisplay`: renders tables and charts
* **Utilities**:

  * `optionsMath.js`: Black-Scholes formula implementation

## 🛠️ Setup Instructions

1. Clone the repo:

   ```bash
   git clone https://github.com/pcm82/token-unlocks-app.git
   cd token-unlocks-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run locally:

   ```bash
   npm start
   ```

4. Build for deployment:

   ```bash
   npm run build
   ```

5. Deploy to GitHub Pages (if configured):

   ```bash
   npm run deploy
   ```

---

## 🤔 Reflection

### 1. **What assumptions did you make, and how did you validate them?**

* Assumed volatility is based on past 365 days of token prices – validated against CoinGecko historical charts and calculated log returns.
* Assumed that ATM options reflect the cost of illiquidity well enough for DLOM estimation.
* Assumed simplified input format for vesting schedules (e.g. cliff + linear unlocks) was sufficient for first version.

### 2. **What was the hardest technical or product hurdle and how did you tackle it?**

* Supporting flexible, multi-phase unlock schedules was challenging. I created a clean data structure to represent multi-date and multi-frequency unlock plans.
* Also tackled edge cases in how unlock values are calculated over time based on dates and partial unlocks.

### 3. **What trade‑offs or limitations did you accept?**

* UI supports only a few coins for auto-volatility due to API constraints (future: expand this).
* Manual entry of volatility/spot instead of full API automation (prioritized MVP delivery).
* Charts and tables assume linear unlocks per time period (future: allow fractional or tiered unlocks).

### 4. **Are there vulnerabilities or operational concerns in your approach?**

* No backend currently: relies on client-side API calls which may hit rate limits.
* No authentication: anyone can access and use the interface.
* DLOM formula uses static assumptions; could be improved with more dynamic market models.

### 5. **Propose additional features that you would implement with more time.**

* 🧠 Full automatic price and volatility lookup for all major tokens
* 💸 Support for different fiat currencies (USD, EUR, etc.)
* 🔁 Add support for **revocable schedules** (if the lock can reset or extend)
* 📤 Export unlock schedule and summary to Excel/CSV
* 🌍 User preferences and saved portfolios
* 🗓️ More precise scheduling with user-defined unlock amounts by date
* 🛠️ Backend job to periodically update volatilities and token prices for active positions

---

## 📬 Contact

Questions? Reach out to [Peter Munn](https://github.com/pcm82).

---

Let me know if you’d like this as a Markdown file, downloadable ZIP, or GitHub-friendly `.md` upload.
