import axios from 'axios';

interface OptionsData {
  getDailyClosingPrices: (ticker: string) => Promise<number[]>;
  getStandardDeviation: (ticker: string) => Promise<number>;
  getStockPrice: (ticker: string) => Promise<number>;
  getRiskFreeRate: () => Promise<number>;
}

class PolygonOptionsData implements OptionsData {
  stockData: any;
  stockClosingData: any;

  constructor() {
    this.stockData = null;
    this.stockClosingData = null;
  }
  
  public async getDailyClosingPrices(ticker: string): Promise<number[]> {
    let oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    let from = oneYearAgo.toISOString().split('T')[0]; 
    let to = new Date().toISOString().split('T')[0]; 
    try {
      const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=252&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`)
      if (!response.data || !response.data.results) {
        throw new Error('Invalid response data');
      }
      this.stockClosingData = response.data.results.map((result: { c: any; }) => result.c);
      return this.stockClosingData;
    } catch (error) {
      console.error('API Error fetching daily closing prices: ', error);
    }
    return [];
  }
  
  public async getOptionsContracts(queries: {[key: string]: any}): Promise<number[]> {
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
    console.error('API Error invalid ticker');
    return [];
  }

  public async getOptionPrice(ticker: string): Promise<number> {
    try {
      const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`)
      if (!response.data || !response.data.results) {
        throw new Error('Invalid response data');
      }
      return response.data.results[0].c;
    } catch (error) {
      console.error('API Error fetching option price: ', error);
    }
    console.error('API Error invalid ticker');
    return -1;
  }

  public async getStockPrice(ticker: string): Promise<number> {
    if (ticker.length < 1 || ticker.length > 5) {
      console.error("API Error invalid ticker symbol");
    }
    if (this.stockClosingData) {
      return this.stockClosingData[this.stockClosingData.length - 1]
    } else {
      console.error(`getStockPrice(${ticker}): FAILED TO FIND STOCK PRICE IN this.stockClosingData`)
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
    return 0;
  }

  public async getStandardDeviation(ticker: string): Promise<number> {
    try {
      let closingPrices = this.stockClosingData
      if (closingPrices.length === 0) {
        throw new Error('No closing prices data');
      }
      let mean = closingPrices.reduce((a: number, b: number) => a + b, 0) / closingPrices.length;
      let variance = closingPrices.map((price: number) => Math.pow(price - mean, 2)).reduce((a: number, b: number) => a + b, 0) / closingPrices.length;
      let standardDeviation = Math.sqrt(variance);
      return standardDeviation;
    } catch (error) {
      console.error('Error calculating standard deviation: ', error);
    }
    return 0;
  }
  
  public async getRiskFreeRate(): Promise<number> {
    try {
        const response = await axios.get(`https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&format=json&page[number]=1&page[size]=1`);
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            throw new Error('Invalid response data');
        }
        const latestData = response.data.data[0];
        const riskFreeRate = parseFloat(latestData.avg_interest_rate_amt);
        return riskFreeRate;
    } catch (error) {
        console.error('API Error fetching risk free rate: ', error);
        return 0.04;
    }
    return 0;
  }

}  

export default PolygonOptionsData;
