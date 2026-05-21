import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchDashboardOverview = createAsyncThunk(
  "adminDashboard/fetchOverview",
  async (filters = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      const url = `/admin/panel/dashboard/overview${queryString ? `?${queryString}` : ""}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchDashboardInsights = createAsyncThunk(
  "adminDashboard/fetchInsights",
  async (filters = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      const url = `/admin/panel/dashboard/insights${queryString ? `?${queryString}` : ""}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchDashboardRecent = createAsyncThunk(
  "adminDashboard/fetchRecent",
  async (filters = {}, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      const queryString = queryParams.toString();
      const url = `/admin/panel/dashboard/recent${queryString ? `?${queryString}` : ""}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const createAsyncState = () => ({ data: null, status: "idle", error: null });

const initialState = {
  overview: createAsyncState(),
  insights: createAsyncState(),
  recent: createAsyncState(),
};

const adminDashboardSlice = createSlice({
  name: "adminDashboard",
  initialState,
  reducers: {
    resetAdminDashboard(state) {
      state.overview = createAsyncState();
      state.insights = createAsyncState();
      state.recent = createAsyncState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.overview.status = "loading";
        state.overview.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.overview.status = "succeeded";
        state.overview.data = action.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.overview.status = "failed";
        state.overview.error = action.payload;
      })
      .addCase(fetchDashboardInsights.pending, (state) => {
        state.insights.status = "loading";
        state.insights.error = null;
      })
      .addCase(fetchDashboardInsights.fulfilled, (state, action) => {
        state.insights.status = "succeeded";
        state.insights.data = action.payload;
      })
      .addCase(fetchDashboardInsights.rejected, (state, action) => {
        state.insights.status = "failed";
        state.insights.error = action.payload;
      })
      .addCase(fetchDashboardRecent.pending, (state) => {
        state.recent.status = "loading";
        state.recent.error = null;
      })
      .addCase(fetchDashboardRecent.fulfilled, (state, action) => {
        state.recent.status = "succeeded";
        state.recent.data = action.payload;
      })
      .addCase(fetchDashboardRecent.rejected, (state, action) => {
        state.recent.status = "failed";
        state.recent.error = action.payload;
      });
  },
});

export const { resetAdminDashboard } = adminDashboardSlice.actions;
export default adminDashboardSlice.reducer;
