import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      isLoggedIn: false,
      user: null,
      
      // Jobs state
      jobs: [],
      searchTerm: '',
      locationFilter: '',
      typeFilter: '',
      
      // Auth actions
      setUser: (user) => set({ 
        user, 
        isLoggedIn: !!user 
      }),
      
      setLoginStatus: (status) => set({ 
        isLoggedIn: status 
      }),
      
      logout: () => set({ 
        user: null, 
        isLoggedIn: false 
      }),
      
      // Jobs actions
      setJobs: (jobs) => set({ jobs }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setLocationFilter: (location) => set({ locationFilter: location }),
      setTypeFilter: (type) => set({ typeFilter: type }),
      
      // Session management
      initializeFromSession: (session) => {
        if (session?.user) {
          set({
            user: session.user,
            isLoggedIn: true
          });
        } else {
          set({
            user: null,
            isLoggedIn: false
          });
        }
      },
      
      // Update user data
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: 'at-bench-storage',
      partialize: (state) => ({
        // Only persist these values
        searchTerm: state.searchTerm,
        locationFilter: state.locationFilter,
        typeFilter: state.typeFilter,
      }),
    }
  )
);

export default useStore;