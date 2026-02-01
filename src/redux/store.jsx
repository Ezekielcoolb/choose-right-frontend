import { configureStore } from "@reduxjs/toolkit";
import branchReducer from "./slices/branchSlice.jsx";
import csoReducer from "./slices/csoSlice.jsx";
import csoAuthReducer from "./slices/csoAuthSlice.jsx";
import customersReducer from "./slices/customersSlice.jsx";
import savingsReducer from "./slices/savingsSlice.jsx";
import adminLoanReducer from "./slices/adminLoanSlice.jsx";
import adminWithdrawalReducer from "./slices/adminWithdrawalSlice.jsx";
import adminPanelReducer from "./slices/adminPanelSlice.jsx";
import adminDashboardReducer from "./slices/adminDashboardSlice.jsx";
import uploadReducer from "./slices/uploadSlice.jsx";

const store = configureStore({
  reducer: {
    branches: branchReducer,
    csos: csoReducer,
    csoAuth: csoAuthReducer,
    customers: customersReducer,
    savings: savingsReducer,
    adminLoans: adminLoanReducer,
    adminWithdrawals: adminWithdrawalReducer,
    adminPanel: adminPanelReducer,
    adminDashboard: adminDashboardReducer,
    upload: uploadReducer,
  },
});

export default store;