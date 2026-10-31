import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  street: string;
  landmark?: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'order_manager' | 'inventory_manager' | 'catalog_manager' | 'customer_support' | 'finance' | 'customer';
  phone?: string;
  addresses: UserAddress[];
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
  returnUrlAfterAuth?: string;
}

const TOKEN_KEY = 'novara_auth_token_v1';
const USER_KEY = 'novara_auth_user_v1';

function getInitialToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

function getInitialUser(): UserProfile | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

const initialToken = getInitialToken();
const initialUser = getInitialUser();

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),
  isAuthModalOpen: false,
  authModalMode: 'login',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserProfile; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isAuthModalOpen = false;

      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user));
      }
    },
    updateUserAddresses: (state, action: PayloadAction<UserAddress[]>) => {
      if (state.user) {
        state.user.addresses = action.payload;
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(state.user));
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    },
    openAuthModal: (
      state,
      action: PayloadAction<{ mode?: 'login' | 'register' | 'forgot'; returnUrl?: string } | undefined>
    ) => {
      state.isAuthModalOpen = true;
      state.authModalMode = action?.payload?.mode || 'login';
      state.returnUrlAfterAuth = action?.payload?.returnUrl;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
      state.returnUrlAfterAuth = undefined;
    },
    setAuthModalMode: (state, action: PayloadAction<'login' | 'register' | 'forgot'>) => {
      state.authModalMode = action.payload;
    },
  },
});

export const {
  setCredentials,
  updateUserAddresses,
  logout,
  openAuthModal,
  closeAuthModal,
  setAuthModalMode,
} = authSlice.actions;

export default authSlice.reducer;
