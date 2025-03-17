import React, { createContext, useState, useContext } from "react";

// DateContext 생성
export const DateContext = createContext();  // DateContext를 export

// DateProvider 컴포넌트: Context 값을 제공하는 역할
export const DateProvider = ({ children }) => {
  const [fromDate, setFromDate] = useState(localStorage.getItem("fromDate") || "2023-07-01");

  return (
    <DateContext.Provider value={{ fromDate, setFromDate }}>
      {children}
    </DateContext.Provider>
  );
};

// DateContext를 쉽게 사용할 수 있도록 하는 custom hook
export const useDate = () => useContext(DateContext);