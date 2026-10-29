export const getCurrentUserId = () => {
  if (typeof window !== "undefined") {
    return Number(localStorage.getItem("signflow_user_id")) || 1;
  }
  return 1;
};
