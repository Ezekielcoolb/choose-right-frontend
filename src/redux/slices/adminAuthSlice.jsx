import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

const ADMIN_TOKEN_KEY = "token"; // Based on client.js expectation

export const signupAdmin = createAsyncThunk(
  "adminAuth/signup",
  async (adminData, thunkAPI) => {
    try {
      const response = await apiClient.post("/admin-auth/signup", adminData);
      const { token, admin } = response.data || {};

      if (token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      }

      return { token, admin };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const loginAdmin = createAsyncThunk(
  "adminAuth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await apiClient.post("/admin-auth/login", { email, password });
      const { token, admin } = response.data || {};

      if (token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      }

      return { token, admin };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchAdminProfile = createAsyncThunk(
  "adminAuth/me",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/admin-auth/me");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const changeAdminPassword = createAsyncThunk(
  "adminAuth/changePassword",
  async ({ currentPassword, newPassword }, thunkAPI) => {
    try {
      const response = await apiClient.put("/admin-auth/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const getInitialToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) || null;

const initialState = {
  token: getInitialToken(),
  admin: null,
  status: "idle",
  error: null,
  profileStatus: "idle",
  profileError: null,
  passwordChangeStatus: "idle",
  passwordChangeError: null,
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    logoutAdmin(state) {
      state.token = null;
      state.admin = null;
      state.status = "idle";
      state.error = null;
      state.profileStatus = "idle";
      state.profileError = null;
      state.passwordChangeStatus = "idle";
      state.passwordChangeError = null;
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    },
    setAdminToken(state, action) {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem(ADMIN_TOKEN_KEY, action.payload);
      } else {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    },
    resetPasswordChangeState(state) {
      state.passwordChangeStatus = "idle";
      state.passwordChangeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signupAdmin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signupAdmin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admin = action.payload?.admin || null;
        state.token = action.payload?.token || null;
      })
      .addCase(signupAdmin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message;
      })
      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admin = action.payload?.admin || null;
        state.token = action.payload?.token || null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message;
      })
      // Profile
      .addCase(fetchAdminProfile.pending, (state) => {
        state.profileStatus = "loading";
        state.profileError = null;
      })
      .addCase(fetchAdminProfile.fulfilled, (state, action) => {
        state.profileStatus = "succeeded";
        state.admin = action.payload || null;
      })
      .addCase(fetchAdminProfile.rejected, (state, action) => {
        state.profileStatus = "failed";
        state.profileError = action.payload || action.error?.message;
        const message = (state.profileError || "").toLowerCase();
        if (message.includes("invalid") || message.includes("expired") || message.includes("unauthorized")) {
          state.token = null;
          state.admin = null;
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        }
      })
      // Change Password
      .addCase(changeAdminPassword.pending, (state) => {
        state.passwordChangeStatus = "loading";
        state.passwordChangeError = null;
      })
      .addCase(changeAdminPassword.fulfilled, (state) => {
        state.passwordChangeStatus = "succeeded";
      })
      .addCase(changeAdminPassword.rejected, (state, action) => {
        state.passwordChangeStatus = "failed";
        state.passwordChangeError = action.payload || action.error?.message;
      });
  },
});

export const { logoutAdmin, setAdminToken, resetPasswordChangeState } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
