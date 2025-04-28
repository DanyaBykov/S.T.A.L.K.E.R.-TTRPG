import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCharacters, getCharacter, addInventoryItem, updateInventoryItem, deleteInventoryItem, equipItem, updateMoney } from '../services/api.js';
import './InventorySystem.css';

const InventorySystem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [characterId, setCharacterId] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [equipment, setEquipment] = useState({
    headgear: null,
    armor: null,
    primary: null,
    secondary: null,
    tool: null,
    pistol: null
  });
  const [capacity, setCapacity] = useState(80);
  const [draggedItem, setDraggedItem] = useState(null);
  const [money, setMoney] = useState(10000);
  const [isMoneyMenuOpen, setIsMoneyMenuOpen] = useState(false);
  const [moneyChangeAmount, setMoneyChangeAmount] = useState(0);
  const [isAddItemMenuOpen, setIsAddItemMenuOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    type: '',
    quantity: 1,
    weight: 0,
    notes: '',
  });
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteQuantity, setDeleteQuantity] = useState(1);
  const totalQuickSlots = 6; // Total quick slots

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      return;
    }

    async function loadCharacterData() {
      try {
        setLoading(true);
        const characters = await getCharacters();
        if (characters.length === 0) {
          setError("No characters found. Please join a game first.");
          return;
        }
        const charId = characters[0].id;
        setCharacterId(charId);
        const characterData = await getCharacter(charId);
        setInventoryItems(characterData.inventory || []);
        setEquipment(characterData.equipment || {});
        setMoney(characterData.money || 10000);
        setCapacity(characterData.capacity || 80);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCharacterData();
  }, [navigate]);

  // Calculate total weight including inventory and equipment
  const calculateTotalWeight = () => {
    const inventoryWeight = inventoryItems.reduce((total, item) => total + item.total_weight, 0);
    const equipmentWeight = Object.values(equipment).reduce((total, item) => {
      if (item) {
        return total + (item.total_weight || item.weight);
      }
      return total;
    }, 0);
    return inventoryWeight + equipmentWeight;
  };

  const handleMoneyChange = async (amount) => {
    if (!characterId) return;
    try {
      const response = await updateMoney(characterId, amount);
      setMoney(response.money);
    } catch (err) {
      setError("Failed to update money: " + err.message);
    }
  };

  const toggleMoneyMenu = () => {
    setIsMoneyMenuOpen((prev) => !prev);
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
  };

  const toggleAddItemMenu = () => {
    setIsAddItemMenuOpen((prev) => !prev);
  };

  const handleDeleteItem = async () => {
    if (!characterId || !deleteItem) return;
    try {
      await deleteInventoryItem(characterId, deleteItem.id, deleteQuantity);
      if (deleteQuantity >= deleteItem.quantity) {
        setInventoryItems(inventoryItems.filter((item) => item.id !== deleteItem.id));
      } else {
        const updatedItems = inventoryItems.map((item) =>
          item.id === deleteItem.id
            ? {
                ...item,
                quantity: item.quantity - deleteQuantity,
                total_weight: item.total_weight - deleteItem.weight * deleteQuantity,
              }
            : item
        );
        setInventoryItems(updatedItems);
      }
      setDeleteItem(null);
    } catch (err) {
      setError("Failed to delete item: " + err.message);
    }
  };

  const handleRightClick = (e, item) => {
    e.preventDefault();
    setDeleteItem(item);
    setDeleteQuantity(1);
  };

  const handleAddItem = async () => {
    if (!characterId) return;
    // Calculate weight that this item will add
    const additionalWeight = newItem.quantity * newItem.weight;
    const currentWeight = calculateTotalWeight();
    if (currentWeight + additionalWeight > capacity) {
      alert("Cannot add item(s): Total weight exceeds capacity.");
      return;
    }
    if (newItem.name && newItem.type && newItem.weight > 0 && newItem.quantity > 0) {
      try {
        const addedItem = await addInventoryItem(characterId, newItem);
        setInventoryItems([...inventoryItems, addedItem]);
        setNewItem({ name: '', type: '', quantity: 1, weight: 0, notes: '' });
        setIsAddItemMenuOpen(false);
      } catch (err) {
        setError("Failed to add item: " + err.message);
      }
    }
  };

  const usedQuickSlots = useMemo(() => {
    let used = 0;
    ['headgear', 'armor'].forEach(slot => {
      if (equipment[slot] && equipment[slot].quick_slots) {
        used += equipment[slot].quick_slots;
      }
    });
    return used;
  }, [equipment]);

  // (Optional) Keeping this helper if you ever need it separately
  const calculateUsedQuickSlots = () => {
    let used = 0;
    ['headgear', 'armor'].forEach(slot => {
      if (equipment[slot] && equipment[slot].quick_slots) {
        used += equipment[slot].quick_slots;
      }
    });
    return used;
  };

  const renderQuickAccess = () => {
    return (
      <div className="quick-access-grid">
        {Array.from({ length: totalQuickSlots }, (_, i) => i + 1).map((slot) => (
          <div
            key={slot}
            className={`quick-slot ${slot <= usedQuickSlots ? 'occupied-slot' : ''}`}
          >
            Slot {slot}
          </div>
        ))}
      </div>
    );
  };

  const handleEquipmentDrop = async (e, slotType) => {
    e.preventDefault();
    if (!characterId || !draggedItem) return;
    
    let canEquip = false;
    if (draggedItem.type === slotType) canEquip = true;
    if (draggedItem.type === 'weapon' && (slotType === 'primary' || slotType === 'secondary'))
      canEquip = true;
    
    // For headgear and armor, ensure quick slot requirement is met.
    if ((draggedItem.type === 'headgear' || draggedItem.type === 'armor') && draggedItem.quick_slots) {
      const originalSlot = Object.keys(equipment).find(key => equipment[key]?.id === draggedItem.id) || '';
      let originalConsumption = 0;
      if (originalSlot && (originalSlot === 'headgear' || originalSlot === 'armor')) {
        originalConsumption = equipment[originalSlot].quick_slots || 0;
      }
      const used = calculateUsedQuickSlots();
      const free = totalQuickSlots - (used - originalConsumption);
      if (draggedItem.quick_slots > free) {
        alert("Not enough quick slots available. Item cannot be equipped.");
        setDraggedItem(null);
        return;
      }
      canEquip = true;
    }
    
    if (canEquip) {
      try {
        await equipItem(characterId, slotType, draggedItem.id);
        const currentItem = equipment[slotType];
        const newEquipment = { ...equipment, [slotType]: draggedItem };
        const originalSlot = Object.keys(equipment).find(key => equipment[key]?.id === draggedItem.id);
        if (originalSlot && originalSlot !== slotType) {
          newEquipment[originalSlot] = null;
        }
        let newInventory = inventoryItems.filter(item => item.id !== draggedItem.id);
        if (currentItem) newInventory.push(currentItem);
        setEquipment(newEquipment);
        setInventoryItems(newInventory);
      } catch (err) {
        alert("Please move weapon back to the inventory first and then equip it.");
      }
    }
    setDraggedItem(null);
  };

  const handleInventoryDrop = async (e) => {
    e.preventDefault();
    if (!characterId || !draggedItem) return;
    
    if (Object.values(equipment).includes(draggedItem)) {
      const slotKey = Object.keys(equipment).find(key => equipment[key]?.id === draggedItem.id);
      if (slotKey) {
        try {
          await equipItem(characterId, slotKey, null);
          
          setInventoryItems([...inventoryItems, draggedItem]);
          const newEquipment = { ...equipment };
          newEquipment[slotKey] = null;
          setEquipment(newEquipment);
        } catch (err) {
          setError("Failed to unequip item: " + err.message);
        }
      }
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const itemTypes = ['headgear', 'armor', 'weapon', 'consumable', 'tool', 'pistol'];

  if (loading) {
    return <div className="loading">Loading character data...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="main-content">
        <div className="equipment-panel">
          <div className="header">EQUIPMENT</div>
          <div className="equipment-grid">
            {['primary', 'headgear', 'armor', 'secondary', 'tool', 'pistol'].map(slotType => (
              <div
                key={slotType}
                className="equipment-slot"
                onDrop={(e) => handleEquipmentDrop(e, slotType)}
                onDragOver={handleDragOver}
              >
                {equipment[slotType] ? (
                  <div
                    className="equipment-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, equipment[slotType])}
                  >
                    <div className="text-center">
                      <div className="item-name">{equipment[slotType].name}</div>
                      <div className="item-icon">{slotType === 'headgear' ? '🥽' : '🔧'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="slot-label">
                    {slotType.charAt(0).toUpperCase() + slotType.slice(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="quick-access">
            <div className="quick-access-label">QUICK ACCESS</div>
            {renderQuickAccess()}
          </div>
        </div>
        <div className="inventory-panel">
          <div className="inventory-header">
            <div>INVENTORY</div>
            <div className="money-menu">
              <button className="money-button" onClick={toggleMoneyMenu}>
                {isMoneyMenuOpen ? 'Close Money Menu' : 'Open Money Menu'}
              </button>
              {isMoneyMenuOpen && (
                <div className="money-menu-content">
                  <input
                    type="number"
                    value={moneyChangeAmount}
                    onChange={(e) => setMoneyChangeAmount(Number(e.target.value))}
                    placeholder="Change Amount"
                    className='money-input'
                  />
                  <button onClick={() => handleMoneyChange(moneyChangeAmount)}>Add</button>
                  <button onClick={() => handleMoneyChange(-moneyChangeAmount)}>Remove</button>
                </div>
              )}
            </div>
            <div className="money-display">{money} грн</div>
          </div>
          <div className="inventory-table-container" onDrop={handleInventoryDrop} onDragOver={handleDragOver}>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Тип</th>
                  <th>Кількість</th>
                  <th>Вага (1 шт.)</th>
                  <th>Загальна вага</th>
                  <th>Ваші нотатки про предмет</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(item => (
                  <tr
                    key={item.id}
                    className="inventory-row"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onContextMenu={(e) => handleRightClick(e, item)} 
                  >
                    <td>{item.name}</td>
                    <td className="text-center">{item.type}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-center">{item.weight}</td>
                    <td className="text-center">{item.total_weight}</td>
                    <td className="text-center">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="weight-display">
            <button className="add-item-button" onClick={toggleAddItemMenu}>Add Item</button>
            <div className="weight-indicator">{calculateTotalWeight()}/{capacity} кг</div>
          </div>
        </div>
      </div>
      {isAddItemMenuOpen && (
        <div className="add-item-menu">
          <h3>Add New Item</h3>
          <input
            type="text"
            placeholder="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <select
            value={newItem.type}
            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
          >
            <option value="" disabled>Select Type</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Weight"
            value={newItem.weight}
            onChange={(e) => setNewItem({ ...newItem, weight: Number(e.target.value) })}
          />
          <textarea
            placeholder="Notes"
            value={newItem.notes}
            onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
          />
          <button onClick={handleAddItem}>Add</button>
          <button onClick={toggleAddItemMenu}>Cancel</button>
        </div>
      )}
      {deleteItem && (
        <div className="window-overlay">
          <div className="delete-item-window">
            <h3>Delete Item</h3>
            <p>{`Delete ${deleteItem.name}?`}</p>
            <input
              type="number"
              min="1"
              max={deleteItem.quantity}
              value={deleteQuantity}
              onChange={(e) => setDeleteQuantity(Number(e.target.value))}
              placeholder="Quantity to delete"
            />
            <div className="window-buttons">
              <button onClick={handleDeleteItem}>Confirm</button>
              <button onClick={() => setDeleteItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySystem;