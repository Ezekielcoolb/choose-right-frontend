import { createSlice, createAsyncThunk, nanoid } from "@reduxjs/toolkit";
import apiClient from "../../api/client";
import { logoutCso } from "./csoAuthSlice.jsx";

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  const result = query.toString();
  return result ? `?${result}` : "";
};

export const fetchCustomers = createAsyncThunk(
  "customers/fetchAll",
  async (params = {}, thunkAPI) => {
    try {
      const { admin, ...queryParams } = params || {};
      if (admin) {
        queryParams.admin = undefined;
      }
      const query = buildQueryString(queryParams);
      const endpoint = admin ? `/admin/customers${query}` : `/customers${query}`;
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createCustomer = createAsyncThunk(
  "customers/create",
  async (payload, thunkAPI) => {
    try {
      const response = await apiClient.post("/customers", payload);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchCustomerById = createAsyncThunk(
  "customers/fetchById",
  async (payload, thunkAPI) => {
    try {
      const isObjectPayload = typeof payload === "object" && payload !== null;
      const customerId = isObjectPayload ? payload.customerId : payload;
      const admin = Boolean(isObjectPayload && payload.admin);

      if (!customerId) {
        throw new Error("Customer ID is required");
      }

      const endpoint = admin ? `/admin/customers/${customerId}` : `/customers/${customerId}`;
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateCustomer = createAsyncThunk(
  "customers/update",
  async ({ customerId, updates }, thunkAPI) => {
    try {
      const response = await apiClient.put(`/customers/${customerId}`, updates);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const archiveCustomer = createAsyncThunk(
  "customers/archive",
  async (customerId, thunkAPI) => {
    try {
      const response = await apiClient.patch(`/customers/${customerId}/archive`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteCustomer = createAsyncThunk(
  "customers/delete",
  async (payload, thunkAPI) => {
    try {
      const isObjectPayload = typeof payload === "object" && payload !== null;
      const customerId = isObjectPayload ? payload.customerId : payload;
      const admin = Boolean(isObjectPayload && payload.admin);

      if (!customerId) {
        throw new Error("Customer ID is required");
      }

      const endpoint = admin ? `/admin/customers/${customerId}` : `/customers/${customerId}`;
      await apiClient.delete(endpoint);
      return { customerId };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteCustomers = createAsyncThunk(
  "customers/bulkDelete",
  async (payload, thunkAPI) => {
    try {
      const { customerIds, admin } = payload;
      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        throw new Error("Customer IDs are required");
      }

      const endpoint = admin ? "/admin/customers/bulk-delete" : "/customers/bulk-delete";
      await apiClient.post(endpoint, { customerIds });
      return { customerIds };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const createInitialState = () => ({
  items: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
  selectedCustomer: null,
  savingsPlansByCustomer: {},
  totals: { totalPlans: 0, activePlans: 0, totalDeposited: 0, availableBalance: 0, totalFees: 0, totalWithdrawn: 0 },
  lastActionId: null,
});

const initialState = createInitialState();

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearCustomerState(state) {
      state.mutationStatus = "idle";
      state.mutationError = null;
      state.selectedCustomer = null;
    },
    resetCustomersState: () => createInitialState(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
        state.totals = action.payload.totals || state.totals;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createCustomer.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items.unshift(action.payload);
        state.lastActionId = nanoid();
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(fetchCustomerById.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.selectedCustomer = action.payload.customer;
        state.savingsPlansByCustomer[action.payload.customer._id] = action.payload.savingsPlans;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const idx = state.items.findIndex((customer) => customer._id === action.payload._id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.selectedCustomer?._id === action.payload._id) {
          state.selectedCustomer = action.payload;
        }
        state.lastActionId = nanoid();
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(deleteCustomer.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter((customer) => customer._id !== action.payload.customerId);
        delete state.savingsPlansByCustomer[action.payload.customerId];
        if (state.selectedCustomer?._id === action.payload.customerId) {
          state.selectedCustomer = null;
        }
        state.lastActionId = nanoid();
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(deleteCustomers.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteCustomers.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const deletedIds = action.payload.customerIds;
        state.items = state.items.filter((customer) => !deletedIds.includes(customer._id));
        deletedIds.forEach((id) => {
          delete state.savingsPlansByCustomer[id];
        });
        if (state.selectedCustomer && deletedIds.includes(state.selectedCustomer._id)) {
          state.selectedCustomer = null;
        }
        state.lastActionId = nanoid();
      })
      .addCase(deleteCustomers.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(archiveCustomer.fulfilled, (state, action) => {
        const idx = state.items.findIndex((customer) => customer._id === action.payload._id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.selectedCustomer?._id === action.payload._id) {
          state.selectedCustomer = action.payload;
        }
        state.lastActionId = nanoid();
      })
      .addCase(archiveCustomer.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload || action.error.message;
      })
      .addCase(logoutCso, () => createInitialState());
  },
});

export const { clearCustomerState, resetCustomersState } = customersSlice.actions;

export default customersSlice.reducer;
