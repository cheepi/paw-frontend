import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
	tempEmail: string | null;
	demoOtp: string | null;
}

const initialState: AuthState = {
	tempEmail: null,
	demoOtp: null,
};

export const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setTempEmail: (state, action: PayloadAction<string>) => {
			state.tempEmail = action.payload;
		},

    setDemoOtp: (
			state,
			action: PayloadAction<string | null>
		) => {
			state.demoOtp = action.payload;
		},

    clearTempEmail: (state) => {
			state.tempEmail = null;
			state.demoOtp = null; // pastiin ke-clear juga
		},
	},
});

export const { setTempEmail, setDemoOtp, clearTempEmail } =
	authSlice.actions;

export default authSlice.reducer;