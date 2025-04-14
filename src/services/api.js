const API_URL = 'http://localhost:4000';

// Helper function for fetch requests
async function apiRequest(url, options = {}) {
  // Add token to request if available
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: 'An unknown error occurred'
    }));
    throw new Error(error.detail || 'An unknown error occurred');
  }
  
  return response.json();
}

// Auth functions
export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append('username', email); // FastAPI OAuth expects 'username' field
  formData.append('password', password);
  
  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: 'Login failed'
    }));
    throw new Error(error.detail || 'Login failed');
  }
  
  return response.json();
}

export async function registerUser(username, email, password) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function createGame() {
  return apiRequest('/games', {
    method: 'POST',
  });
}

export async function joinGame(gameCode) {
  return apiRequest('/games/join', {
    method: 'POST',
    body: JSON.stringify({ game_code: gameCode }),
  });
}

// Character functions
export async function getCharacters() {
  return apiRequest('/characters');
}

export async function getCharacter(characterId) {
  return apiRequest(`/characters/${characterId}`);
}

// Inventory functions
export async function addInventoryItem(characterId, item) {
  return apiRequest(`/characters/${characterId}/inventory`, {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateInventoryItem(characterId, itemId, item) {
  return apiRequest(`/characters/${characterId}/inventory/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export async function deleteInventoryItem(characterId, itemId, quantity = 1) {
  return apiRequest(`/characters/${characterId}/inventory/${itemId}?quantity=${quantity}`, {
    method: 'DELETE',
  });
}

export async function equipItem(characterId, slotType, itemId) {
  return apiRequest(`/characters/${characterId}/equipment`, {
    method: 'PUT',
    body: JSON.stringify({ slot_type: slotType, item_id: itemId }),
  });
}

export async function updateMoney(characterId, amount) {
  return apiRequest(`/characters/${characterId}/money`, {
    method: 'PUT',
    body: JSON.stringify({ amount }),
  });
}