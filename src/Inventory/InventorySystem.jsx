import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { getCharacters, getCharacter, addInventoryItem, deleteInventoryItem, equipItem, updateMoney, updateInventoryItem } from '../services/api.js';
import './InventorySystem.css';
import { getItemTypes, getItemsByType } from '../services/api.js';


const InventorySystem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [characterId, setCharacterId] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
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
  const [contextItem, setContextItem] = useState(null);
  const [isUpdateItemMenuOpen, setIsUpdateItemMenuOpen] = useState(false);
  const [updateItem, setUpdateItem] = useState(null);
  const [updateItemData, setUpdateItemData] = useState({ quantity: 1, notes: '' });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const totalQuickSlots = 6;
  const [quickSlots, setQuickSlots] = useState(Array(totalQuickSlots).fill(null));
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [availableItems, setAvailableItems] = useState([]);


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
  useEffect(() => {
    const fetchItemTypes = async () => {
      try {
        const types = await getItemTypes();
        setItemTypes(types.map(type => type.id));
      } catch (err) {
        setError("Failed to load item types: " + err.message);
      }
    };
    fetchItemTypes();
  }, []);
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
    if (slotItem.type === 'medication') {
      dragged = { ...slotItem.item, quantity: slotItem.quantity, quickSlotIndex: slotIndex };
    } else if (slotItem.type === 'magazine') {
      dragged = { ...slotItem.item, quickSlotIndex: slotIndex };
    }
    setDraggedItem(dragged);
  };

  const getTooltipStyle = (x, y) => {
    const padding = 10;
    const tooltipElement = document.getElementById('tooltip');
    const tooltipWidth = tooltipElement ? tooltipElement.offsetWidth : 220;
    const tooltipHeight = tooltipElement ? tooltipElement.offsetHeight : 100;
    let left = x + padding;
    let top = y + padding;

    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (top + tooltipHeight > window.innerHeight) {
      top = y - tooltipHeight - padding;
      if (top < padding) top = padding;
    }
    return { left, top };
  };

  const toggleAddItemMenu = () => {
    setIsAddItemMenuOpen((prev) => !prev);
  };

  const renderDynamicProperties = (item) => {
    const standardKeys = ['id', 'name', 'type', 'quantity', 'weight', 'total_weight', 'notes'];
    return Object.entries(item)
      .filter(([key, value]) => !standardKeys.includes(key) && value !== null && value !== undefined)
      .map(([key, value]) => (
        <div key={key}>
          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
        </div>
      ));
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



  const renderQuickAccess = () => {
    const headgearCount = equipment.headgear ? (equipment.headgear.quick_slots || 1) : 0;
    const armorCount = equipment.armor ? (equipment.armor.quick_slots || 2) : 0;

    return (
      <div className="quick-access-grid">
        {Array.from({ length: totalQuickSlots }, (_, index) => {
          if (index < headgearCount) {
            // Reserved for headgear
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
                  <div className="item-name">{equipment.headgear.name}</div>
                  <div className="item-icon">🥽</div>
                </div>
              </div>
            );
          } else if (index >= totalQuickSlots - armorCount) {
            // Reserved for armor
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
                  <div className="item-name">{equipment.armor.name}</div>
                  <div className="item-icon">🔧</div>
                </div>
              </div>
            );
          } else {
            // User-managed slot.
            const userSlotIndex = index - headgearCount;
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
                    onDragStart={(e) =>
                      handleQuickSlotDragStart(e, userSlotIndex, slot)
                    }
                    onMouseEnter={(e) => {
                      setHoveredItem(slot.type === 'medication' ? { ...slot.item, quantity: slot.quantity } : slot.item);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
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
    if (draggedItem.type === slotType) canEquip = true;
    if (draggedItem.type === 'weapon' && (slotType === 'primary' || slotType === 'secondary'))
      canEquip = true;

    if (draggedItem.type === 'headgear' || draggedItem.type === 'armor') {
      const newHeadgearCount =
        draggedItem.type === 'headgear'
          ? draggedItem.quick_slots || 1
          : equipment.headgear
            ? equipment.headgear.quick_slots || 1
            : 0;
      const newArmorCount =
        draggedItem.type === 'armor'
          ? draggedItem.quick_slots || 2
          : equipment.armor
            ? equipment.armor.quick_slots || 2
            : 0;
      const newUserSlotCount = totalQuickSlots - newHeadgearCount - newArmorCount;
      const occupiedUserSlots = quickSlots.filter((slot) => slot !== null).length;
      if (occupiedUserSlots > newUserSlotCount) {
        alert(
          "Not enough free quick slots available. Please clear some quick access items first."
        );
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
        const originalSlot = Object.keys(equipment).find(
          (key) => equipment[key]?.id === draggedItem.id
        );
        if (originalSlot && originalSlot !== slotType) {
          newEquipment[originalSlot] = null;
        }
        let newInventory = inventoryItems.filter(
          (item) => item.id !== draggedItem.id
        );
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
    if (draggedItem.type !== 'medication' && draggedItem.type !== 'magazine') {
      alert("Only medication or magazine items can be equipped in quick slots.");
      setDraggedItem(null);
      return;
    }
    const currentSlot = quickSlots[slotIndex];
    if (draggedItem.type === 'magazine') {
      if (currentSlot) {
        alert("This quick slot is already occupied.");
      } else {
        const newSlots = [...quickSlots];
        newSlots[slotIndex] = { type: 'magazine', item: draggedItem };
        setQuickSlots(newSlots);
        setInventoryItems(inventoryItems.filter(item => item.id !== draggedItem.id));
      }
    } else if (draggedItem.type === 'medication') {
      if (!currentSlot) {
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

  const handleItemTypeChange = async (typeSelected) => {
    setNewItem({ ...newItem, type: typeSelected, name: '', weight: 0 });
    setSelectedType(typeSelected);

    try {
      const items = await getItemsByType(typeSelected);
      setAvailableItems(items);
    } catch (err) {
      setError("Failed to load items: " + err.message);
      setAvailableItems([]);
    }
    setSelectedName('');
  };

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
          <div className="header">
            <div
              className="burger-menu"
              onClick={() => setBurgerOpen((prev) => !prev)}
              title="Options"
            >
              <Menu size={24} />
            </div>
            EQUIPMENT
          </div>
          {burgerOpen && (
            <div className="burger-menu-list">
              <ul>
                <li><Link to="/">MAIN TERMINAL</Link></li>
                <li><Link to="/inventory">INVENTORY</Link></li>
                <li><Link to="/map">ZONE MAP</Link></li>
                <li><Link to="/journal">JOURNAL</Link></li>
              </ul>
            </div>
          )}
          <div className="equipment-grid">
            {['primary', 'headgear', 'armor', 'secondary', 'tool', 'pistol'].map(slotType => (
              <div
                key={slotType}
                className="equipment-slot"
                onDrop={(e) => handleEquipmentDrop(e, slotType)}
                onDragOver={(e) => handleDragOver(e)}
              >
                {equipment[slotType] ? (
                  <div
                    className="equipment-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, equipment[slotType])}
                    onMouseEnter={(e) => {
                      setHoveredItem(equipment[slotType]);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
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
                    // onContextMenu={(e) => handleRightClick(e, item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextItem(item);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredItem(item);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) => {
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
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
          {/* First Dropdown: Select Type */}
          <select
            value={newItem.type}
            onChange={(e) => handleItemTypeChange(e.target.value)}
          >
            <option value="" disabled>Select Type</option>
            {itemTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {/* Second Dropdown: Select Item Name */}
          <select
            value={newItem.name}
            onChange={(e) => {
              const nameSelected = e.target.value;
              const selectedItem = availableItems.find(item => item.name === nameSelected);
              setNewItem({
                ...newItem,
                name: nameSelected,
                weight: selectedItem ? selectedItem.weight : 0,
                item_id: selectedItem ? selectedItem.id : null
              });
              setSelectedName(nameSelected);
            }}
            disabled={!newItem.type}
          >
            <option value="" disabled>Select Item</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name} {item.weight ? `(${item.weight} kg)` : ""}
              </option>
            ))}
          </select>

          {/* Other inputs for quantity and notes (weight input removed) */}
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
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
      {hoveredItem && (
        <div
          className="item-tooltip"
          style={getTooltipStyle(tooltipPos.x, tooltipPos.y)}
        >
          <div><strong>{hoveredItem.name}</strong></div>
          <div>Type: {hoveredItem.type}</div>
          <div>Quantity: {hoveredItem.quantity}</div>
          <div>Weight: {hoveredItem.weight}</div>
          {hoveredItem.total_weight && <div>Total Weight: {hoveredItem.total_weight}</div>}
          {hoveredItem.notes && <div>Notes: {hoveredItem.notes}</div>}
          {/* Render any extra attributes not in the standard list */}
          {renderDynamicProperties(hoveredItem)}
        </div>
      )}
      {contextItem && (
        <div className="context-menu-overlay">
          <div className="context-menu">
            <p>{contextItem.name}</p>
            <button onClick={() => {
              setDeleteItem(contextItem);
              setContextItem(null);
            }}>Delete</button>
            <button onClick={() => {
              setIsUpdateItemMenuOpen(true);
              setUpdateItem(contextItem);
              setUpdateItemData({ quantity: contextItem.quantity, notes: contextItem.notes });
              setContextItem(null);
            }}>Update</button>
            <button onClick={() => setContextItem(null)}>Cancel</button>
          </div>
        </div>
      )}
      {isUpdateItemMenuOpen && updateItem && (
        <div className="update-item-menu-overlay">
          <div className="update-item-menu">
            <h3>Update Item: {updateItem.name}</h3>
            <div>
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                value={updateItemData.quantity}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setUpdateItemData({
                    ...updateItemData,
                    quantity: value < 1 ? 1 : value
                  });
                }}
              />
            </div>
            <div>
              <label>Notes:</label>
              <textarea
                value={updateItemData.notes}
                onChange={(e) =>
                  setUpdateItemData({ ...updateItemData, notes: e.target.value })
                }
              />
            </div>
            <button onClick={async () => {
              try {
                const fullItemData = {
                  ...updateItem,
                  quantity: updateItemData.quantity,
                  notes: updateItemData.notes,
                  total_weight: updateItem.weight * updateItemData.quantity
                };

                const updated = await updateInventoryItem(characterId, updateItem.id, fullItemData);

                const updatedInventory = inventoryItems.map(item =>
                  item.id === updateItem.id ? updated : item
                );

                setInventoryItems(updatedInventory);
                setIsUpdateItemMenuOpen(false);
                setUpdateItem(null);
              } catch (err) {
                alert("Failed to update item: " + (err.message || JSON.stringify(err)));
              }
            }}>Update</button>
            <button onClick={() => {
              setIsUpdateItemMenuOpen(false);
              setUpdateItem(null);
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySystem;