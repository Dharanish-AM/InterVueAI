import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import candidateSlice from "./candidateSlice";
import interviewSlice from "./interviewSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["candidates", "interviews"],
};

const rootReducer = combineReducers({
  candidates: candidateSlice,
  interviews: interviewSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);
