from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from fastapi.staticfiles import StaticFiles  
from fastapi.responses import FileResponse
from typing import List, Optional, Dict
import random
import string
import uuid
from datetime import datetime, timedelta
import jwt as pyjwt
import os
from passlib.context import CryptContext

# Initialize FastAPI
app = FastAPI(title="S.T.A.L.K.E.R. TTRPG API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default development port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = "YOUR_SECRET_KEY"  # In production, use a secure key and store it in env variables
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- DATA MODELS ---

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    username: str
    password: str

class User(UserBase):
    id: str
    username: str
    is_dm: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class Game(BaseModel):
    id: str
    dm_id: str
    game_code: str
    created_at: datetime
    players: List[str] = []

class InventoryItemBase(BaseModel):
    name: str
    type: str
    quantity: int
    weight: float
    notes: str = ""

class InventoryItem(InventoryItemBase):
    id: int
    total_weight: float

class InventoryCreate(InventoryItemBase):
    pass

class EquipmentSlot(BaseModel):
    slot_type: str
    item_id: Optional[int] = None

class CharacterBase(BaseModel):
    user_id: str
    game_id: str
    name: str
    money: int = 10000
    capacity: int = 80

class Character(CharacterBase):
    id: str
    inventory: List[InventoryItem] = []
    equipment: Dict[str, Optional[InventoryItem]] = {
        "headgear": None,
        "armor": None,
        "primary": None,
        "secondary": None,
        "tool": None,
        "pistol": None
    }

# In-memory storage (replace with a database in production)
users_db = {}
games_db = {}
characters_db = {}

# --- HELPER FUNCTIONS ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = pyjwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_game_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except pyjwt.PyJWTError:
        raise credentials_exception
    
    for user_id, user_data in users_db.items():
        if user_data["email"] == token_data.email:
            return {"id": user_id, **user_data}
    
    raise credentials_exception

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = None
    for user_id, user_data in users_db.items():
        if user_data["email"] == form_data.username:
            if verify_password(form_data.password, user_data["hashed_password"]):
                user = {"id": user_id, **user_data}
                break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=User)
async def register_user(user: UserCreate):
    # Check if email already exists
    for user_data in users_db.values():
        if user_data["email"] == user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    users_db[user_id] = {
        "email": user.email,
        "username": user.username,
        "hashed_password": hashed_password,
        "is_dm": True  # All registered users are DMs for now
    }

    game_id = str(uuid.uuid4())
    game_code = generate_game_code()
    games_db[game_id] = {
        "dm_id": user_id,
        "game_code": game_code,
        "created_at": datetime.utcnow(),
        "players": []
    }
    # Create a character for the new user
    create_sample_character(user_id, game_id)
    
    return {
        "id": user_id,
        "email": user.email,
        "username": user.username,
        "is_dm": True
    }

# --- GAME MANAGEMENT ENDPOINTS ---

@app.post("/games", response_model=Game)
async def create_game(current_user: dict = Depends(get_current_user)):
    if not current_user["is_dm"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only DMs can create games"
        )
    
    game_id = str(uuid.uuid4())
    game_code = generate_game_code()
    
    # Ensure game code is unique
    while any(game["game_code"] == game_code for game in games_db.values()):
        game_code = generate_game_code()
    
    games_db[game_id] = {
        "dm_id": current_user["id"],
        "game_code": game_code,
        "created_at": datetime.utcnow(),
        "players": []
    }
    
    return {
        "id": game_id,
        **games_db[game_id]
    }

@app.post("/games/join")
async def join_game(game_code: str, current_user: dict = Depends(get_current_user)):
    for game_id, game in games_db.items():
        if game["game_code"] == game_code:
            if current_user["id"] not in game["players"]:
                games_db[game_id]["players"].append(current_user["id"])
            
            # Create a character for the player if they don't have one
            character_exists = False
            for character in characters_db.values():
                if character["user_id"] == current_user["id"] and character["game_id"] == game_id:
                    character_exists = True
                    break
            
            if not character_exists:
                create_sample_character(
                    current_user["id"],
                    game_id,
                    character_name=f"{current_user['username']}'s Character"
                )
            
            return {"message": "Successfully joined the game"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Game not found with this code"
    )

# --- CHARACTER & INVENTORY ENDPOINTS ---

@app.get("/characters", response_model=List[Character])
async def get_characters(current_user: dict = Depends(get_current_user)):
    user_characters = []
    for character_id, character in characters_db.items():
        if character["user_id"] == current_user["id"]:
            user_characters.append({
                "id": character_id,
                **character
            })
    
    return user_characters

@app.get("/characters/{character_id}", response_model=Character)
async def get_character(character_id: str, current_user: dict = Depends(get_current_user)):
    if character_id not in characters_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    character = characters_db[character_id]
    
    # Check if the user owns the character or is the DM
    if character["user_id"] != current_user["id"]:
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this character"
            )
    
    return {
        "id": character_id,
        **character
    }

@app.post("/characters/{character_id}/inventory", response_model=InventoryItem)
async def add_inventory_item(
    character_id: str, 
    item: InventoryCreate,
    current_user: dict = Depends(get_current_user)
):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character = characters_db[character_id]
    
    # Calculate next item ID
    next_id = 1
    if character["inventory"]:
        next_id = max(item["id"] for item in character["inventory"]) + 1
    
    # Create new item
    new_item = {
        "id": next_id,
        **item.dict(),
        "total_weight": item.weight * item.quantity
    }
    
    character["inventory"].append(new_item)
    
    return new_item

@app.put("/characters/{character_id}/inventory/{item_id}", response_model=InventoryItem)
async def update_inventory_item(
    character_id: str,
    item_id: int,
    item: InventoryCreate,
    current_user: dict = Depends(get_current_user)
):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character = characters_db[character_id]
    
    for i, existing_item in enumerate(character["inventory"]):
        if existing_item["id"] == item_id:
            updated_item = {
                "id": item_id,
                **item.dict(),
                "total_weight": item.weight * item.quantity
            }
            character["inventory"][i] = updated_item
            return updated_item
    
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/characters/{character_id}/inventory/{item_id}")
async def delete_inventory_item(
    character_id: str,
    item_id: int,
    quantity: int = 1,
    current_user: dict = Depends(get_current_user)
):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character = characters_db[character_id]
    
    for i, item in enumerate(character["inventory"]):
        if item["id"] == item_id:
            if quantity >= item["quantity"]:
                # Remove the item completely
                character["inventory"].pop(i)
            else:
                # Reduce the quantity
                item["quantity"] -= quantity
                item["total_weight"] = item["weight"] * item["quantity"]
            
            return {"message": "Item updated successfully"}
    
    raise HTTPException(status_code=404, detail="Item not found")

from fastapi import FastAPI, HTTPException, Depends, status, Body
# Add Body to your imports at the top

# Then replace your equipment endpoint with this version:
@app.put("/characters/{character_id}/equipment")
async def equip_item(
    character_id: str,
    equipment_data: dict = Body(...),  # Use Body to get data from request body
    current_user: dict = Depends(get_current_user)
):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character = characters_db[character_id]
    
    # Get parameters from the request body
    slot_type = equipment_data.get("slot_type")
    item_id = equipment_data.get("item_id")
    
    if not slot_type:
        raise HTTPException(status_code=400, detail="slot_type is required")
    
    # Check if slot exists
    if slot_type not in character["equipment"]:
        raise HTTPException(status_code=400, detail="Invalid equipment slot")
    
    # If removing item from slot
    if item_id is None:
        current_item = character["equipment"][slot_type]
        character["equipment"][slot_type] = None
        
        # If there was an item, add it back to inventory
        if current_item:
            character["inventory"].append(current_item)
        
        return {"message": f"Item removed from {slot_type}"}
    
    # Find item in inventory
    item_index = None
    item = None
    for i, inv_item in enumerate(character["inventory"]):
        if inv_item["id"] == item_id:
            item_index = i
            item = inv_item
            break
    
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    
    # Check if item type matches slot
    can_equip = False
    if item["type"] == slot_type:
        can_equip = True
    elif item["type"] == "weapon" and (slot_type == "primary" or slot_type == "secondary"):
        can_equip = True
    
    if not can_equip:
        raise HTTPException(
            status_code=400, 
            detail=f"This item cannot be equipped in the {slot_type} slot"
        )
    
    # Get current equipped item
    current_item = character["equipment"][slot_type]
    
    # Equip the new item
    character["equipment"][slot_type] = item
    
    # Remove from inventory
    character["inventory"].pop(item_index)
    
    # Add previously equipped item back to inventory if there was one
    if current_item:
        character["inventory"].append(current_item)
    
    return {"message": f"Item equipped in {slot_type} slot"}

@app.put("/characters/{character_id}/money")
async def update_money(
    character_id: str,
    money_data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character = characters_db[character_id]
    
    # Get amount from request body
    amount = money_data.get("amount", 0)
    
    # Update money
    character["money"] += amount
    
    # Ensure money doesn't go negative
    if character["money"] < 0:
        character["money"] = 0
    
    return {"money": character["money"]}

dist_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "dist"))

# Mount the static files (CSS, JS, images)
app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

# Serve the index.html at the root path
@app.get("/", include_in_schema=False)
async def serve_index():
    return FileResponse(os.path.join(dist_path, "index.html"))

# Catch-all route for SPA routing - must be the last route
@app.get("/{path:path}", include_in_schema=False)
async def serve_spa(path: str):
    # First check if the requested path exists as a file
    file_path = os.path.join(dist_path, path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # If not found, serve index.html for client-side routing
    return FileResponse(os.path.join(dist_path, "index.html"))


# Add this helper function in the HELPER FUNCTIONS section

def create_sample_inventory():
    """Create a list of sample inventory items for new characters"""
    return [
        {
            "id": 1,
            "name": "AK-74",
            "type": "weapon",
            "quantity": 1,
            "weight": 3.6,
            "notes": "Standard assault rifle",
            "total_weight": 3.6
        },
        {
            "id": 2,
            "name": "9x39mm Rounds",
            "type": "consumable",
            "quantity": 120,
            "weight": 0.01,
            "notes": "Standard ammunition",
            "total_weight": 1.2
        },
        {
            "id": 2,
            "name": "9mm Magazine (12 rounds)",
            "type": "magazine",
            "quantity": 1,
            "weight": 0.2,
            "notes": "Standard ammunition",
            "total_weight": 1.2
        },
        {
            "id": 3,
            "name": "Anti-radiation drugs",
            "type": "medication",
            "quantity": 5,
            "weight": 0.1,
            "notes": "Reduces radiation exposure",
            "total_weight": 0.5
        },
        {
            "id": 4,
            "name": "SEVA Suit",
            "type": "armor",
            "quantity": 1,
            "weight": 8.0,
            "notes": "Mid-tier protection suit",
            "total_weight": 8.0,
            "quick_slots": 2
        },
        {
            "id": 5,
            "name": "SSP-99 Ecologist Helmet",
            "type": "headgear",
            "quantity": 1,
            "weight": 2.5,
            "notes": "Scientific headgear with good protection",
            "total_weight": 2.5,
            "quick_slots": 1
        },
        {
            "id": 6,
            "name": "Detector",
            "type": "tool",
            "quantity": 1,
            "weight": 0.5,
            "notes": "Basic anomaly detector",
            "total_weight": 0.5
        },
        {
            "id": 7,
            "name": "PMm Pistol",
            "type": "pistol",
            "quantity": 1,
            "weight": 0.73,
            "notes": "Standard sidearm",
            "total_weight": 0.73
        }
    ]

def create_sample_character(user_id, game_id, character_name=None):
    """Create a sample character with inventory for a new user"""
    character_id = str(uuid.uuid4())
    inventory_items = create_sample_inventory()
    
    # Create equipment from inventory items
    equipment = {
        "headgear": None,
        "armor": None,
        "primary": None,
        "secondary": None,
        "tool": None,
        "pistol": None
    }
    
    # Equip some items from inventory
    for item in inventory_items[:]:
        if item["type"] == "headgear" and equipment["headgear"] is None:
            equipment["headgear"] = item
            inventory_items.remove(item)
        elif item["type"] == "armor" and equipment["armor"] is None:
            equipment["armor"] = item
            inventory_items.remove(item)
        elif item["type"] == "weapon" and equipment["primary"] is None:
            equipment["primary"] = item
            inventory_items.remove(item)
        elif item["type"] == "tool" and equipment["tool"] is None:
            equipment["tool"] = item
            inventory_items.remove(item)
        elif item["type"] == "pistol" and equipment["pistol"] is None:
            equipment["pistol"] = item
            inventory_items.remove(item)
    
    if not character_name:
        # Get username from users_db
        username = "New Stalker"
        for user_data in users_db.values():
            if user_data.get("id") == user_id:
                username = user_data.get("username", "Stalker")
                break
        character_name = f"{username}'s Character"
    
    characters_db[character_id] = {
        "id": character_id,
        "user_id": user_id,
        "game_id": game_id,
        "name": character_name,
        "money": 10000,
        "capacity": 80,
        "inventory": inventory_items,
        "equipment": equipment
    }
    
    return character_id


# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)