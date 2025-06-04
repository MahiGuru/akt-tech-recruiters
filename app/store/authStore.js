import { create } from 'zustand';

const useStore = create((set) => ({
  isLoggedIn: false,
  jobs: [],
  searchTerm: '',
  locationFilter: '',
  typeFilter: '',
  setLoginStatus: (status) => set({ isLoggedIn: status }),
  setJobs: (jobs) => set({ jobs }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setLocationFilter: (location) => set({ locationFilter: location }),
  setTypeFilter: (type) => set({ typeFilter: type }),
}));

export default useStore;