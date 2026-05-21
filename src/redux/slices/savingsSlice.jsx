import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import apiClient from "../../api/client";
import { logoutCso } from "./csoAuthSlice.jsx";

const PLAN_TYPE_SAVING = "saving";
const PLAN_TYPE_LOAN = "loan";

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

const normalizeRequestShape = (request = {}, defaultStatus) => {
  if (!request) {
    return undefined;
  }
  const normalized = { ...request };
  if (defaultStatus && !normalized.status) {
    normalized.status = defaultStatus;
  }
  if (normalized.status) {
    normalized.status = normalized.status.toString().toLowerCase();
  }
  return normalized;
};

const normalizeLoanRequest = (plan = {}) => {
  if (plan.loanStatus === "pending" && plan.loanRequest) {
    return normalizeRequestShape(plan.loanRequest);
  }

  if (plan.loanDetails && plan.loanDetails.status === "pending") {
    return normalizeRequestShape(
      {
        amount: plan.loanDetails.amount,
        dailyAmount: plan.loanDetails.dailyAmount,
        dailyRepaymentAmount: plan.loanDetails.dailyRepaymentAmount,
        requestDate: plan.loanDetails.requestDate,
        guarantor: plan.loanDetails.guarantor,
        customerSignature: plan.loanDetails.customerSignature,
      },
      "pending",
    );
  }

  if (plan.loanRequest) {
    return normalizeRequestShape(plan.loanRequest);
  }

  return undefined;
};

const normalizePlan = (plan = {}) => {
  if (!plan || typeof plan !== "object") {
    return plan;
  }

  let metadata = {};
  if (plan.metadata) {
    if (typeof plan.metadata.get === "function") {
      metadata = Object.fromEntries(plan.metadata);
    } else if (typeof plan.metadata === "object") {
      metadata = { ...plan.metadata };
    }
  }

  const normalizedPlanType = (plan.planType || (plan.isLoan ? PLAN_TYPE_LOAN : PLAN_TYPE_SAVING))
    .toString()
    .toLowerCase();

  const normalizedRequest = normalizeLoanRequest(plan);
  const rawLoanStatus =
    plan.loanStatus ||
    plan.loanDetails?.status ||
    normalizedRequest?.status;
  const normalizedLoanStatus = rawLoanStatus
    ? rawLoanStatus.toString().toLowerCase()
    : plan.isLoan
      ? "approved"
      : "none";

  return {
    ...plan,
    planType: normalizedPlanType,
    loanStatus: normalizedLoanStatus,
    loanRequest: normalizedRequest,
    metadata,
  };
};

export const fetchSavingsPlans = createAsyncThunk(
  "savings/fetchPlans",
  async (params, thunkAPI) => {
    try {
      const query = buildQuery(params);
      const response = await apiClient.get(`/savings${query}`);
      return { params, plans: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchAdminSavingsPlans = createAsyncThunk(
  "savings/fetchAdminPlans",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/admin/savings");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchAdminPlanEntries = createAsyncThunk(
  "savings/fetchAdminPlanEntries",
  async ({ customerId, planId, page = 1, limit = 20 }, thunkAPI) => {
    try {
      const response = await apiClient.get(
        `/admin/customers/${customerId}/plans/${planId}/entries?page=${page}&limit=${limit}`,
      );
      return { customerId, planId, page, limit, data: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchSavingsPlanById = createAsyncThunk(
  "savings/fetchById",
  async (planId, thunkAPI) => {
    try {
      const response = await apiClient.get(`/savings/${planId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createSavingsPlan = createAsyncThunk(
  "savings/createPlan",
  async (payload, thunkAPI) => {
    try {
      const response = await apiClient.post("/savings", payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createSavingsPlanForCustomer = createAsyncThunk(
  "savings/createPlanForCustomer",
  async ({ customerId, payload }, thunkAPI) => {
    try {
      const response = await apiClient.post(`/savings/customer/${customerId}`, payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const recordSavingsDeposit = createAsyncThunk(
  "savings/recordDeposit",
  async ({ planId, payload }, thunkAPI) => {
    try {
      const response = await apiClient.post(`/savings/${planId}/deposits`, payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const recordSavingsWithdrawal = createAsyncThunk(
  "savings/recordWithdrawal",
  async ({ planId, payload }, thunkAPI) => {
    try {
      const response = await apiClient.post(`/savings/${planId}/withdrawals`, payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createSavingsWithdrawalRequest = createAsyncThunk(
  "savings/createWithdrawalRequest",
  async ({ planId, payload }, thunkAPI) => {
    try {
      const response = await apiClient.post(`/savings/${planId}/withdrawals/request`, payload);
      return { planId, request: response.data.request };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateSavingsPlanStatus = createAsyncThunk(
  "savings/updateStatus",
  async ({ planId, status }, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/savings/${planId}`, { status });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateSavingsDailyContribution = createAsyncThunk(
  "savings/updateDailyContribution",
  async ({ planId, payload }, thunkAPI) => {
    try {
      const response = await apiClient.post("/contribution-updates/request", { planId, ...payload });
      return { planId, request: response.data.request };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchSavingsEntries = createAsyncThunk(
  "savings/fetchEntries",
  async ({ planId, page = 1, limit = 20 }, thunkAPI) => {
    try {
      const response = await apiClient.get(`/savings/${planId}/entries?page=${page}&limit=${limit}`);
      return { planId, page, data: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);


export const requestSavingsLoan = createAsyncThunk(
  "savings/requestLoan",
  async ({ planId, payload }, thunkAPI) => {
    try {
      const response = await apiClient.post(`/savings/${planId}/loan/request`, payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const approveSavingsLoan = createAsyncThunk(
  "savings/approveLoan",
  async (planId, thunkAPI) => {
    try {
      const response = await apiClient.put(`/savings/${planId}/loan/approve`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const rejectSavingsLoan = createAsyncThunk(
  "savings/rejectLoan",
  async (planId, thunkAPI) => {
    try {
      const response = await apiClient.put(`/savings/${planId}/loan/reject`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const createInitialState = () => ({
  plansByCustomer: {},
  plansById: {},
  entriesByPlan: {},
  withdrawalRequestsByPlan: {},
  plansStatus: "idle",
  plansError: null,
  mutationStatus: "idle",
  mutationError: null,
  selectedPlan: null,
  lastActionId: null,
  adminPlans: [],
  adminPlansStatus: "idle",
  adminPlansError: null,
});

const initialState = createInitialState();

const savingsSlice = createSlice({
  name: "savings",
  initialState,
  reducers: {
    clearSavingsState(state) {
      state.mutationStatus = "idle";
      state.mutationError = null;
      state.selectedPlan = null;
    },
    resetSavingsState: () => createInitialState(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavingsPlans.pending, (state) => {
        state.plansStatus = "loading";
        state.plansError = null;
      })
      .addCase(fetchSavingsPlans.fulfilled, (state, action) => {
        state.plansStatus = "succeeded";
        const { params = {}, plans } = action.payload;
        const normalizedPlans = (plans || []).map(normalizePlan);
        if (params.customerId) {
          state.plansByCustomer[params.customerId] = normalizedPlans;
        }
        normalizedPlans.forEach((plan) => {
          state.plansById[plan._id] = plan;
          if (plan.latestWithdrawalRequest) {
            state.withdrawalRequestsByPlan[plan._id] = [plan.latestWithdrawalRequest];
          }
        });
      })
      .addCase(fetchSavingsPlans.rejected, (state, action) => {
        state.plansStatus = "failed";
        state.plansError = action.payload || action.error.message;
      })
      .addCase(fetchAdminSavingsPlans.pending, (state) => {
        state.adminPlansStatus = "loading";
        state.adminPlansError = null;
      })
      .addCase(fetchAdminSavingsPlans.fulfilled, (state, action) => {
        state.adminPlansStatus = "succeeded";
        state.adminPlans = (action.payload || []).map(normalizePlan);
      })
      .addCase(fetchAdminSavingsPlans.rejected, (state, action) => {
        state.adminPlansStatus = "failed";
        state.adminPlansError = action.payload || action.error.message;
      })
      .addCase(fetchSavingsPlanById.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(fetchSavingsPlanById.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { plan, recentEntries, withdrawalRequests } = action.payload;
        const normalizedPlan = normalizePlan(plan);
        state.selectedPlan = normalizedPlan;
        state.plansById[normalizedPlan._id] = normalizedPlan;
        state.entriesByPlan[normalizedPlan._id] = {
          items: recentEntries,
          pagination: { page: 1, pages: 1, total: recentEntries.length, limit: 20 },
        };
        if (withdrawalRequests) {
          state.withdrawalRequestsByPlan[normalizedPlan._id] = withdrawalRequests;
        }
      })
      .addCase(fetchSavingsPlanById.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(fetchAdminPlanEntries.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(fetchAdminPlanEntries.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { planId, data } = action.payload;
        if (data?.plan) {
          const normalizedPlan = normalizePlan(data.plan);
          state.plansById[normalizedPlan._id] = normalizedPlan;
        }
        state.entriesByPlan[planId] = data;
      })
      .addCase(fetchAdminPlanEntries.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(createSavingsPlan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createSavingsPlan.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const plan = normalizePlan(action.payload);
        state.plansById[plan._id] = plan;
        if (plan.customerId) {
          const customerPlans = state.plansByCustomer[plan.customerId] || [];
          state.plansByCustomer[plan.customerId] = [plan, ...customerPlans];
        }
        state.lastActionId = nanoid();
      })
      .addCase(createSavingsPlan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(createSavingsPlanForCustomer.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createSavingsPlanForCustomer.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const plan = normalizePlan(action.payload);
        state.plansById[plan._id] = plan;
        if (plan.customerId) {
          const existingPlans = state.plansByCustomer[plan.customerId] || [];
          state.plansByCustomer[plan.customerId] = [plan, ...existingPlans];
        }
        state.lastActionId = nanoid();
      })
      .addCase(createSavingsPlanForCustomer.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(recordSavingsDeposit.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(recordSavingsDeposit.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { plan: rawPlan, entry } = action.payload;
        const plan = normalizePlan(rawPlan);
        state.plansById[plan._id] = plan;
        if (plan.customerId && state.plansByCustomer[plan.customerId]) {
          state.plansByCustomer[plan.customerId] = state.plansByCustomer[plan.customerId].map((item) =>
            item._id === plan._id ? plan : item,
          );
        }
        if (state.entriesByPlan[plan._id]) {
          state.entriesByPlan[plan._id] = {
            ...state.entriesByPlan[plan._id],
            items: [entry, ...state.entriesByPlan[plan._id].items],
          };
        }
        if (state.selectedPlan?._id === plan._id) {
          state.selectedPlan = plan;
        }
        state.lastActionId = nanoid();
      })
      .addCase(recordSavingsDeposit.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(recordSavingsWithdrawal.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(recordSavingsWithdrawal.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
        state.lastActionId = nanoid();
      })
      .addCase(recordSavingsWithdrawal.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(createSavingsWithdrawalRequest.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createSavingsWithdrawalRequest.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { planId, request } = action.payload;
        const plan = state.plansById[planId];
        if (plan) {
          state.plansById[planId] = { ...plan, latestWithdrawalRequest: request };
        }
        if (state.selectedPlan?._id === planId) {
          state.selectedPlan = { ...state.selectedPlan, latestWithdrawalRequest: request };
        }
        const existingRequests = state.withdrawalRequestsByPlan[planId] || [];
        state.withdrawalRequestsByPlan[planId] = [request, ...existingRequests];
        state.lastActionId = nanoid();
      })
      .addCase(createSavingsWithdrawalRequest.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(updateSavingsPlanStatus.fulfilled, (state, action) => {
        const plan = normalizePlan(action.payload);
        state.plansById[plan._id] = plan;
        if (plan.customerId && state.plansByCustomer[plan.customerId]) {
          state.plansByCustomer[plan.customerId] = state.plansByCustomer[plan.customerId].map((item) =>
            item._id === plan._id ? plan : item,
          );
        }
        if (state.selectedPlan?._id === plan._id) {
          state.selectedPlan = plan;
        }
      })
      .addCase(updateSavingsDailyContribution.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateSavingsDailyContribution.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { planId, request } = action.payload || {};
        if (state.plansById[planId]) {
           state.plansById[planId] = { ...state.plansById[planId], latestContributionUpdateRequest: request };
        }
        if (state.selectedPlan?._id === planId) {
           state.selectedPlan = { ...state.selectedPlan, latestContributionUpdateRequest: request };
        }
        state.lastActionId = nanoid();
      })
      .addCase(updateSavingsDailyContribution.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(fetchSavingsEntries.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(fetchSavingsEntries.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { planId, data } = action.payload;
        state.entriesByPlan[planId] = data;
      })
      .addCase(fetchSavingsEntries.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(requestSavingsLoan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(requestSavingsLoan.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { plan: rawPlan } = action.payload;
        const plan = normalizePlan(rawPlan);
        state.plansById[plan._id] = plan;
        if (plan.customerId && state.plansByCustomer[plan.customerId]) {
          state.plansByCustomer[plan.customerId] = state.plansByCustomer[plan.customerId].map((item) =>
            item._id === plan._id ? plan : item,
          );
        }
        if (state.selectedPlan?._id === plan._id) {
          state.selectedPlan = plan;
        }
        state.lastActionId = nanoid();
      })
      .addCase(requestSavingsLoan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(approveSavingsLoan.fulfilled, (state, action) => {
        const { plan: rawPlan } = action.payload;
        const plan = normalizePlan(rawPlan);
        state.plansById[plan._id] = plan;
        if (plan.customerId && state.plansByCustomer[plan.customerId]) {
          state.plansByCustomer[plan.customerId] = state.plansByCustomer[plan.customerId].map((item) =>
            item._id === plan._id ? plan : item,
          );
        }
        state.lastActionId = nanoid();
      })
      .addCase(rejectSavingsLoan.fulfilled, (state, action) => {
        const { plan: rawPlan } = action.payload;
        const plan = normalizePlan(rawPlan);
        state.plansById[plan._id] = plan;
        if (plan.customerId && state.plansByCustomer[plan.customerId]) {
          state.plansByCustomer[plan.customerId] = state.plansByCustomer[plan.customerId].map((item) =>
            item._id === plan._id ? plan : item,
          );
        }
        state.lastActionId = nanoid();
      })
      .addCase(logoutCso, () => createInitialState());
  },
});

export const { clearSavingsState, resetSavingsState } = savingsSlice.actions;

export default savingsSlice.reducer;
