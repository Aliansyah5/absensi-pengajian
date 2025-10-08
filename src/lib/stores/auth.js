import { writable } from "svelte/store";
import { browser } from "$app/environment";

// Create the auth store
function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  return {
    subscribe,
    login: (user) => {
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Store user info in localStorage for persistence
      if (browser) {
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
    },
    logout: () => {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Clear localStorage
      if (browser) {
        localStorage.removeItem("auth_user");
      }
    },
    setLoading: (isLoading) => {
      update((state) => ({ ...state, isLoading }));
    },
    initialize: () => {
      // Check if user is stored in localStorage
      if (browser) {
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            console.error("Error parsing stored user:", error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    },
  };
}

export const auth = createAuthStore();

// Helper function to check user role
export const hasRole = (requiredRole) => {
  let currentUser = null;
  auth.subscribe((state) => {
    currentUser = state.user;
  })();

  if (!currentUser?.profile) return false;

  const userRole = currentUser.profile.role;

  // Role hierarchy: super_admin > admin
  if (requiredRole === "admin") {
    return userRole === "admin" || userRole === "super_admin";
  }

  if (requiredRole === "super_admin") {
    return userRole === "super_admin";
  }

  return false;
};
