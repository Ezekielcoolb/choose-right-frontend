import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchPendingLoans = createAsyncThunk(
  "adminLoans/fetchPending",
  async (params = {}, thunkAPI) => {
    try {
      const { csoId, search, page = 1, limit = 20 } = params;
      let query = `?page=${page}&limit=${limit}`;
      if (csoId && csoId !== "all") query += `&csoId=${csoId}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const response = await apiClient.get(`/admin/loans/pending${query}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const approveMultipleLoans = createAsyncThunk(
  "adminLoans/approveMultiple",
  async (planIds, thunkAPI) => {
    try {
      const response = await apiClient.put("/admin/loans/approve-multiple", { planIds });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const rejectMultipleLoans = createAsyncThunk(
  "adminLoans/rejectMultiple",
  async ({ planIds, note }, thunkAPI) => {
    try {
      const response = await apiClient.put("/admin/loans/reject-multiple", { planIds, note });
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
  total: 0,
  page: 1,
  pages: 1,
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
        state.pendingLoans = action.payload.items || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.pages = action.payload.pages || 1;
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
      // Bulk Actions
      .addCase(approveMultipleLoans.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(approveMultipleLoans.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(approveMultipleLoans.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(rejectMultipleLoans.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(rejectMultipleLoans.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(rejectMultipleLoans.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      // Single Actions
      .addCase(approveAdminLoan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(approveAdminLoan.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const approvedPlan = action.payload.plan;
        state.pendingLoans = state.pendingLoans.filter(p => p._id !== approvedPlan._id);
        state.activeLoans.unshift(approvedPlan);
      })
      .addCase(approveAdminLoan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(rejectAdminLoan.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(rejectAdminLoan.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const rejectedPlan = action.payload.plan;
        state.pendingLoans = state.pendingLoans.filter(p => p._id !== rejectedPlan._id);
      })
      .addCase(rejectAdminLoan.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});


export const { clearAdminLoanState } = adminLoanSlice.actions;
export default adminLoanSlice.reducer;

