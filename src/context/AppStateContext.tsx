import React, { createContext, useContext, useReducer } from 'react';

// Define initial state
const initialState = {};

// Create a context
const AppStateContext = createContext(initialState);

// Define actions
const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_STATE':
            return { ...state, ...action.payload };
        // Add more actions as needed
        default:
            return state;
    }
};

// Provider component
export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <AppStateContext.Provider value={{ state, dispatch }}>
            {children}
        </AppStateContext.Provider>
    );
};

// Custom hook for using context
export const useAppState = () => {
    return useContext(AppStateContext);
};
