const API_URL = '';

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

export const getItemTypes = async () => {
  try {
    const response = await fetch('/api/item-types');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching item types:', error);
    return [
      {"id": "weapons", "name": "Weapons"},
      {"id": "armor", "name": "Armor"},
      {"id": "ammo", "name": "Ammunition"},
      {"id": "medicine", "name": "Medicine"},
      {"id": "food", "name": "Food"},
      {"id": "artifacts", "name": "Artifacts"}
    ];
  }
};

export const getItemsByType = async (type) => {
  try {
    const response = await fetch(`/api/items/${type}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching items for type ${type}:`, error);
    return getMockItemsByType(type);
  }
};

function getMockItemsByType(type) {
  const mockItems = {
    weapons: [
      { id: 'w1', name: 'AK-47', weight: 3.8, type: 'weapons', damage: '1d8+2' },
      { id: 'w2', name: 'Pistol PM', weight: 0.8, type: 'weapons', damage: '1d6' },
    ],
    armor: [
      { id: 'a1', name: 'Stalker Suit', weight: 5.0, type: 'armor', protection: 'P:3 R:2 C:1' },
      { id: 'a2', name: 'Leather Jacket', weight: 2.0, type: 'armor', protection: 'P:1 R:0 C:0' },
    ],
    ammo: [
      { id: 'am1', name: '5.45x39mm', weight: 0.01, type: 'ammo' },
      { id: 'am2', name: '9x18mm', weight: 0.01, type: 'ammo' },
    ],
    medicine: [
      { id: 'med1', name: 'Medkit', weight: 0.3, type: 'medicine' },
      { id: 'med2', name: 'Bandage', weight: 0.1, type: 'medicine' },
    ],
    food: [
      { id: 'f1', name: 'Canned Food', weight: 0.4, type: 'food' },
      { id: 'f2', name: 'Bread', weight: 0.2, type: 'food' },
    ],
    artifacts: [
      { id: 'art1', name: 'Medusa', weight: 0.5, type: 'artifacts' },
      { id: 'art2', name: 'Stone Flower', weight: 0.7, type: 'artifacts' },
    ]
  };
  
  return mockItems[type] || [];
}