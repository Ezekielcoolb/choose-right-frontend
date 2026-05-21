import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchAdminWithdrawalRequests = createAsyncThunk(
  "adminWithdrawals/fetch",
  async (params = {}, thunkAPI) => {
    try {
      const {
        status = "pending",
        csoId,
        search,
        page = 1,
        limit = 20,
        dateRange,
        startDate,
        endDate,
        specificDate,
        specificMonth,
      } = params;

      let query = `?status=${status}&page=${page}&limit=${limit}`;
      if (csoId && csoId !== "all") query += `&csoId=${csoId}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (dateRange) query += `&dateRange=${dateRange}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      if (specificDate) query += `&specificDate=${specificDate}`;
      if (specificMonth) query += `&specificMonth=${specificMonth}`;

      const response = await apiClient.get(`/admin/withdrawals${query}`);
      return { status, ...response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const approveMultipleWithdrawals = createAsyncThunk(
  "adminWithdrawals/approveMultiple",
  async (requestIds, thunkAPI) => {
    try {
      const response = await apiClient.put("/admin/withdrawals/approve-multiple", { requestIds });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const rejectMultipleWithdrawals = createAsyncThunk(
  "adminWithdrawals/rejectMultiple",
  async ({ requestIds, note }, thunkAPI) => {
    try {
      const response = await apiClient.put("/admin/withdrawals/reject-multiple", {
        requestIds,
        note,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  items: [],
  total: 0,
  totalAmount: 0,
  page: 1,
  pages: 1,
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
      state.total = 0;
      state.totalAmount = 0;
      state.page = 1;
      state.pages = 1;
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
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
        state.totalAmount = action.payload.totalAmount || 0;
        state.page = action.payload.page || 1;
        state.pages = action.payload.pages || 1;
      })

      .addCase(fetchAdminWithdrawalRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(approveMultipleWithdrawals.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(approveMultipleWithdrawals.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const { processedRequests = [] } = action.payload;
        state.items = state.items.filter((item) => !processedRequests.includes(item._id));
      })
      .addCase(approveMultipleWithdrawals.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(rejectMultipleWithdrawals.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(rejectMultipleWithdrawals.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        // Since we don't get the list of IDs back in reject, we'd need to handle it or just refetch
        // But for consistency let's assume successful modification means they should be filtered out
        // (This might need a refetch for absolute accuracy if some weren't modified)
        state.status = "idle"; // Force refetch
      })
      .addCase(rejectMultipleWithdrawals.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      });
  },
});


export const { clearAdminWithdrawalState } = adminWithdrawalSlice.actions;
export default adminWithdrawalSlice.reducer;
