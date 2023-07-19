import axios from 'axios';

interface OptionsData {
  getStockPrice: (ticker: String) => Promise<Number>;
  getStrikePrice: (ticker: String) => Promise<Number>;
  getTimeToExpiration: () => Number;
  getRiskFreeRate: () => Promise<Number>;
  getVolatility: () => Promise<Number>;
  getSteps: () => Promise<Number>;
  getOptionPrice: () => Promise<Number>;
}

class PolygonOptionsData implements OptionsData {
  stockData: any;
  optionData: any;

  constructor() {
    this.stockData = null;
    this.optionData = null;
  }

  public async getStockPrice(ticker: String): Promise<Number> {
    if (ticker.length !== 4) return 0;
    if (!this.stockData)
      try {
        console.log("getStockPrice call");
        const response = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=5min&apikey=CC1EJTK0U40Z2M9C`)
        if (!response.data || !response.data['Time Series (5min)']) {
          throw new Error('Invalid response data');
        }
        this.stockData = response.data;
        const timeSeries = response.data['Time Series (5min)'];
        const latestTimestamp = Object.keys(timeSeries).sort().pop();
        if (latestTimestamp) {
          const closingPrice = timeSeries[latestTimestamp]['4. close'];
          return closingPrice;
        }
      } catch (error) {
        console.error('Error fetching stock data: ', error);
      }
    const timeSeries = this.stockData['Time Series (5min)'];
    const latestTimestamp = Object.keys(timeSeries).sort().pop();
    if (latestTimestamp) {
      const closingPrice = timeSeries[latestTimestamp]['4. close'];
      return closingPrice;
    }
    return 0;
  }

  public async getStrikePrice(ticker: String): Promise<Number> {
    if (!this.optionData)
      try {
        console.log("getStrikePrice call");
        const response = await axios.get(`https://api.polygon.io/v3/reference/options/contracts/O:${ticker}?apiKey=kmsrYoQHhvAPTv2_Wk7GQwtwSmyk_epK`)
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

  public async getVolatility(): Promise<Number> {
    return 0;
  }

  public async getSteps(): Promise<Number> {
    return 0;
  }

  public async getOptionPrice(): Promise<Number> {
    return 0;
  }

}  

export default PolygonOptionsData;
