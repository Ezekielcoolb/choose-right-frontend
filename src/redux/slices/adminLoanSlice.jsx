import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchPendingLoans = createAsyncThunk(
  "adminLoans/fetchPending",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/admin/loans/pending");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchActiveLoans = createAsyncThunk(
  "adminLoans/fetchActive",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/admin/loans/active");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const approveAdminLoan = createAsyncThunk(
  "adminLoans/approveLoan",
  async (planId, thunkAPI) => {
    try {
      const response = await apiClient.put(`/admin/loans/${planId}/approve`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejectAdminLoan = createAsyncThunk(
  "adminLoans/rejectLoan",
  async (planId, thunkAPI) => {
    try {
      const response = await apiClient.put(`/admin/loans/${planId}/reject`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  pendingLoans: [],
  activeLoans: [],
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
};

const adminLoanSlice = createSlice({
  name: "adminLoans",
  initialState,
  reducers: {
    clearAdminLoanState(state) {
      state.status = "idle";
      state.error = null;
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pending
      .addCase(fetchPendingLoans.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPendingLoans.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pendingLoans = (action.payload || []).filter((plan) => {
          const rawStatus =
            plan?.loanStatus ||
            plan?.loanDetails?.status ||
            plan?.loanRequest?.status;

          const normalizedStatus = rawStatus ? rawStatus.toString().toLowerCase() : "";

          const amount = Number(
            plan?.loanDetails?.amount ??
              plan?.loanDetails?.requestedAmount ??
              plan?.loanRequest?.amount ??
              plan?.loanRequest?.requestedAmount ??
              plan?.lastLoanRequestAmount ??
              0,
          );

          return normalizedStatus === "pending" && amount > 0;
        });
      })
      .addCase(fetchPendingLoans.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Fetch Active
      .addCase(fetchActiveLoans.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchActiveLoans.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.activeLoans = action.payload;
      })
      .addCase(fetchActiveLoans.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Approve
      .addCase(approveAdminLoan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(approveAdminLoan.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        // Remove from pending, add to active (if we want to optimistic update, or just refetch)
        const approvedPlan = action.payload.plan;
        state.pendingLoans = state.pendingLoans.filter(p => p._id !== approvedPlan._id);
        state.activeLoans.unshift(approvedPlan);
      })
      .addCase(approveAdminLoan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      // Reject
      .addCase(rejectAdminLoan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(rejectAdminLoan.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const rejectedPlan = action.payload.plan;
        state.pendingLoans = state.pendingLoans.filter(p => p._id !== rejectedPlan._id);
        // Maybe move to rejected list if we had one?
      })
      .addCase(rejectAdminLoan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { clearAdminLoanState } = adminLoanSlice.actions;
export default adminLoanSlice.reducer;
