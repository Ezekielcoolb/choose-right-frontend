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
import managerAuthReducer from "./slices/managerAuthSlice.jsx";
import managerDataReducer from "./slices/managerDataSlice.jsx";
import customerAuthReducer from "./slices/customerAuthSlice.jsx";
import customerDataReducer from "./slices/customerDataSlice.jsx";
import adminReportReducer from "./slices/adminReportSlice.jsx";
import adminAuthReducer from "./slices/adminAuthSlice.jsx";

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
    managerAuth: managerAuthReducer,
    managerData: managerDataReducer,
    customerAuth: customerAuthReducer,
    customerData: customerDataReducer,
    adminReport: adminReportReducer,
    adminAuth: adminAuthReducer,
  },
});

export default store;