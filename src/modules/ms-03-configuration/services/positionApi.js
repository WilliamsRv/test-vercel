import axios from "axios";




const API_URL = "/api/v1/positions"; // 🌐 Base URL for the backend




// 🔹 Get all active positions
export const getAllActivePositions = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching active positions:", error);
    throw error;
  }
};




// 🔹 Get all inactive positions
export const getAllInactivePositions = async () => {
  try {
    const response = await axios.get(`${API_URL}/inactive`);
    return response.data;
  } catch (error) {
    console.error("Error fetching inactive positions:", error);
    throw error;
  }
};




// 🔹 Create a new position
export const createPosition = async (position) => {
  try {
    const response = await axios.post(API_URL, position);
    return response.data;
  } catch (error) {
    console.error("Error creating position:", error);
    throw error;
  }
};




// 🔹 Update an existing position
export const updatePosition = async (id, position) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, position);
    return response.data;
  } catch (error) {
    console.error("Error updating position:", error);
    throw error;
  }
};




// 🔹 Soft delete a position (logical deletion)
export const deletePosition = async (id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error("Error deleting position:", error);
    throw error;
  }
};




// 🔹 Restore a soft-deleted position
export const restorePosition = async (id) => {
  try {
    await axios.patch(`${API_URL}/${id}/restore`);
  } catch (error) {
    console.error("Error restoring position:", error);
    throw error;
  }
};

