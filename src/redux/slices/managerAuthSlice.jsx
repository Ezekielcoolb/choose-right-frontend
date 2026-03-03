import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient, { setAuthToken } from "../../api/client";

const MANAGER_TOKEN_KEY = "manager_token";

export const loginManager = createAsyncThunk(
  "managerAuth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await apiClient.post("/manager-auth/login", { email, password });
      const { token, manager } = response.data || {};

      if (token) {
        localStorage.setItem(MANAGER_TOKEN_KEY, token);
      }

      return { token, manager };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchManagerProfile = createAsyncThunk(
  "managerAuth/me",
  async (_, thunkAPI) => {
    try {
      const response = await apiClient.get("/manager-auth/me");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const changeManagerPassword = createAsyncThunk(
  "managerAuth/changePassword",
  async ({ currentPassword, newPassword }, thunkAPI) => {
    try {
      const response = await apiClient.post("/manager-auth/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "managerAuth/forgotPassword",
  async ({ email, newPassword }, thunkAPI) => {
    try {
      const response = await apiClient.post("/manager-auth/forgot-password", {
        email,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const getInitialToken = () => localStorage.getItem(MANAGER_TOKEN_KEY) || null;

const initialToken = getInitialToken();
if (initialToken) {
  setAuthToken(initialToken);
}

const initialState = {
  token: initialToken,
  manager: null,
  status: "idle",
  error: null,
  profileStatus: "idle",
  profileError: null,
  changePasswordStatus: "idle",
  changePasswordError: null,
  changePasswordMessage: null,
  forgotPasswordStatus: "idle",
  forgotPasswordError: null,
  forgotPasswordMessage: null,
};

const managerAuthSlice = createSlice({
  name: "managerAuth",
  initialState,
  reducers: {
    logoutManager(state) {
      state.token = null;
      state.manager = null;
      state.status = "idle";
      state.error = null;
      state.profileStatus = "idle";
      state.profileError = null;
      state.changePasswordStatus = "idle";
      state.changePasswordError = null;
      state.changePasswordMessage = null;
      localStorage.removeItem(MANAGER_TOKEN_KEY);
      setAuthToken(null);
    },
    setManagerToken(state, action) {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem(MANAGER_TOKEN_KEY, action.payload);
        setAuthToken(action.payload);
      } else {
        localStorage.removeItem(MANAGER_TOKEN_KEY);
        setAuthToken(null);
      }
      state.changePasswordMessage = null;
    },
    resetPasswordStatus(state) {
      state.forgotPasswordStatus = "idle";
      state.forgotPasswordError = null;
      state.forgotPasswordMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginManager.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.changePasswordMessage = null;
      })
      .addCase(loginManager.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.manager = action.payload?.manager || null;
        state.token = action.payload?.token || null;
        state.error = null;
        if (state.token) {
          setAuthToken(state.token);
        }
      })
      .addCase(loginManager.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message;
        setAuthToken(null);
      })
      .addCase(fetchManagerProfile.pending, (state) => {
        state.profileStatus = "loading";
        state.profileError = null;
      })
      .addCase(fetchManagerProfile.fulfilled, (state, action) => {
        state.profileStatus = "succeeded";
        state.manager = action.payload || null;
      })
      .addCase(fetchManagerProfile.rejected, (state, action) => {
        state.profileStatus = "failed";
        state.profileError = action.payload || action.error?.message;
        const message = (state.profileError || "").toLowerCase();
        if (message.includes("invalid") || message.includes("expired")) {
          state.token = null;
          state.manager = null;
          localStorage.removeItem(MANAGER_TOKEN_KEY);
          setAuthToken(null);
        }
      })
      .addCase(changeManagerPassword.pending, (state) => {
        state.changePasswordStatus = "loading";
        state.changePasswordError = null;
        state.changePasswordMessage = null;
      })
      .addCase(changeManagerPassword.fulfilled, (state, action) => {
        state.changePasswordStatus = "succeeded";
        state.changePasswordMessage = action.payload?.message || "Password updated successfully";
      })
      .addCase(changeManagerPassword.rejected, (state, action) => {
        state.changePasswordStatus = "failed";
        state.changePasswordError = action.payload || action.error?.message;
        state.changePasswordMessage = null;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordStatus = "loading";
        state.forgotPasswordError = null;
        state.forgotPasswordMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotPasswordStatus = "succeeded";
        state.forgotPasswordMessage = action.payload?.message || "Password reset successfully";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordStatus = "failed";
        state.forgotPasswordError = action.payload || action.error?.message;
        state.forgotPasswordMessage = null;
      });
  },
});

export const { logoutManager, setManagerToken, resetPasswordStatus } = managerAuthSlice.actions;
export default managerAuthSlice.reducer;
