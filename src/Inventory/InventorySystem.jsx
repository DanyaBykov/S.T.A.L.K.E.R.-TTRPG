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
    pistol: null,
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
  const [quickSlots, setQuickSlots] = useState(Array(totalQuickSlots).fill(null));

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

  const handleQuickSlotDragStart = (e, slotIndex, slotItem) => {
    e.stopPropagation();
    let dragged;
    // For medication, merge the full item data with the current stacked quantity.
    if (slotItem.type === 'medication') {
      dragged = { ...slotItem.item, quantity: slotItem.quantity, quickSlotIndex: slotIndex };
    } else if (slotItem.type === 'magazine') {
      dragged = { ...slotItem.item, quickSlotIndex: slotIndex };
    }
    setDraggedItem(dragged);
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
      if (equipment[slot]) {
        let slots = equipment[slot].quick_slots;
        if (!slots) {
          slots = equipment[slot].type === 'armor' ? 2 : equipment[slot].type === 'headgear' ? 1 : 0;
        }
        used += slots;
      }
    });
    if (equipment.consumable) {
      used += equipment.consumable.length;
    }
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
    // Build reservedSlots from equipped headgear and armor.
    const reservedSlots = [];
    if (equipment.headgear) {
      const count = equipment.headgear.quick_slots || 1;
      for (let i = 0; i < count; i++) {
        reservedSlots.push(equipment.headgear);
      }
    }
    if (equipment.armor) {
      const count = equipment.armor.quick_slots || 2;
      for (let i = 0; i < count; i++) {
        reservedSlots.push(equipment.armor);
      }
    }
    const reservedCount = reservedSlots.length;
    
    return (
      <div className="quick-access-grid">
        {Array.from({ length: totalQuickSlots }, (_, index) => {
          if (index < reservedCount) {
            // Reserved slot: add a drop handler that alerts when dropping into it.
            const reservedItem = reservedSlots[index];
            return (
              <div
                key={index}
                className="quick-slot reserved-slot"
                onDrop={(e) => {
                  e.preventDefault();
                  alert("This quick slot is reserved by equipment.");
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="quick-slot-content">
                  <div className="item-name">{reservedItem.name}</div>
                  <div className="item-icon">
                    {reservedItem.type === 'headgear' ? '🥽' : '🔧'}
                  </div>
                </div>
              </div>
            );
          } else {
            // Calculate user quick slot index and render user-managed slot.
            const userSlotIndex = index - reservedCount;
            const slot = quickSlots[userSlotIndex];
            return (
              <div
                key={index}
                className={`quick-slot ${slot ? 'occupied-slot' : ''}`}
                onDrop={(e) => handleQuickSlotDrop(e, userSlotIndex)}
                onDragOver={(e) => handleDragOver(e)}
              >
                {slot ? (
                  <div
                    className="quick-slot-content"
                    draggable
                    onDragStart={(e) => handleQuickSlotDragStart(e, userSlotIndex, slot)}
                  >
                    {slot.type === 'magazine' ? (
                      <>
                        <div className="item-name">{slot.item.name}</div>
                        <div className="item-icon">📖</div>
                      </>
                    ) : (
                      <>
                        <div className="item-name">
                          {slot.item.name} x{slot.quantity}
                        </div>
                        <div className="item-icon">💊</div>
                      </>
                    )}
                  </div>
                ) : (
                  `Slot ${index + 1}`
                )}
              </div>
            );
          }
        })}
      </div>
    );
  };

  const handleEquipmentDrop = async (e, slotType) => {
    e.preventDefault();
    if (!characterId || !draggedItem) return;
  
    let canEquip = false;
  
    // Standard type match checks.
    if (draggedItem.type === slotType) canEquip = true;
    if (draggedItem.type === 'weapon' && (slotType === 'primary' || slotType === 'secondary'))
      canEquip = true;
  
    // For headgear or armor, ensure sufficient free quick slots are available.
    if (draggedItem.type === 'headgear' || draggedItem.type === 'armor') {
      if (draggedItem.quick_slots) {
        // Calculate quick slots used by currently equipped headgear/armor.
        const used = calculateUsedQuickSlots(); // Sum of quick_slots from equipment.headgear and equipment.armor.
        const free = totalQuickSlots - used;
        if (draggedItem.quick_slots > free) {
          alert("Not enough quick slots available. Item cannot be equipped.");
          setDraggedItem(null);
          return;
        }
      }
      // Even if the type check above failed, we allow headgear/armor to equip if quick slot check passes.
      canEquip = true;
    }
  
    if (canEquip) {
      try {
        await equipItem(characterId, slotType, draggedItem.id);
        const currentItem = equipment[slotType];
        const newEquipment = { ...equipment, [slotType]: draggedItem };
        const originalSlot = Object.keys(equipment).find(
          key => equipment[key]?.id === draggedItem.id
        );
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

  const handleQuickSlotDrop = (e, slotIndex) => {
    e.preventDefault();
    if (!draggedItem) return;
    // Only allow items of type 'medication' or 'magazine', as before.
    if (draggedItem.type !== 'medication' && draggedItem.type !== 'magazine') {
      alert("Only medication or magazine items can be equipped in quick slots.");
      setDraggedItem(null);
      return;
    }
    // Get the current slot (from our quickSlots state, on user-managed indices)
    const currentSlot = quickSlots[slotIndex];
    if (draggedItem.type === 'magazine') {
      if (currentSlot) {
        alert("This quick slot is already occupied.");
      } else {
        const newSlots = [...quickSlots];
        newSlots[slotIndex] = { type: 'magazine', item: draggedItem };
        setQuickSlots(newSlots);
        // Remove the item from inventory (implementation as before)
        setInventoryItems(inventoryItems.filter(item => item.id !== draggedItem.id));
      }
    } else if (draggedItem.type === 'medication') {
      if (!currentSlot) {
        // Add as new medication: allow stacking up to 3 units.
        const addQuantity = draggedItem.quantity > 3 ? 3 : draggedItem.quantity;
        const newSlots = [...quickSlots];
        newSlots[slotIndex] = { type: 'medication', item: draggedItem, quantity: addQuantity };
        setQuickSlots(newSlots);
        const remaining = draggedItem.quantity - addQuantity;
        if (remaining <= 0) {
          setInventoryItems(inventoryItems.filter(item => item.id !== draggedItem.id));
        } else {
          setInventoryItems(inventoryItems.map(item =>
            item.id === draggedItem.id
              ? { ...item, quantity: remaining, total_weight: remaining * item.weight }
              : item
          ));
        }
      } else {
        // If slot is occupied, allow stacking if same medication and not at 3 units:
        if (currentSlot.type === 'medication' && currentSlot.item.id === draggedItem.id) {
          if (currentSlot.quantity < 3) {
            const addable = Math.min(draggedItem.quantity, 3 - currentSlot.quantity);
            const newSlots = [...quickSlots];
            newSlots[slotIndex] = { ...currentSlot, quantity: currentSlot.quantity + addable };
            setQuickSlots(newSlots);
            const remaining = draggedItem.quantity - addable;
            if (remaining <= 0) {
              setInventoryItems(inventoryItems.filter(item => item.id !== draggedItem.id));
            } else {
              setInventoryItems(inventoryItems.map(item =>
                item.id === draggedItem.id
                  ? { ...item, quantity: remaining, total_weight: remaining * item.weight }
                  : item
              ));
            }
          } else {
            alert("This quick slot already has the maximum 3 medications.");
          }
        } else {
          alert("This quick slot is occupied by a different item.");
        }
      }
    }
    setDraggedItem(null);
  };
  

  const handleInventoryDrop = async (e) => {
    e.preventDefault();
    if (!characterId || !draggedItem) return;
  
    if (draggedItem.quickSlotIndex !== undefined) {
      const newSlots = [...quickSlots];
      newSlots[draggedItem.quickSlotIndex] = null;
      setQuickSlots(newSlots);
  
      const itemToReturn = { ...draggedItem };
      delete itemToReturn.quickSlotIndex;
      const invItem = inventoryItems.find(item => item.id === itemToReturn.id);
      if (invItem) {
        const updatedInventory = inventoryItems.map(item =>
          item.id === itemToReturn.id 
            ? { 
                ...item, 
                quantity: item.quantity + (itemToReturn.quantity || 1),
                total_weight: (item.quantity + (itemToReturn.quantity || 1)) * item.weight 
              }
            : item
        );
        setInventoryItems(updatedInventory);
      } else {
        setInventoryItems([...inventoryItems, itemToReturn]);
      }
      setDraggedItem(null);
      return;
    }
    
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

  const itemTypes = ['headgear', 'armor', 'weapon', 'consumable', 'tool', 'pistol', 'magazine', 'medication'];

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
            <div className="money-display">{money} uah</div>
          </div>
          <div className="inventory-table-container" onDrop={handleInventoryDrop} onDragOver={handleDragOver}>
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Weight (per piece)</th>
                  <th>Total weight</th>
                  <th>Notations about the item</th>
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
            <div className="weight-indicator">{calculateTotalWeight()}/{capacity} kg</div>
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