import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient, { setAuthToken } from "../../api/client";

const CUSTOMER_TOKEN_KEY = "customer_token";

export const loginCustomer = createAsyncThunk(
  "customerAuth/login",
  async ({ identifier, password }, thunkAPI) => {
    try {
      const response = await apiClient.post("/customer/auth/login", { identifier, password });
      const { token, customer } = response.data || {};

      if (token) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
        setAuthToken(token);
      }

      return { token, customer };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchCustomerProfile = createAsyncThunk(
  "customerAuth/profile",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/customer/auth/profile");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const changePassword = createAsyncThunk(
  "customerAuth/changePassword",
  async ({ currentPassword, newPassword }, thunkAPI) => {
    try {
      const response = await apiClient.post("/customer/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "customerAuth/resetPassword",
  async ({ identifier, newPassword }, thunkAPI) => {
    try {
      const response = await apiClient.post("/customer/auth/forgot-password", {
        identifier,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const getInitialToken = () => localStorage.getItem(CUSTOMER_TOKEN_KEY) || null;

const initialToken = getInitialToken();
// Note: setAuthToken might conflict if multiple roles are logged in on the same browser session.
// In a real app, you'd want a more robust way to handle tokens per role.
if (initialToken) {
  setAuthToken(initialToken);
}

const initialState = {
  token: initialToken,
  customer: null,
  status: "idle",
  error: null,
  profileStatus: "idle",
  profileError: null,
  passwordStatus: "idle",
  passwordError: null,
};

const customerAuthSlice = createSlice({
  name: "customerAuth",
  initialState,
  reducers: {
    logoutCustomer(state) {
      state.token = null;
      state.customer = null;
      state.status = "idle";
      state.error = null;
      state.profileStatus = "idle";
      state.profileError = null;
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      setAuthToken(null);
    },
    setCustomerToken(state, action) {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, action.payload);
        setAuthToken(action.payload);
      } else {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        setAuthToken(null);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginCustomer.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginCustomer.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.customer = action.payload?.customer || null;
        state.token = action.payload?.token || null;
      })
      .addCase(loginCustomer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message;
      })
      .addCase(fetchCustomerProfile.pending, (state) => {
        state.profileStatus = "loading";
        state.profileError = null;
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        state.profileStatus = "succeeded";
        state.customer = action.payload || null;
      })
      .addCase(fetchCustomerProfile.rejected, (state, action) => {
        state.profileStatus = "failed";
        state.profileError = action.payload || action.error?.message;
        const message = (state.profileError || "").toLowerCase();
        if (message.includes("invalid") || message.includes("expired")) {
          state.token = null;
          state.customer = null;
          localStorage.removeItem(CUSTOMER_TOKEN_KEY);
          setAuthToken(null);
        }
      })
      .addCase(changePassword.pending, (state) => {
        state.passwordStatus = "loading";
        state.passwordError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordStatus = "succeeded";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordStatus = "failed";
        state.passwordError = action.payload || action.error?.message;
      })
      .addCase(resetPassword.pending, (state) => {
        state.passwordStatus = "loading";
        state.passwordError = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.passwordStatus = "succeeded";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordStatus = "failed";
        state.passwordError = action.payload || action.error?.message;
      });
  },
});

export const { logoutCustomer, setCustomerToken } = customerAuthSlice.actions;
export default customerAuthSlice.reducer;
