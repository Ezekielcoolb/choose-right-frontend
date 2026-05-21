import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

const buildAsyncState = () => ({ data: null, status: "idle", error: null });

export const fetchManagerDashboardOverview = createAsyncThunk(
  "managerData/dashboardOverview",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/dashboard/overview");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerDashboardInsights = createAsyncThunk(
  "managerData/dashboardInsights",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/dashboard/insights");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerDashboardRecent = createAsyncThunk(
  "managerData/dashboardRecent",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/dashboard/recent");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerCsos = createAsyncThunk(
  "managerData/csos",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/csos");
      return response.data?.items || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerCustomers = createAsyncThunk(
  "managerData/customers",
  async (params = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/manager/customers?${queryString}` : "/manager/customers";
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerSavings = createAsyncThunk(
  "managerData/savings",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/savings");
      return response.data?.items || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerLoans = createAsyncThunk(
  "managerData/loans",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/loans");
      return response.data?.items || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerTransactions = createAsyncThunk(
  "managerData/transactions",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/transactions");
      return response.data?.items || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerRemittances = createAsyncThunk(
  "managerData/remittances",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager/remittances");
      return response.data?.items || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerWithdrawals = createAsyncThunk(
  "managerData/withdrawals",
  async (params = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `/manager/withdrawals?${queryString}`
        : "/manager/withdrawals";
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const resolveManagerRemittance = createAsyncThunk(
  "managerData/resolveRemittance",
  async ({ csoId, remittanceId, resolution, issueResolution }, thunkAPI) => {
    try {
      const response = await apiClient.post(
        `/manager/csos/${csoId}/remittance/${remittanceId}/resolve`,
        { resolution, issueResolution },
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerCustomerDetail = createAsyncThunk(
  "managerData/customerDetail",
  async (customerId, thunkAPI) => {
    try {
      const response = await apiClient.get(`/manager/customers/${customerId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerPlanEntries = createAsyncThunk(
  "managerData/planEntries",
  async ({ customerId, planId, page = 1, limit = 20 }, thunkAPI) => {
    try {
      const response = await apiClient.get(
        `/manager/customers/${customerId}/plans/${planId}/entries?page=${page}&limit=${limit}`,
      );
      return { customerId, planId, page, limit, data: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerCsoDetail = createAsyncThunk(
  "managerData/csoDetail",
  async (csoId, thunkAPI) => {
    try {
      const response = await apiClient.get(`/manager/csos/${csoId}/detail`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  dashboard: {
    overview: buildAsyncState(),
    insights: buildAsyncState(),
    recent: buildAsyncState(),
  },
  csos: buildAsyncState(),
  customers: buildAsyncState(),
  savings: buildAsyncState(),
  loans: buildAsyncState(),
  transactions: buildAsyncState(),
  remittances: buildAsyncState(),
  withdrawals: buildAsyncState(),
  csoDetail: {
    ...buildAsyncState(),
    customers: [],
    plans: [],
    entries: [],
  },
  selectedCustomer: buildAsyncState(),
  customerPlans: [],
  planEntries: buildAsyncState(),
};

const managerDataSlice = createSlice({
  name: "managerData",
  initialState,
  reducers: {
    resetManagerData(state) {
      state.dashboard.overview = buildAsyncState();
      state.dashboard.insights = buildAsyncState();
      state.dashboard.recent = buildAsyncState();
      state.csos = buildAsyncState();
      state.customers = buildAsyncState();
      state.savings = buildAsyncState();
      state.loans = buildAsyncState();
      state.transactions = buildAsyncState();
      state.remittances = buildAsyncState();
      state.withdrawals = buildAsyncState();
      state.csoDetail = {
        ...buildAsyncState(),
        customers: [],
        plans: [],
        entries: [],
      };
      state.selectedCustomer = buildAsyncState();
      state.customerPlans = [];
      state.planEntries = buildAsyncState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerDashboardOverview.pending, (state) => {
        state.dashboard.overview.status = "loading";
        state.dashboard.overview.error = null;
      })
      .addCase(fetchManagerDashboardOverview.fulfilled, (state, action) => {
        state.dashboard.overview.status = "succeeded";
        state.dashboard.overview.data = action.payload;
      })
      .addCase(fetchManagerDashboardOverview.rejected, (state, action) => {
        state.dashboard.overview.status = "failed";
        state.dashboard.overview.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerDashboardInsights.pending, (state) => {
        state.dashboard.insights.status = "loading";
        state.dashboard.insights.error = null;
      })
      .addCase(fetchManagerDashboardInsights.fulfilled, (state, action) => {
        state.dashboard.insights.status = "succeeded";
        state.dashboard.insights.data = action.payload;
      })
      .addCase(fetchManagerDashboardInsights.rejected, (state, action) => {
        state.dashboard.insights.status = "failed";
        state.dashboard.insights.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerDashboardRecent.pending, (state) => {
        state.dashboard.recent.status = "loading";
        state.dashboard.recent.error = null;
      })
      .addCase(fetchManagerDashboardRecent.fulfilled, (state, action) => {
        state.dashboard.recent.status = "succeeded";
        state.dashboard.recent.data = action.payload;
      })
      .addCase(fetchManagerDashboardRecent.rejected, (state, action) => {
        state.dashboard.recent.status = "failed";
        state.dashboard.recent.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerCsos.pending, (state) => {
        state.csos.status = "loading";
        state.csos.error = null;
      })
      .addCase(fetchManagerCsos.fulfilled, (state, action) => {
        state.csos.status = "succeeded";
        state.csos.data = action.payload;
      })
      .addCase(fetchManagerCsos.rejected, (state, action) => {
        state.csos.status = "failed";
        state.csos.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerCustomers.pending, (state) => {
        state.customers.status = "loading";
        state.customers.error = null;
      })
      .addCase(fetchManagerCustomers.fulfilled, (state, action) => {
        state.customers.status = "succeeded";
        state.customers.data = action.payload;
      })
      .addCase(fetchManagerCustomers.rejected, (state, action) => {
        state.customers.status = "failed";
        state.customers.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerSavings.pending, (state) => {
        state.savings.status = "loading";
        state.savings.error = null;
      })
      .addCase(fetchManagerSavings.fulfilled, (state, action) => {
        state.savings.status = "succeeded";
        state.savings.data = action.payload;
      })
      .addCase(fetchManagerSavings.rejected, (state, action) => {
        state.savings.status = "failed";
        state.savings.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerLoans.pending, (state) => {
        state.loans.status = "loading";
        state.loans.error = null;
      })
      .addCase(fetchManagerLoans.fulfilled, (state, action) => {
        state.loans.status = "succeeded";
        state.loans.data = action.payload;
      })
      .addCase(fetchManagerLoans.rejected, (state, action) => {
        state.loans.status = "failed";
        state.loans.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerTransactions.pending, (state) => {
        state.transactions.status = "loading";
        state.transactions.error = null;
      })
      .addCase(fetchManagerTransactions.fulfilled, (state, action) => {
        state.transactions.status = "succeeded";
        state.transactions.data = action.payload;
      })
      .addCase(fetchManagerTransactions.rejected, (state, action) => {
        state.transactions.status = "failed";
        state.transactions.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerRemittances.pending, (state) => {
        state.remittances.status = "loading";
        state.remittances.error = null;
      })
      .addCase(fetchManagerRemittances.fulfilled, (state, action) => {
        state.remittances.status = "succeeded";
        state.remittances.data = action.payload;
      })
      .addCase(fetchManagerRemittances.rejected, (state, action) => {
        state.remittances.status = "failed";
        state.remittances.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerCsoDetail.pending, (state) => {
        state.csoDetail.status = "loading";
        state.csoDetail.error = null;
      })
      .addCase(fetchManagerCsoDetail.fulfilled, (state, action) => {
        state.csoDetail.status = "succeeded";
        state.csoDetail.data = action.payload?.cso || null;
        state.csoDetail.customers = action.payload?.customers || [];
        state.csoDetail.plans = action.payload?.plans || [];
        state.csoDetail.entries = action.payload?.entries || [];
      })
      .addCase(fetchManagerCsoDetail.rejected, (state, action) => {
        state.csoDetail.status = "failed";
        state.csoDetail.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerCustomerDetail.pending, (state) => {
        state.selectedCustomer.status = "loading";
        state.selectedCustomer.error = null;
      })
      .addCase(fetchManagerCustomerDetail.fulfilled, (state, action) => {
        state.selectedCustomer.status = "succeeded";
        state.selectedCustomer.data = action.payload?.customer || null;
        state.customerPlans = action.payload?.savingsPlans || [];
      })
      .addCase(fetchManagerCustomerDetail.rejected, (state, action) => {
        state.selectedCustomer.status = "failed";
        state.selectedCustomer.error = action.payload || action.error?.message;
      })
      .addCase(fetchManagerPlanEntries.pending, (state) => {
        state.planEntries.status = "loading";
        state.planEntries.error = null;
      })
      .addCase(fetchManagerPlanEntries.fulfilled, (state, action) => {
        state.planEntries.status = "succeeded";
        state.planEntries.data = action.payload?.data || null;
      })
      .addCase(fetchManagerPlanEntries.rejected, (state, action) => {
        state.planEntries.status = "failed";
        state.planEntries.error = action.payload || action.error?.message;
      })
      .addCase(resolveManagerRemittance.fulfilled, (state, action) => {
        const { item } = action.payload;
        if (state.remittances.data) {
          state.remittances.data = state.remittances.data.map((r) =>
            r._id === item._id ? { ...r, ...item } : r,
          );
        }
      })
      .addCase(fetchManagerWithdrawals.pending, (state) => {
        state.withdrawals.status = "loading";
        state.withdrawals.error = null;
      })
      .addCase(fetchManagerWithdrawals.fulfilled, (state, action) => {
        state.withdrawals.status = "succeeded";
        state.withdrawals.data = action.payload;
      })
      .addCase(fetchManagerWithdrawals.rejected, (state, action) => {
        state.withdrawals.status = "failed";
        state.withdrawals.error = action.payload || action.error?.message;
      });
  },
});

export const { resetManagerData } = managerDataSlice.actions;
export default managerDataSlice.reducer;
