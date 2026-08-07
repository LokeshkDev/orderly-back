import React, { createContext, useContext, useState } from 'react';

const QuickViewContext = createContext();

export const QuickViewProvider = ({ children }) => {
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const openQuickView = (product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  return (
    <QuickViewContext.Provider
      value={{
        quickViewProduct,
        openQuickView,
        closeQuickView
      }}
    >
      {children}
    </QuickViewContext.Provider>
  );
};

export const useQuickView = () => useContext(QuickViewContext);
