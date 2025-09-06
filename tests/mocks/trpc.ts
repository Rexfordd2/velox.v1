export const api = {
  posts: {
    list: { useQuery: () => ({ data: [], isLoading: false }) },
  },
} as any;

export default { api };


