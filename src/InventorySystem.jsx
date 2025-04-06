import React, { useState } from 'react';
import './InventorySystem.css';

const InventorySystem = () => {
  const [inventoryItems, setInventoryItems] = useState([
    { id: 1, name: 'Gas Mask', type: 'headgear', quantity: 1, price: 5000, totalPrice: 5000, notes: 'Protects against toxic gases' },
    { id: 2, name: 'Tactical Vest', type: 'armor', quantity: 1, price: 8000, totalPrice: 8000, notes: 'Medium protection' },
    { id: 3, name: 'Sawed-off Shotgun', type: 'weapon', quantity: 1, price: 12000, totalPrice: 12000, notes: 'Short range, high damage' },
    { id: 4, name: 'Assault Rifle', type: 'weapon', quantity: 1, price: 25000, totalPrice: 25000, notes: 'Medium range, good accuracy' },
    { id: 5, name: 'Medkit', type: 'consumable', quantity: 3, price: 1500, totalPrice: 4500, notes: 'Restores health' },
    { id: 6, name: 'Radiation Pills', type: 'consumable', quantity: 5, price: 800, totalPrice: 4000, notes: 'Reduces radiation' },
    { id: 7, name: 'Detector', type: 'tool', quantity: 1, price: 7000, totalPrice: 7000, notes: 'Locates anomalies' },
    { id: 8, name: 'Pistol', type: 'weapon', quantity: 1, price: 6000, totalPrice: 6000, notes: 'Sidearm, light' },
  ]);

  const [equipment, setEquipment] = useState({
    headgear: null,
    armor: null,
    primary: null,
    secondary: null,
    tool: null,
  });

  const [weight, setWeight] = useState(10);
  const [capacity] = useState(40);
  const [draggedItem, setDraggedItem] = useState(null);

  const calculateTotalMoney = () => {
    return inventoryItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
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

  return (
    <div className="inventory-container">
      <div className="header">EQUIPMENT</div>
      <div className="main-content">
        <div className="equipment-panel">
          <div className="equipment-grid">
            {['headgear', 'primary', 'secondary', 'armor', 'tool'].map(slotType => (
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
              {[1, 2, 3, 4].map(slot => (
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
            <div className="money-display">{calculateTotalMoney()} грн</div>
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
                  >
                    <td>{item.name}</td>
                    <td className="text-center">{item.type}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-center">{item.price}</td>
                    <td className="text-center">{item.totalPrice}</td>
                    <td className="text-center">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="weight-display">
            <div className="weight-indicator">{weight}/{capacity} кг</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySystem;