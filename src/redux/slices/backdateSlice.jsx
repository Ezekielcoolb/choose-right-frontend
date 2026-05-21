import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const createBackdateRequest = createAsyncThunk(
  "backdate/create",
  async (payload, thunkAPI) => {
    try {
      const response = await apiClient.post("/backdate-requests/cso/request", payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCsoBackdateRequests = createAsyncThunk(
  "backdate/fetchCso",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/backdate-requests/cso/requests");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAdminBackdateRequests = createAsyncThunk(
  "backdate/fetchAdmin",
  async (params = {}, thunkAPI) => {
    try {
      const { status = "pending", csoId, search } = params;
      let url = `/backdate-requests/admin/requests?status=${status}`;
      if (csoId && csoId !== "all") url += `&csoId=${encodeURIComponent(csoId)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const processBackdateRequest = createAsyncThunk(
  "backdate/process",
  async ({ id, status, adminNote }, thunkAPI) => {
    try {
      const response = await apiClient.put(`/backdate-requests/admin/requests/${id}/process`, {
        status,
        adminNote,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  requests: [],
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
};

const backdateSlice = createSlice({
  name: "backdate",
  initialState,
  reducers: {
    clearBackdateState(state) {
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCsoBackdateRequests.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCsoBackdateRequests.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.requests = action.payload;
      })
      .addCase(fetchCsoBackdateRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchAdminBackdateRequests.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAdminBackdateRequests.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.requests = action.payload;
      })
      .addCase(fetchAdminBackdateRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createBackdateRequest.pending, (state) => {
        state.mutationStatus = "loading";
      })
      .addCase(createBackdateRequest.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.requests = [action.payload, ...state.requests];
      })
      .addCase(createBackdateRequest.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(processBackdateRequest.pending, (state) => {
        state.mutationStatus = "loading";
      })
      .addCase(processBackdateRequest.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.requests = state.requests.map((req) =>
          req._id === action.payload._id ? action.payload : req
        );
      })
      .addCase(processBackdateRequest.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { clearBackdateState } = backdateSlice.actions;
export default backdateSlice.reducer;
