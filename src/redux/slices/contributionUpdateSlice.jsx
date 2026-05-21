import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchAdminContributionUpdates = createAsyncThunk(
  "contributionUpdate/fetchAdmin",
  async (params, thunkAPI) => {
    try {
      const { status = "pending", csoId, search } = params || {};
      let url = `/contribution-updates/admin/requests?status=${status}`;
      if (csoId && csoId !== "all") url += `&csoId=${csoId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch contribution update requests"
      );
    }
  }
);

export const processAdminContributionUpdate = createAsyncThunk(
  "contributionUpdate/process",
  async ({ requestId, status, adminNote }, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/contribution-updates/admin/requests/${requestId}`, {
        status,
        adminNote,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || `Failed to ${status} request`
      );
    }
  }
);

const initialState = {
  requests: [],
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
  lastActionId: null,
};

const contributionUpdateSlice = createSlice({
  name: "contributionUpdate",
  initialState,
  reducers: {
    clearContributionUpdateState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminContributionUpdates.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminContributionUpdates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.requests = action.payload.items || [];
      })
      .addCase(fetchAdminContributionUpdates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(processAdminContributionUpdate.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(processAdminContributionUpdate.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.lastActionId = nanoid();
        
        // Update the item in the list if it exists
        if (action.payload.request) {
          const index = state.requests.findIndex(r => r._id === action.payload.request._id);
          if (index !== -1) {
            state.requests[index] = action.payload.request;
          }
        }
      })
      .addCase(processAdminContributionUpdate.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { clearContributionUpdateState } = contributionUpdateSlice.actions;

export default contributionUpdateSlice.reducer;
