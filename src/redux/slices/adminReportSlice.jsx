import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchMaintenanceFees = createAsyncThunk(
  "adminReport/fetchMaintenanceFees",
  async (params, thunkAPI) => {
    try {
      const response = await apiClient.get("/admin/reports/maintenance-fees", { params });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  maintenanceFees: {
    entries: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 50,
      pages: 0,
    },
    totals: {
      totalMaintenance: 0,
      totalLoanFees: 0,
      totalOtherFees: 0,
      grandTotal: 0,
    },
    status: "idle",
    error: null,
  },
};

const adminReportSlice = createSlice({
  name: "adminReport",
  initialState,
  reducers: {
    resetReportState: (state) => {
      state.maintenanceFees = initialState.maintenanceFees;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaintenanceFees.pending, (state) => {
        state.maintenanceFees.status = "loading";
        state.maintenanceFees.error = null;
      })
      .addCase(fetchMaintenanceFees.fulfilled, (state, action) => {
        state.maintenanceFees.status = "succeeded";
        state.maintenanceFees.entries = action.payload.entries;
        state.maintenanceFees.pagination = action.payload.pagination;
        state.maintenanceFees.totals = action.payload.totals;
      })
      .addCase(fetchMaintenanceFees.rejected, (state, action) => {
        state.maintenanceFees.status = "failed";
        state.maintenanceFees.error = action.payload;
      });
  },
});

export const { resetReportState } = adminReportSlice.actions;
export default adminReportSlice.reducer;
