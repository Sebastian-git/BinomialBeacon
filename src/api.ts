import axios from 'axios';

interface OptionsData {
  getDailyClosingPrices: (ticker: String) => Promise<number[]>;
  getStockPrice: (ticker: String) => Promise<Number>;
  getStrikePrice: (ticker: String) => Promise<Number>;
  getTimeToExpiration: () => Number;
  getRiskFreeRate: () => Promise<Number>;
  getStandardDeviation: (ticker: String) => Promise<Number>;
}

class PolygonOptionsData implements OptionsData {
  stockData: any;
  optionData: any;
  stockClosingData: any;

  constructor() {
    this.stockData = null;
    this.optionData = null;
    this.stockClosingData = null;
  }
  
  public async getDailyClosingPrices(ticker: String): Promise<number[]> {
    let oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    let from = oneYearAgo.toISOString().split('T')[0]; 
    let to = new Date().toISOString().split('T')[0]; 
    try {
      const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=252&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`)
      if (!response.data || !response.data.results) {
        throw new Error('Invalid response data');
      }
      this.stockClosingData = response.data.results.map(result => result.c);
      return this.stockClosingData;
    } catch (error) {
      console.error('API Error fetching daily closing prices: ', error);
    }
    return [];
  }
  
  public async getOptionsContracts(queries: Object): Promise<number[]> {
    let formatted_queries = Object.entries(queries)
    .filter( ([key, value]) => value !== null && key !== null)
    .map( ([key, value]) => `${key}=${value}`)
    .join("&");
    try {
      const response = await axios.get(`https://api.polygon.io/v3/reference/options/contracts?${formatted_queries}&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`)
      if (!response.data || !response.data.results) {
        throw new Error('Invalid response data');
      }
      return response.data.results;
    } catch (error) {
      console.error('API Error fetching options contracts: ', error);
    }
    return [];
  }

  public async getStockPrice(ticker: String): Promise<Number> {
    if (ticker.length < 1 || ticker.length > 5) {
      console.error("API Error invalid ticker symbol");
    }
    if (this.stockClosingData) {
      return this.stockClosingData[this.stockClosingData.length - 1]
    } else {
      console.log(`getStockPrice(${ticker}): FAILED TO FIND STOCK PRICE IN this.stockClosingData`)
      try {
        const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`)
        if (!response.data) {
          throw new Error('Invalid response data');
        }
        this.stockData = response.data;
        return this.stockData.results[0].c;
      } catch (error) {
        console.error('API Error fetching stock data: ', error);
      }
    }
  }

  public async getStandardDeviation(ticker: String): Promise<Number> {
    try {
      let closingPrices = this.stockClosingData
      if (closingPrices.length === 0) {
        throw new Error('No closing prices data');
      }
      let mean = closingPrices.reduce((a, b) => a + b, 0) / closingPrices.length;
      let variance = closingPrices.map(price => Math.pow(price - mean, 2)).reduce((a, b) => a + b, 0) / closingPrices.length;
      let standardDeviation = Math.sqrt(variance);
      return standardDeviation;
    } catch (error) {
      console.error('Error calculating standard deviation: ', error);
    }
    return 0;
  }

  public async getStrikePrice(ticker: String): Promise<Number> {
    if (!this.optionData)
      try {
        const response = await axios.get(`https://api.polygon.io/v3/reference/options/contracts/O:${ticker}?apiKey=${process.env.POLYGON_API_KEY}`)
        if (!response.data || !response.data.results) {
          throw new Error('Invalid response data');
        }
        this.optionData = response.data
        return response.data.results.strike_price;
      } catch (error) {
        console.error('Error fetching options data: ', error);
      }
    return this.optionData.results.strike_price;;
  }
  
  public getTimeToExpiration(): Number {
    if (this.optionData) {
      const expDate = new Date(this.optionData.results.expiration_date);
      const today = new Date();
      const timeDiffInMs = expDate.getTime() - today.getTime();
      return Math.ceil(timeDiffInMs / (1000 * 3600 * 24));
    }
    return 0;
  }
  
  public async getRiskFreeRate(): Promise<Number> {
    return 0;
  }

  public async getOptionPrice(): Promise<Number> {
    return 0;
  }

}  

export default PolygonOptionsData;
