use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn up_size(std_dev: f64, delta_t: f64) -> f64 {
    (std_dev * 0.01 * delta_t.sqrt()).exp()
}

#[wasm_bindgen]
pub fn down_size(std_dev: f64, delta_t: f64) -> f64 {
    1.0 / (std_dev * 0.01 * delta_t.sqrt()).exp()
}

#[wasm_bindgen]
pub fn call_buy_payoff(cur_price: f64, strike_price: f64) -> f64 {
    f64::max(cur_price - strike_price, 0.0)
}

#[wasm_bindgen]
pub fn put_buy_payoff(cur_price: f64, strike_price: f64) -> f64 {
    f64::max(strike_price - cur_price, 0.0)
}

#[wasm_bindgen]
pub fn get_rnp(rfr: f64, delta_t: f64, up_move: f64, down_move: f64) -> f64 {
    (((rfr * delta_t) - down_move) / (up_move - down_move)).exp()
}