import React, { useState } from 'react';
import './InventorySystem.css';

const InventorySystem = () => {
  const [inventoryItems, setInventoryItems] = useState([
    { id: 1, name: 'Gas Mask', type: 'headgear', quantity: 1, weight: 5, totalWeight: 5, notes: 'Protects against toxic gases' },
    { id: 2, name: 'Tactical Vest', type: 'armor', quantity: 1, weight: 8, totalWeight: 8, notes: 'Medium protection' },
    { id: 3, name: 'Sawed-off Shotgun', type: 'weapon', quantity: 1, weight: 12, totalWeight: 12, notes: 'Short range, high damage' },
    { id: 4, name: 'Assault Rifle', type: 'weapon', quantity: 1, weight: 25, totalWeight: 25, notes: 'Medium range, good accuracy' },
    { id: 5, name: 'Medkit', type: 'consumable', quantity: 3, weight: 1.5, totalWeight: 4.5, notes: 'Restores health' },
    { id: 6, name: 'Radiation Pills', type: 'consumable', quantity: 5, weight: 0.8, totalWeight: 4, notes: 'Reduces radiation' },
    { id: 7, name: 'Detector', type: 'tool', quantity: 1, weight: 7, totalWeight: 7, notes: 'Locates anomalies' },
    { id: 8, name: 'Pistol', type: 'pistol', quantity: 1, weight: 6, totalWeight: 6, notes: 'Sidearm, light' },
  ]);

  const [equipment, setEquipment] = useState({
    headgear: null,
    armor: null,
    primary: null,
    secondary: null,
    tool: null,
  });

  const [capacity] = useState(80);
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

  const calculateTotalWeight = () => {
    return inventoryItems.reduce((total, item) => total + item.totalWeight, 0);
  };

  const handleMoneyChange = (amount) => {
    setMoney((prevMoney) => prevMoney + amount);
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

  const handleDeleteItem = () => {
    if (deleteItem) {
      if (deleteQuantity >= deleteItem.quantity) {
        // Remove the item completely
        setInventoryItems(inventoryItems.filter((item) => item.id !== deleteItem.id));
      } else {
        // Reduce the quantity and update total weight
        const updatedItems = inventoryItems.map((item) =>
          item.id === deleteItem.id
            ? {
                ...item,
                quantity: item.quantity - deleteQuantity,
                totalWeight: item.totalWeight - deleteItem.weight * deleteQuantity,
              }
            : item
        );
        setInventoryItems(updatedItems);
      }
      setDeleteItem(null);
    }
  };

  const handleRightClick = (e, item) => {
    e.preventDefault();
    setDeleteItem(item);
    setDeleteQuantity(1);
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.type && newItem.weight > 0 && newItem.quantity > 0) {
      const totalWeight = newItem.weight * newItem.quantity;
      const newItemWithId = {
        ...newItem,
        id: inventoryItems.length + 1,
        totalWeight,
      };
      setInventoryItems([...inventoryItems, newItemWithId]);
      setNewItem({ name: '', type: '', quantity: 1, weight: 0, notes: '' });
      setIsAddItemMenuOpen(false);
    }
  };

  const handleEquipmentDrop = (e, slotType) => {
    e.preventDefault();
    if (draggedItem) {
      let canEquip = false;
      if (draggedItem.type === slotType) canEquip = true;
      if (draggedItem.type === 'weapon' && (slotType === 'primary' || slotType === 'secondary')) canEquip = true;
  
      if (canEquip) {
        const currentItem = equipment[slotType];
        const newEquipment = { ...equipment, [slotType]: draggedItem };
  
        const originalSlot = Object.keys(equipment).find(key => equipment[key]?.id === draggedItem.id);
        if (originalSlot) {
          newEquipment[originalSlot] = null;
        }
  
        const newInventory = inventoryItems.filter(item => item.id !== draggedItem.id);
        if (currentItem) newInventory.push(currentItem);
  
        setEquipment(newEquipment);
        setInventoryItems(newInventory);
      }
    }
    setDraggedItem(null);
  };

  const handleInventoryDrop = (e) => {
    e.preventDefault();
    if (draggedItem && Object.values(equipment).includes(draggedItem)) {
      const slotKey = Object.keys(equipment).find(key => equipment[key]?.id === draggedItem.id);
      if (slotKey) {
        setInventoryItems([...inventoryItems, draggedItem]);
        const newEquipment = { ...equipment };
        newEquipment[slotKey] = null;
        setEquipment(newEquipment);
      }
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const itemTypes = ['headgear', 'armor', 'weapon', 'consumable', 'tool', 'pistol'];

  return (
    <div className="inventory-container">
      
      <div className="main-content">
        <div className="equipment-panel">
        <div className="header">EQUIPMENT</div>
          <div className="equipment-grid">
            {['primary', 'headgear', 'armor',  'secondary', 'tool', 'pistol', '1', '2', '3', '4', '5', '6'].map(slotType => (
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
                  <div className="slot-label">{slotType.charAt(0).toUpperCase() + slotType.slice(1)}</div>
                )}
              </div>
            ))}
          </div>
          <div className="quick-access">
            <div className="quick-access-label">QUICK ACCESS</div>
            <div className="quick-access-grid">
              {[1, 2, 3, 4, 5, 6].map(slot => (
                <div key={slot} className="quick-slot">
                  Slot {slot}
                </div>
              ))}
            </div>
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
                    <td className="text-center">{item.totalWeight}</td>
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
        <div className="delete-item-menu">
          <h3>Delete Item</h3>
          <p>{`Delete ${deleteItem.name}`}</p>
          <input
            type="number"
            min="1"
            max={deleteItem.quantity}
            value={deleteQuantity}
            onChange={(e) => setDeleteQuantity(Number(e.target.value))}
          />
          <button onClick={handleDeleteItem}>Confirm</button>
          <button onClick={() => setDeleteItem(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default InventorySystem;