# <a name="title" /> Binomial Beacon

## Introduction

This project offers an in-depth exploration into the intricate realm of quantitative finance. Initially, I aimed to visualize option strategies rooted in the Black-Scholes Model, a Nobel Prize-winning model in Economic Sciences. However, I transitioned to the Binomial Option Pricing Model for its robust assumptions critical for pricing American options. My motivation for this project comes from my passion about the complexity in financial markets, eager to decode it through explanatory visualizations.

## Usage

### Setup

1. Clone the master repository: 
```sh
git clone https://github.com/Sebastian-git/BinomialBeacon.git
```
2. Install Node.js from [here](https://nodejs.org/).
3. Install Rust from [here](https://www.rust-lang.org/tools/install).
4. Navigate to your cloned repository's directory and type `npm install` to download all dependencies:
```sh
cd BinomialBeacon
npm install
```
5. Compile Rust to WebAssembly (only necessary if you intend to make changes to the Rust code):
```sh
npm run build-wasm
```
6. Start the Project:
```sh
npm run start
```


### Previews
Previews & Screenshots coming soon 

## Technical Information

This project was built on a variety of technologies, with each offering its unique challenges and learning curves:

### React
The core library used for building the UI. After experimenting with several other libraries, I created the visualizations with [React ECharts](https://github.com/hustcc/echarts-for-react), a React wrapper for [Apache ECharts](https://echarts.apache.org/examples/en/index.html).

### TypeScript
To develop a custom interface with an emphasis on type safety, enabling efficient switches between different options pricing API's for the live data. This search took so long because most finance API's don't provide an option's strike price, a critical variable in the equation. After experimenting with over 5 different API's, I was sure that the [Polygon API](https://polygon.io/docs/options/get_v3_reference_options_contracts) was the best choice for the project.

The OptionsData interface ensures that regardless of the API which is used to retrieve data, the website will still work as long as each method has an implementation:
```ts
interface OptionsData {
  getDailyClosingPrices: (ticker: string) => Promise<number[]>;
  getStandardDeviation: (ticker: string) => Promise<number>;
  getStockPrice: (ticker: string) => Promise<number>;
  getRiskFreeRate: () => Promise<number>;
}
```


### Rust
This performant and reliable language was used to optimize all computational functions for the application. The computation necessary for this recursive model seems fit for a language with a run time speed often outranking historically fast languages like C.

### WebAssembly
My project values the portability of a website more than the performance of a pure Rust application. Integrating Rust into an existing React application and having it work harmoniously with WebAssembly was a significant challenge.

### GitHub Pages & Actions
To avoid manually compiling & linking Rust code to the rest of the project, a [Github workflow](https://docs.github.com/en/actions/using-workflows) was configured to automate deployment to Github Pages. Live hosting presented several challenges like adding [environment secrets](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-secrets) for the API keys, learning about an entirely new [workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions), and finally [triggering workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows) on each push to main for continuous deployment.

A noteworthy implementation detail is the algorithm to select relevant option contracts. The typescript API only fetches a large set of option contracts, so this algorithm must calculate the mean strike price, then select the next 4 strike prices every half standard deviation, ensuring the user gets the most relevant results.

Additionally, the application is designed with responsiveness in mind, ensuring a seamless experience for both desktop and mobile users.

## Launch

The application is built on **JavaScript ES6+** and uses the latest web technologies for a smooth user experience.

## Status:
In Progress

#### [back to the top](#title)


<br /> <br /> <hr />

This section will be deleted once readme is complete.
Topics to mention in README :

- Black–Scholes model (Finance)
- Binomial Option Pricing Model (Finance)
- React echarts (React)
- Options Data API (Polygon API) (Touchscript)
- Formula to get data points which are most desirable using std dev, map, etc
- Wireframes (time spent designing)
- Rust (new language, learning about benefits)
- Web Assembly (difficult adding Rust to existing project)
- Deployment (1st time using Github pages, learned about Actions & Workflows to use .env)

Stuff I'd like to add in the future:
- LinkedIn polls checking which UI is better (with side bar of options chain vs not)
- Tests to see accuracy of option pricing? Possibly through a whole new kind of backtesting program, can make a options finance program suite?
- Account for dividend yields in calculation for risk neutral probability
