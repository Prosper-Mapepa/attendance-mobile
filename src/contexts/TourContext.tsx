import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TourContextType {
  showTour: boolean;
  setShowTour: (show: boolean) => void;
  startTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  // Ensure boolean value is strictly typed
  return {
    ...context,
    showTour: Boolean(context.showTour),
  };
};

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [showTour, setShowTour] = useState<boolean>(false);
  
  // Ensure setShowTour always receives a boolean
  const setShowTourSafe = (value: boolean) => {
    setShowTour(Boolean(value));
  };

  const startTour = () => {
    setShowTourSafe(true);
  };

  const value: TourContextType = {
    showTour: Boolean(showTour),
    setShowTour: setShowTourSafe,
    startTour,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};

