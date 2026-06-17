import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './PriceTicker.css';

const PriceTicker = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await api.get('/dashboard/market-prices');
        setPrices(res.data);
      } catch (err) {
        console.error('Failed to load ticker prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    // Poll every 8 seconds for dynamic updates
    const interval = setInterval(fetchPrices, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading || prices.length === 0) {
    return (
      <div className="price-ticker-bar d-flex align-items-center justify-content-center text-xs">
        <span className="spinner-border spinner-border-sm text-warning me-2" role="status"></span>
        <span className="text-muted">Loading live oil prices ticker...</span>
      </div>
    );
  }

  return (
    <div className="price-ticker-bar">
      <div className="ticker-label d-none d-sm-flex align-items-center">
        <span className="pulse-dot me-2"></span>
        <span className="fw-bold text-xs text-uppercase tracking-wider text-warning">Live Crude Index</span>
      </div>
      <div className="ticker-content-wrapper">
        <div className="ticker-scroll">
          {prices.map((item, idx) => {
            const isUp = item.change >= 0;
            return (
              <div key={item.code || idx} className="ticker-item">
                <span className="text-white-50 text-xs fw-semibold">{item.name} ({item.code}):</span>
                <span className="ticker-price font-monospace text-white text-xs fw-bold mx-2">
                  ₹{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`ticker-change text-xs fw-semibold d-flex align-items-center ${isUp ? 'text-success' : 'text-danger'}`}>
                  {isUp ? (
                    <i className="bi bi-caret-up-fill me-0.5"></i>
                  ) : (
                    <i className="bi bi-caret-down-fill me-0.5"></i>
                  )}
                  {isUp ? '+' : ''}{item.change}%
                </span>
                <span className="ticker-divider">|</span>
              </div>
            );
          })}
          {/* Duplicate for infinite loop marquee */}
          {prices.map((item, idx) => {
            const isUp = item.change >= 0;
            return (
              <div key={`${item.code}-dup` || idx} className="ticker-item">
                <span className="text-white-50 text-xs fw-semibold">{item.name} ({item.code}):</span>
                <span className="ticker-price font-monospace text-white text-xs fw-bold mx-2">
                  ₹{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`ticker-change text-xs fw-semibold d-flex align-items-center ${isUp ? 'text-success' : 'text-danger'}`}>
                  {isUp ? (
                    <i className="bi bi-caret-up-fill me-0.5"></i>
                  ) : (
                    <i className="bi bi-caret-down-fill me-0.5"></i>
                  )}
                  {isUp ? '+' : ''}{item.change}%
                </span>
                <span className="ticker-divider">|</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
