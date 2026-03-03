import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchMyPlans = createAsyncThunk(
  "customerData/fetchPlans",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/customer/plans");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchMyPlanDetails = createAsyncThunk(
  "customerData/fetchPlanDetails",
  async (planId, thunkAPI) => {
    try {
      const response = await apiClient.get(`/customer/plans/${planId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  plans: {
    data: [],
    summary: {},
    status: "idle",
    error: null,
  },
  selectedPlan: {
    plan: null,
    entries: [],
    status: "idle",
    error: null,
  },
};

const customerDataSlice = createSlice({
  name: "customerData",
  initialState,
  reducers: {
    clearSelectedPlan(state) {
      state.selectedPlan = {
        plan: null,
        entries: [],
        status: "idle",
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPlans.pending, (state) => {
        state.plans.status = "loading";
        state.plans.error = null;
      })
      .addCase(fetchMyPlans.fulfilled, (state, action) => {
        state.plans.status = "succeeded";
        state.plans.data = action.payload.items || [];
        state.plans.summary = action.payload.summary || {};
      })
      .addCase(fetchMyPlans.rejected, (state, action) => {
        state.plans.status = "failed";
        state.plans.error = action.payload || action.error?.message;
      })
      .addCase(fetchMyPlanDetails.pending, (state) => {
        state.selectedPlan.status = "loading";
        state.selectedPlan.error = null;
      })
      .addCase(fetchMyPlanDetails.fulfilled, (state, action) => {
        state.selectedPlan.status = "succeeded";
        state.selectedPlan.plan = action.payload.plan || null;
        state.selectedPlan.entries = action.payload.items || [];
      })
      .addCase(fetchMyPlanDetails.rejected, (state, action) => {
        state.selectedPlan.status = "failed";
        state.selectedPlan.error = action.payload || action.error?.message;
      });
  },
});

export const { clearSelectedPlan } = customerDataSlice.actions;
export default customerDataSlice.reducer;
