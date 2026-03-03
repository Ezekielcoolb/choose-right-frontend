import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import apiClient from "../../api/client";
import { logoutCso } from "./csoAuthSlice.jsx";

export const fetchCsos = createAsyncThunk("csos/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await apiClient.get("/csos");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchCsoById = createAsyncThunk("csos/fetchById", async (csoId, thunkAPI) => {
  try {
    const response = await apiClient.get(`/csos/${csoId}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchAdminCsoDetail = createAsyncThunk("csos/fetchAdminDetail", async (csoId, thunkAPI) => {
  try {
    const response = await apiClient.get(`/admin/csos/${csoId}/detail`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createCso = createAsyncThunk("csos/create", async (payload, thunkAPI) => {
  try {
    const response = await apiClient.post("/csos", payload);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateCso = createAsyncThunk(
  "csos/update",
  async ({ csoId, updates }, thunkAPI) => {
    try {
      const response = await apiClient.put(`/csos/${csoId}`, updates);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateCsoStatus = createAsyncThunk(
  "csos/updateStatus",
  async ({ csoId, isActive }, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/csos/${csoId}/status`, { isActive });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const recordCsoRemittance = createAsyncThunk(
  "csos/recordRemittance",
  async (
    {
      csoId,
      amountCollected,
      amountPaid,
      amountRemitted,
      remark,
      resolution,
      issueResolution,
      resolvedIssue,
      resolutionDate,
      remittanceId,
    },
    thunkAPI,
  ) => {
    try {
      const payload = {};

      if (amountCollected !== undefined) payload.amountCollected = amountCollected;
      if (amountPaid !== undefined) payload.amountPaid = amountPaid;
      if (amountRemitted !== undefined) payload.amountRemitted = amountRemitted;
      if (remark !== undefined) payload.remark = remark;
      if (resolution !== undefined) payload.resolution = resolution;
      if (issueResolution !== undefined) payload.issueResolution = issueResolution;
      if (resolvedIssue !== undefined) payload.resolvedIssue = resolvedIssue;
      if (resolutionDate !== undefined) payload.resolutionDate = resolutionDate;
      if (remittanceId !== undefined) payload.remittanceId = remittanceId;

      const response = await apiClient.post(`/csos/${csoId}/remittance`, payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
export const adjustCsoRemittance = createAsyncThunk(
  "csos/adjustRemittance",
  async ({ csoId, remittanceId, amount, action }, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/csos/${csoId}/remittance/${remittanceId}/adjust`, {
        amount,
        action,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteCsoRemittance = createAsyncThunk(
  "csos/deleteRemittance",
  async ({ csoId, remittanceId }, thunkAPI) => {
    try {
      const response = await apiClient.delete(`/csos/${csoId}/remittance/${remittanceId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);


export const transferCustomers = createAsyncThunk(
  "csos/transferCustomers",
  async ({ targetCsoId, customerIds }, thunkAPI) => {
    try {
      const response = await apiClient.post("/admin/csos/transfer-customers", {
        targetCsoId,
        customerIds,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteCso = createAsyncThunk("csos/delete", async (csoId, thunkAPI) => {
  try {
    await apiClient.delete(`/csos/${csoId}`);
    return csoId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});


const createInitialState = () => ({
  items: [],
  selectedCso: null,
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
  lastActionId: null,
  remittanceStatus: "idle",
  remittanceError: null,
  remittanceDeadlineCritical: false,
  detailStatus: "idle",
  detailError: null,
  selectedCsoCustomers: [],
  selectedCsoPlans: [],
  selectedCsoEntries: [],
});

const initialState = createInitialState();

const csoSlice = createSlice({
  name: "csos",
  initialState,
  reducers: {
    setSelectedCso(state, action) {
      state.selectedCso = action.payload;
    },
    resetCsoStatus(state) {
      state.status = "idle";
      state.mutationStatus = "idle";
      state.error = null;
      state.mutationError = null;
      state.lastActionId = null;
      state.remittanceDeadlineCritical = false;
      state.detailStatus = "idle";
      state.detailError = null;
      state.selectedCsoCustomers = [];
      state.selectedCsoPlans = [];
      state.selectedCsoEntries = [];
    },
    resetCsosState: () => createInitialState(),
    setRemittanceDeadlineAlert(state, action) {
      state.remittanceDeadlineCritical = Boolean(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCsos.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCsos.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCsos.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchCsoById.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(fetchCsoById.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.selectedCso = action.payload;
      })
      .addCase(fetchCsoById.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(fetchAdminCsoDetail.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchAdminCsoDetail.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.selectedCso = action.payload?.cso || state.selectedCso;
        state.selectedCsoCustomers = action.payload?.customers || [];
        state.selectedCsoPlans = action.payload?.plans || [];
        state.selectedCsoEntries = action.payload?.entries || [];
      })
      .addCase(fetchAdminCsoDetail.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload || action.error.message;
      })
      .addCase(createCso.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createCso.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items.unshift(action.payload);
        state.lastActionId = nanoid();
      })
      .addCase(createCso.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(updateCso.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateCso.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const index = state.items.findIndex((cso) => cso._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedCso?._id === action.payload._id) {
          state.selectedCso = action.payload;
        }
        state.lastActionId = nanoid();
      })
      .addCase(updateCso.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(updateCsoStatus.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateCsoStatus.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const index = state.items.findIndex((cso) => cso._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedCso?._id === action.payload._id) {
          state.selectedCso = action.payload;
        }
        state.lastActionId = nanoid();
      })
      .addCase(updateCsoStatus.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(recordCsoRemittance.pending, (state) => {
        state.remittanceStatus = "loading";
        state.remittanceError = null;
      })
      .addCase(recordCsoRemittance.fulfilled, (state, action) => {
        state.remittanceStatus = "succeeded";
        const updatedCso = action.payload;
        if (updatedCso?._id) {
          const index = state.items.findIndex((cso) => cso._id === updatedCso._id);
          if (index !== -1) {
            state.items[index] = updatedCso;
          }
          if (state.selectedCso?._id === updatedCso._id) {
            state.selectedCso = updatedCso;
          }
        }
        state.lastActionId = nanoid();
      })
      .addCase(recordCsoRemittance.rejected, (state, action) => {
        state.remittanceStatus = "failed";
        state.remittanceError = action.payload || action.error.message;
      })
      .addCase(adjustCsoRemittance.pending, (state) => {
        state.remittanceStatus = "loading";
        state.remittanceError = null;
      })
      .addCase(adjustCsoRemittance.fulfilled, (state, action) => {
        state.remittanceStatus = "succeeded";
        const updatedCso = action.payload;
        if (updatedCso?._id) {
          const index = state.items.findIndex((cso) => cso._id === updatedCso._id);
          if (index !== -1) {
            state.items[index] = updatedCso;
          }
          if (state.selectedCso?._id === updatedCso._id) {
            state.selectedCso = updatedCso;
          }
        }
        state.lastActionId = nanoid();
      })
      .addCase(adjustCsoRemittance.rejected, (state, action) => {
        state.remittanceStatus = "failed";
        state.remittanceError = action.payload || action.error.message;
      })
      .addCase(deleteCsoRemittance.pending, (state) => {
        state.remittanceStatus = "loading";
        state.remittanceError = null;
      })
      .addCase(deleteCsoRemittance.fulfilled, (state, action) => {
        state.remittanceStatus = "succeeded";
        const updatedCso = action.payload;
        if (updatedCso?._id) {
          const index = state.items.findIndex((cso) => cso._id === updatedCso._id);
          if (index !== -1) {
            state.items[index] = updatedCso;
          }
          if (state.selectedCso?._id === updatedCso._id) {
            state.selectedCso = updatedCso;
          }
        }
        state.lastActionId = nanoid();
      })
      .addCase(deleteCsoRemittance.rejected, (state, action) => {
        state.remittanceStatus = "failed";
        state.remittanceError = action.payload || action.error.message;
      })
      .addCase(transferCustomers.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(transferCustomers.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
        state.lastActionId = nanoid();
        state.selectedCsoCustomers = []; // Clear customers list to force refetch or update manually if needed
      })
      .addCase(transferCustomers.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(deleteCso.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteCso.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter((cso) => cso._id !== action.payload);
        if (state.selectedCso?._id === action.payload) {
          state.selectedCso = null;
        }
        state.lastActionId = nanoid();
      })
      .addCase(deleteCso.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(logoutCso, () => createInitialState());

  },
});

export const { setSelectedCso, resetCsoStatus, resetCsosState, setRemittanceDeadlineAlert } = csoSlice.actions;

export default csoSlice.reducer;
