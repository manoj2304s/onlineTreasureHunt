import API from "./api";

export const getLevels = async () => {
  const res = await API.get("/admin/levels");
  return res.data;
};

export const createLevel = async (data: unknown) => {
  const res = await API.post("/admin/levels", data);
  return res.data;
};

export const updateLevel = async (id: string, data: unknown) => {
  const res = await API.put(`/admin/levels/${id}`, data);
  return res.data;
};

export const deleteLevel = async (id: string) => {
  const res = await API.delete(`/admin/levels/${id}`);
  return res.data;
};
