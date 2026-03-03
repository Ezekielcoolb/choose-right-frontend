import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const fetchAdminMembers = createAsyncThunk(
  "adminPanel/fetchMembers",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/admin/panel");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createAdminMember = createAsyncThunk(
  "adminPanel/createMember",
  async (payload, thunkAPI) => {
    try {
      const response = await apiClient.post("/admin/panel", payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const toggleSuspendAdminMember = createAsyncThunk(
  "adminPanel/toggleSuspend",
  async ({ id, isSuspended }, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/admin/panel/${id}/suspend`, { isSuspended });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteAdminMember = createAsyncThunk(
  "adminPanel/deleteMember",
  async (id, thunkAPI) => {
    try {
      await apiClient.delete(`/admin/panel/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);


const initialState = {
  items: [],
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
};

const adminPanelSlice = createSlice({
  name: "adminPanel",
  initialState,
  reducers: {
    resetAdminPanelState(state) {
      state.status = "idle";
      state.error = null;
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMembers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminMembers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminMembers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createAdminMember.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createAdminMember.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const created = action.payload;
        if (created && created._id) {
          state.items = [created, ...state.items.filter((item) => item._id !== created._id)];
        }
      })
      .addCase(createAdminMember.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(toggleSuspendAdminMember.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(toggleSuspendAdminMember.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const updated = action.payload;
        if (updated && updated._id) {
          state.items = state.items.map((item) => (item._id === updated._id ? updated : item));
        }
      })
      .addCase(toggleSuspendAdminMember.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(deleteAdminMember.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteAdminMember.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteAdminMember.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { resetAdminPanelState } = adminPanelSlice.actions;
export default adminPanelSlice.reducer;
