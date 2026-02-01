import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient, { setAuthToken } from "../../api/client";

const TOKEN_KEY = "cso_token";

const persistToken = (token) => {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
};

const getInitialToken = () => localStorage.getItem(TOKEN_KEY) || null;

export const loginCso = createAsyncThunk("csoAuth/login", async ({ identifier, password }, thunkAPI) => {
  try {
    const response = await apiClient.post("/cso-auth/login", { identifier, password });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const fetchCsoProfile = createAsyncThunk("csoAuth/me", async (_, thunkAPI) => {
  try {
    const response = await apiClient.get("/cso-auth/me");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const changeCsoPassword = createAsyncThunk(
  "csoAuth/changePassword",
  async ({ currentPassword, newPassword }, thunkAPI) => {
    try {
      const response = await apiClient.post("/cso-auth/change-password", { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  token: getInitialToken(),
  profile: null,
  status: "idle",
  error: null,
  passwordStatus: "idle",
  passwordError: null,
  passwordMessage: null,
};

const csoAuthSlice = createSlice({
  name: "csoAuth",
  initialState,
  reducers: {
    logoutCso(state) {
      state.token = null;
      state.profile = null;
      state.status = "idle";
      state.error = null;
      persistToken(null);
      setAuthToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginCso.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginCso.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.profile = action.payload.cso;
        persistToken(action.payload.token);
        setAuthToken(action.payload.token);
      })
      .addCase(loginCso.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchCsoProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCsoProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload;
      })
      .addCase(fetchCsoProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        const message = (action.payload || "").toString().toLowerCase();
        if (message.includes("invalid") || message.includes("expired")) {
          state.token = null;
          state.profile = null;
          persistToken(null);
          setAuthToken(null);
        }
      })
      .addCase(changeCsoPassword.pending, (state) => {
        state.passwordStatus = "loading";
        state.passwordError = null;
        state.passwordMessage = null;
      })
      .addCase(changeCsoPassword.fulfilled, (state, action) => {
        state.passwordStatus = "succeeded";
        state.passwordMessage = action.payload?.message || "Password updated successfully";
      })
      .addCase(changeCsoPassword.rejected, (state, action) => {
        state.passwordStatus = "failed";
        state.passwordError = action.payload || action.error.message;
      });
  },
});

export const { logoutCso } = csoAuthSlice.actions;

export default csoAuthSlice.reducer;
