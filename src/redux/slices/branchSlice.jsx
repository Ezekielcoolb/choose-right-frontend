import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchBranches = createAsyncThunk("branches/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await apiClient.get("/branches");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchBranchById = createAsyncThunk("branches/fetchById", async (branchId, thunkAPI) => {
  try {
    const response = await apiClient.get(`/branches/${branchId}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createBranch = createAsyncThunk("branches/create", async (payload, thunkAPI) => {
  try {
    const response = await apiClient.post("/branches", payload);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateBranch = createAsyncThunk(
  "branches/update",
  async ({ branchId, updates }, thunkAPI) => {
    try {
      const response = await apiClient.put(`/branches/${branchId}`, updates);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteBranch = createAsyncThunk("branches/delete", async (branchId, thunkAPI) => {
  try {
    await apiClient.delete(`/branches/${branchId}`);
    return branchId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const initialState = {
  items: [],
  selectedBranch: null,
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
  lastActionId: null,
};

const branchSlice = createSlice({
  name: "branches",
  initialState,
  reducers: {
    clearBranchError(state) {
      state.error = null;
      state.mutationError = null;
    },
    setSelectedBranch(state, action) {
      state.selectedBranch = action.payload;
    },
    resetBranchStatus(state) {
      state.status = "idle";
      state.mutationStatus = "idle";
      state.error = null;
      state.mutationError = null;
      state.lastActionId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchBranchById.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(fetchBranchById.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.selectedBranch = action.payload;
      })
      .addCase(fetchBranchById.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(createBranch.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items.unshift(action.payload);
        state.lastActionId = nanoid();
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(updateBranch.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const index = state.items.findIndex((branch) => branch._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedBranch?._id === action.payload._id) {
          state.selectedBranch = action.payload;
        }
        state.lastActionId = nanoid();
      })
      .addCase(updateBranch.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(deleteBranch.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter((branch) => branch._id !== action.payload);
        if (state.selectedBranch?._id === action.payload) {
          state.selectedBranch = null;
        }
        state.lastActionId = nanoid();
      })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      });
  },
});

export const { clearBranchError, setSelectedBranch, resetBranchStatus } = branchSlice.actions;

export default branchSlice.reducer;
