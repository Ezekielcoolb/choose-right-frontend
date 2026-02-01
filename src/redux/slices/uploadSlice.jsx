import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/client";

export const uploadFile = createAsyncThunk(
  "upload/uploadFile",
  async ({ file, folderName }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(`/fileupload/${folderName}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data; // Expecting { message, data: url }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  uploading: false,
  error: null,
  lastUploadedUrl: null,
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    clearUploadState: (state) => {
      state.uploading = false;
      state.error = null;
      state.lastUploadedUrl = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.error = null;
        state.lastUploadedUrl = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.lastUploadedUrl = action.payload.data;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUploadState } = uploadSlice.actions;
export default uploadSlice.reducer;
