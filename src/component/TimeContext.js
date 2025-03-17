import React, { createContext, useState, useContext } from "react";

// TimeContext 생성
export const TimeContext = createContext();

// TimeProvider 컴포넌트: Context 값을 제공하는 역할
export const TimeProvider = ({ children }) => {
  const [deliveredTime, setDeliveredTime] = useState(localStorage.getItem("deliveredTime") || "16:00");

  return (
    <TimeContext.Provider value={{ deliveredTime, setDeliveredTime }}>
      {children}
    </TimeContext.Provider>
  );
};

// TimeContext를 쉽게 사용할 수 있도록 하는 custom hook
export const useTime = () => useContext(TimeContext);
