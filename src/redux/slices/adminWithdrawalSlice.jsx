import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchAdminWithdrawalRequests = createAsyncThunk(
  "adminWithdrawals/fetch",
  async (status = "pending", thunkAPI) => {
    try {
      const query = status ? `?status=${status}` : "";
      const response = await apiClient.get(`/admin/withdrawals${query}`);
      return { status, items: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const approveAdminWithdrawalRequest = createAsyncThunk(
  "adminWithdrawals/approve",
  async (requestId, thunkAPI) => {
    try {
      const response = await apiClient.put(`/admin/withdrawals/${requestId}/approve`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const rejectAdminWithdrawalRequest = createAsyncThunk(
  "adminWithdrawals/reject",
  async ({ requestId, note }, thunkAPI) => {
    try {
      const response = await apiClient.put(`/admin/withdrawals/${requestId}/reject`, { note });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  items: [],
  statusFilter: "pending",
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
};

const adminWithdrawalSlice = createSlice({
  name: "adminWithdrawals",
  initialState,
  reducers: {
    clearAdminWithdrawalState(state) {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminWithdrawalRequests.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminWithdrawalRequests.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.statusFilter = action.payload.status;
        state.items = action.payload.items;
      })
      .addCase(fetchAdminWithdrawalRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(approveAdminWithdrawalRequest.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(approveAdminWithdrawalRequest.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { request } = action.payload;
        state.items = state.items.filter((item) => item._id !== request._id);
      })
      .addCase(approveAdminWithdrawalRequest.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(rejectAdminWithdrawalRequest.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(rejectAdminWithdrawalRequest.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { request } = action.payload;
        state.items = state.items.filter((item) => item._id !== request._id);
      })
      .addCase(rejectAdminWithdrawalRequest.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      });
  },
});

export const { clearAdminWithdrawalState } = adminWithdrawalSlice.actions;
export default adminWithdrawalSlice.reducer;
