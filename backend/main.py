from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from fastapi.staticfiles import StaticFiles  
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional, Dict
import random
import string
import uuid
from datetime import datetime, timedelta
import jwt as pyjwt
import os
from passlib.context import CryptContext
from database import db, ensure_data_loaded
from fastapi import Query, Path
from typing import Optional, Any, Dict
from PIL import Image
import io
import copy
import os


public_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "public"))


# Initialize FastAPI
app = FastAPI(title="S.T.A.L.K.E.R. TTRPG API")
db.config['host'] = "database"
db.config['port'] = 3306
db.config['user'] = "ttrpg_user"
db.config['database'] = "TTRPG_DB"
db.config['password'] ="88888888"
# db.config['password'] = os.environ.get("MYSQL_ROOT_PASSWORD", "rootpass")
# db.config['use_pure'] = True
ensure_data_loaded()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Include your frontend URL
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
class QuestBase(BaseModel):
    title: str
    description: str
    completed: bool = False

class Quest(QuestBase):
    id: int

class QuestCreate(QuestBase):
    pass

class NoteBase(BaseModel):
    title: str
    content: str

class Note(NoteBase):
    id: int

class NoteCreate(NoteBase):
    pass


class GameCreate(BaseModel):
    name: str

class GameUpdate(BaseModel):
    name: str

class CharacterStats(BaseModel):
    str: int
    dex: int
    int: int
    wis: int
    cha: int
    sta: int
    luk: int

class CharacterPersonality(BaseModel):
    valueMost: str
    attitude: str
    important: str
    flaws: str
    ideals: str

class CharacterSkillProficiencies(BaseModel):
    survival: Optional[bool] = False
    investigation: Optional[bool] = False
    weapons: Optional[bool] = False
    melee: Optional[bool] = False
    medicine: Optional[bool] = False
    stealth: Optional[bool] = False
    engineering: Optional[bool] = False
    mutants: Optional[bool] = False
    perception: Optional[bool] = False
    athletics: Optional[bool] = False
    acrobatics: Optional[bool] = False
    persuasion: Optional[bool] = False
    history: Optional[bool] = False
    intimidation: Optional[bool] = False
    zone_knowledge: Optional[bool] = False

class CharacterCreationRequest(BaseModel):
    name: str
    charClass: str
    stats: CharacterStats
    mods: Optional[Dict[str, int]]
    profs: Optional[Dict[str, int]]
    personality: CharacterPersonality
    story: str
    motivation: str
    passivePerception: Optional[int]

class PinPosition(BaseModel):
    x: float
    y: float

class CharacterPin(BaseModel):
    character_id: str
    name: str
    avatar_url: Optional[str] = None
    is_monster: bool = False
    position_x: float
    position_y: float

class MonsterPinCreate(BaseModel):
    name: str
    position_x: float = 500
    position_y: float = 500

users_db = {}
games_db = {}
characters_db = {}
quests_db = {}
notes_db = {}   
pins_db = {}

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

@app.get("/api/placeholder/{width}/{height}")
async def get_placeholder_image(width: int, height: int):
    """
    Serves a placeholder image, optionally resized to the specified dimensions.
    If the image file doesn't exist, generates a simple colored placeholder.
    """
    # Try multiple possible locations for the placeholder image
    possible_paths = [
        os.path.join(public_path, "placeholder.png"),
        os.path.join(os.path.dirname(__file__), "..", "public", "placeholder.png"),
        os.path.join(dist_path, "placeholder.png"),
        os.path.join(dist_path, "assets", "placeholder.png"),
    ]
    
    placeholder_path = None
    for path in possible_paths:
        if os.path.isfile(path):
            placeholder_path = path
            break
    
    try:
        if placeholder_path:
            # Use the existing file if found
            image = Image.open(placeholder_path)
            resized_image = image.resize((width, height))
        else:
            # Generate a simple placeholder with text if file not found
            # Create a dark gray image with a lighter border
            resized_image = Image.new('RGB', (width, height), (26, 42, 26))
            
            # Draw border (5px)
            border = 5
            for i in range(border):
                for x in range(width):
                    for y in range(height):
                        if x < border or x >= width - border or y < border or y >= height - border:
                            resized_image.putpixel((x, y), (163, 255, 163))
            
            # Add text if PIL has ImageDraw
            try:
                from PIL import ImageDraw, ImageFont
                draw = ImageDraw.Draw(resized_image)
                
                # Try to use a font, fallback to default
                try:
                    font = ImageFont.truetype("Arial", 20)
                except IOError:
                    font = ImageFont.load_default()
                
                text = f"{width}×{height}"
                text_width = draw.textlength(text, font=font)
                position = ((width - text_width) // 2, (height - 20) // 2)
                draw.text(position, text, fill=(163, 255, 163), font=font)
            except ImportError:
                # If ImageDraw is not available, just use the colored background
                pass
        
        # Save to a bytes buffer
        img_byte_arr = io.BytesIO()
        resized_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Return the image
        from fastapi.responses import Response
        return Response(content=img_byte_arr.getvalue(), media_type="image/png")
    
    except Exception as e:
        # If all else fails, return an error message with debug info
        
        # Generate the simplest possible image - just a colored square
        fallback_img = Image.new('RGB', (width, height), (163, 255, 163))
        img_byte_arr = io.BytesIO()
        fallback_img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        from fastapi.responses import Response
        return Response(content=img_byte_arr.getvalue(), media_type="image/png")

# --- QUEST LOG ENDPOINTS ---
@app.get("/characters/{character_id}/quests", response_model=List[Quest])
async def get_quests(
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all quests for a character."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have access to this character's quests")
    
    # Return quests or empty list if none exist
    return quests_db.get(character_id, [])

@app.post("/characters/{character_id}/quests", response_model=Quest)
async def create_quest(
    character_id: str,
    quest: QuestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new quest for a character."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to add quests to this character")
    
    # Initialize character's quests if not exists
    if character_id not in quests_db:
        quests_db[character_id] = []
    
    # Generate new quest ID
    next_id = 1
    if quests_db[character_id]:
        next_id = max(q["id"] for q in quests_db[character_id]) + 1
    
    # Create new quest
    new_quest = {
        "id": next_id,
        **quest.dict()
    }
    
    # Add to quests
    quests_db[character_id].append(new_quest)
    
    return new_quest

@app.put("/characters/{character_id}/quests/{quest_id}", response_model=Quest)
async def update_quest(
    character_id: str,
    quest_id: int,
    quest: QuestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing quest."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to update this character's quests")
    
    # Check if quests exist for this character
    if character_id not in quests_db:
        raise HTTPException(status_code=404, detail="No quests found for this character")
    
    # Find and update the quest
    for i, q in enumerate(quests_db[character_id]):
        if q["id"] == quest_id:
            updated_quest = {
                "id": quest_id,
                **quest.dict()
            }
            quests_db[character_id][i] = updated_quest
            return updated_quest
    
    raise HTTPException(status_code=404, detail="Quest not found")

@app.patch("/characters/{character_id}/quests/{quest_id}/toggle", response_model=Quest)
async def toggle_quest_status(
    character_id: str,
    quest_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Toggle a quest's completed status."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to update this character's quests")
    
    # Check if quests exist for this character
    if character_id not in quests_db:
        raise HTTPException(status_code=404, detail="No quests found for this character")
    
    # Find and toggle the quest
    for i, q in enumerate(quests_db[character_id]):
        if q["id"] == quest_id:
            quests_db[character_id][i]["completed"] = not quests_db[character_id][i]["completed"]
            return quests_db[character_id][i]
    
    raise HTTPException(status_code=404, detail="Quest not found")

@app.delete("/characters/{character_id}/quests/{quest_id}")
async def delete_quest(
    character_id: str,
    quest_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a quest."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this character's quests")
    
    # Check if quests exist for this character
    if character_id not in quests_db:
        raise HTTPException(status_code=404, detail="No quests found for this character")
    
    # Find and delete the quest
    for i, q in enumerate(quests_db[character_id]):
        if q["id"] == quest_id:
            quests_db[character_id].pop(i)
            return {"message": "Quest deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Quest not found")


# --- NOTES ENDPOINTS ---

@app.get("/characters/{character_id}/notes", response_model=List[Note])
async def get_notes(
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all notes for a character."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have access to this character's notes")
    
    # Return notes or empty list if none exist
    return notes_db.get(character_id, [])

@app.post("/characters/{character_id}/notes", response_model=Note)
async def create_note(
    character_id: str,
    note: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new note for a character."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to add notes to this character")
    
    # Initialize character's notes if not exists
    if character_id not in notes_db:
        notes_db[character_id] = []
    
    # Generate new note ID
    next_id = 1
    if notes_db[character_id]:
        next_id = max(n["id"] for n in notes_db[character_id]) + 1
    
    # Create new note
    new_note = {
        "id": next_id,
        **note.dict()
    }
    
    # Add to notes
    notes_db[character_id].append(new_note)
    
    return new_note

@app.put("/characters/{character_id}/notes/{note_id}", response_model=Note)
async def update_note(
    character_id: str,
    note_id: int,
    note: NoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing note."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to update this character's notes")
    
    # Check if notes exist for this character
    if character_id not in notes_db:
        raise HTTPException(status_code=404, detail="No notes found for this character")
    
    # Find and update the note
    for i, n in enumerate(notes_db[character_id]):
        if n["id"] == note_id:
            updated_note = {
                "id": note_id,
                **note.dict()
            }
            notes_db[character_id][i] = updated_note
            return updated_note
    
    raise HTTPException(status_code=404, detail="Note not found")

@app.delete("/characters/{character_id}/notes/{note_id}")
async def delete_note(
    character_id: str,
    note_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a note."""
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user has access to this character
    character = characters_db[character_id]
    if character["user_id"] != current_user["id"]:
        # Allow DM access too
        game = games_db.get(character["game_id"])
        if not game or game["dm_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this character's notes")
    
    # Check if notes exist for this character
    if character_id not in notes_db:
        raise HTTPException(status_code=404, detail="No notes found for this character")
    
    # Find and delete the note
    for i, n in enumerate(notes_db[character_id]):
        if n["id"] == note_id:
            notes_db[character_id].pop(i)
            return {"message": "Note deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Note not found")


# --- WIKI/DATABASE ACCESS ENDPOINTS ---

@app.get("/wiki/tables")
async def get_all_tables():
    """Get a list of all available tables in the database with their row counts."""
    tables = db.get_tables()
    result = {}
    
    for table in tables:
        count = db.count(table)
        result[table] = count
        
    return {"tables": result}

@app.get("/wiki/tables/{table_name}")
async def get_table_data(
    table_name: str = Path(..., description="Name of the table to query"),
    limit: int = Query(50, description="Maximum number of records to return"),
    offset: int = Query(0, description="Number of records to skip"),
    sort_by: Optional[str] = Query(None, description="Column to sort by"),
    sort_desc: bool = Query(False, description="Sort in descending order")
):
    """Get data from a specific table with pagination and sorting."""
    # Verify table exists
    tables = db.get_tables()
    if table_name not in tables:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    
    # Build query based on parameters
    query = f"SELECT * FROM {table_name}"
    
    # Add sorting if requested
    if sort_by:
        # Verify the column exists
        columns = db.get_column_names(table_name)
        if sort_by not in columns:
            raise HTTPException(status_code=400, detail=f"Column '{sort_by}' not found in table '{table_name}'")
        
        direction = "DESC" if sort_desc else "ASC"
        query += f" ORDER BY {sort_by} {direction}"
    
    # Add pagination
    query += f" LIMIT {limit} OFFSET {offset}"
    
    # Execute query
    data = db.run_custom_query(query)
    
    # Get total count for pagination info
    total_count = db.count(table_name)
    
    return {
        "table": table_name,
        "data": data,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": offset + len(data) < total_count
        }
    }

@app.get("/wiki/tables/{table_name}/{record_id}")
async def get_record_by_id(
    table_name: str = Path(..., description="Name of the table to query"),
    record_id: Any = Path(..., description="ID of the record to retrieve"),
    id_column: str = Query("id", description="Name of the ID column")
):
    """Get a specific record from a table by ID."""
    # Verify table exists
    tables = db.get_tables()
    if table_name not in tables:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    
    # Verify column exists
    columns = db.get_column_names(table_name)
    if id_column not in columns:
        raise HTTPException(status_code=400, detail=f"Column '{id_column}' not found in table '{table_name}'")
    
    # Get record
    record = db.get_by_id(table_name, id_column, record_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Record with {id_column}={record_id} not found in {table_name}")
    
    return record

@app.get("/wiki/search/{table_name}")
async def search_table(
    table_name: str = Path(..., description="Name of the table to search"),
    column: str = Query(..., description="Column to search in"),
    term: str = Query(..., description="Search term"),
    limit: int = Query(50, description="Maximum number of results to return")
):
    """Search for records in a table that match the given term."""
    # Verify table exists
    tables = db.get_tables()
    if table_name not in tables:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    
    # Verify column exists
    columns = db.get_column_names(table_name)
    if column not in columns:
        raise HTTPException(status_code=400, detail=f"Column '{column}' not found in table '{table_name}'")
    
    # Perform search
    results = db.search(table_name, column, term, limit)
    
    return {
        "table": table_name,
        "column": column,
        "term": term,
        "results": results,
        "count": len(results)
    }

@app.get("/wiki/{category}")
async def get_category_data(
    category: str = Path(..., description="Category to retrieve"),
    limit: int = Query(100, description="Maximum number of records to return"),
    offset: int = Query(0, description="Number of records to skip"),
    search: Optional[str] = Query(None, description="Optional search term")
):
    """Get data for a specific category (maps to table name)."""
    # Map category to table name - add more mappings as needed
    category_to_table = {
        "weapons": "weapons",
        "armor": "armor",
        "artifacts": "artifacts",
        "anomalies": "anomalies",
        "items": "items",
        "mutants": "mutants",
        "locations": "locations",
        "npc": "npc"
        # Add more mappings as needed
    }
    
    # Get the table name from the category
    table_name = category_to_table.get(category.lower())
    if not table_name:
        # Check if the category directly matches a table name
        tables = db.get_tables()
        if category.lower() in [t.lower() for t in tables]:
            table_name = next(t for t in tables if t.lower() == category.lower())
        else:
            raise HTTPException(status_code=404, detail=f"Category '{category}' not found")
    
    # Get data
    if search:
        # Try to search in name column first, then in description if available
        columns = db.get_column_names(table_name)
        search_column = "name" if "name" in columns else columns[0]
        
        results = db.search(table_name, search_column, search, limit)
        return {
            "category": category,
            "data": results,
            "count": len(results)
        }
    else:
        # Get paginated data
        data = db.get_all(table_name, limit, offset)
        total_count = db.count(table_name)
        
        return {
            "category": category,
            "data": data,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + len(data) < total_count
            }
        }

@app.get("/wiki/related/{table_name}/{record_id}")
async def get_related_records(
    table_name: str = Path(..., description="Primary table name"),
    record_id: Any = Path(..., description="ID of the primary record"),
    related_table: str = Query(..., description="Related table to query"),
    foreign_key: str = Query(..., description="Foreign key column in related table"),
    limit: int = Query(50, description="Maximum number of related records to return")
):
    """Get related records from another table that reference this record."""
    # Verify tables exist
    tables = db.get_tables()
    if table_name not in tables:
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
    if related_table not in tables:
        raise HTTPException(status_code=404, detail=f"Related table '{related_table}' not found")
    
    # Verify foreign key column exists in related table
    columns = db.get_column_names(related_table)
    if foreign_key not in columns:
        raise HTTPException(status_code=400, detail=f"Foreign key column '{foreign_key}' not found in table '{related_table}'")
    
    # Get related records
    related = db.get_related(table_name, related_table, foreign_key, record_id, limit)
    
    return {
        "table": table_name,
        "record_id": record_id,
        "related_table": related_table,
        "related_records": related,
        "count": len(related)
    }

# Optional: Add a catch-all route for flexible custom queries (admin only)
@app.get("/wiki/query")
async def run_custom_query(
    query: str = Query(..., description="SQL query to run (SELECT only)"),
    current_user: dict = Depends(get_current_user)
):
    """Run a custom SQL query (SELECT only, admin use only)."""
    # Security check - only allow SELECT queries
    query = query.strip()
    if not query.upper().startswith("SELECT"):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed")
    
    # Check if current user is an admin/DM
    if not current_user.get("is_dm", False):
        raise HTTPException(status_code=403, detail="Only DMs can run custom queries")
    
    # Run the query
    try:
        results = db.run_custom_query(query)
        return {"results": results, "count": len(results) if isinstance(results, list) else 0}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")

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

@app.post("/games")
async def create_game(
    game: GameCreate,  # Change to use GameCreate model
    current_user: dict = Depends(get_current_user)
):
    """Create a new game with the current user as DM"""
    if not current_user.get("is_dm", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only DMs can create games"
        )
    
    game_id = str(uuid.uuid4())
    game_code = generate_game_code()
    
    # Ensure game code is unique
    while any(g["game_code"] == game_code for g in games_db.values()):
        game_code = generate_game_code()
    
    games_db[game_id] = {
        "dm_id": current_user["id"],
        "game_code": game_code,
        "name": game.name,  # Add name field
        "created_at": datetime.now().isoformat(),
        "players": []
    }
    
    return {
        "id": game_id,
        "name": game.name,
        **{k: v for k, v in games_db[game_id].items() if k != "name"},
        "is_dm": True
    }

# Add this function to the helper functions section

async def get_current_user_or_none(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="token", auto_error=False))
):
    """Returns the current user if authenticated, or None if not."""
    if not token:
        return None
        
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
            
        for user_id, user_data in users_db.items():
            if user_data["email"] == email:
                return {"id": user_id, **user_data}
                
    except:
        pass
        
    return None

class JoinGameRequest(BaseModel):
    game_code: str
    guest_name: Optional[str] = "Anonymous Stalker"

# Replace the existing join_game function with this updated version

@app.post("/games/join")
async def join_game(
    join_data: JoinGameRequest,
    current_user: Optional[dict] = Depends(get_current_user_or_none)
):
    """Join a game using a game code - allows anonymous users"""
    game_id = None
    found_game = None
    
    # Find game with matching code
    for g_id, game in games_db.items():
        if game["game_code"] == join_data.game_code:
            game_id = g_id
            found_game = game
            break
    
    if not game_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found with this code"
        )
    
    if current_user:
        # Registered user flow
        if current_user["id"] not in found_game["players"]:
            games_db[game_id]["players"].append(current_user["id"])
        
        # Return game info without creating a character
        return {
            "message": "Successfully joined the game",
            "game_id": game_id,
            "is_guest": False,
            "game_name": found_game.get("name", f"Game {game_id}"),
            "game_code": found_game["game_code"],
            "redirect_to": "character-selection"  # Flag to redirect to character selection
        }
    else:
        # Anonymous/guest user flow
        guest_id = str(uuid.uuid4())
        
        # Create a temporary guest user
        guest_user = {
            "id": guest_id,
            "username": join_data.guest_name,
            "email": f"guest_{guest_id}@stalker.zone",  # Add email for token generation
            "is_guest": True,
            "created_at": datetime.now().isoformat()
        }
        
        # Store in users_db
        users_db[guest_id] = guest_user
        
        # Add guest to players list
        games_db[game_id]["players"].append(guest_id)
        
        # Generate session token for the guest
        access_token_expires = timedelta(hours=12)  # Guest sessions last 12 hours
        access_token = create_access_token(
            data={"sub": guest_user["email"]},  # Use email format for consistency
            expires_delta=access_token_expires
        )
        
        return {
            "message": "Successfully joined the game as a guest",
            "game_id": game_id,
            "is_guest": True,
            "guest_token": access_token,
            "guest_name": join_data.guest_name,
            "game_name": found_game.get("name", f"Game {game_id}"),
            "game_code": found_game["game_code"],
            "redirect_to": "character-selection"  # Flag to redirect to character selection
        }
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
@app.get("/games/{game_id}/characters/{character_id}")
async def get_character_details(
    game_id: str,
    character_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed character information"""
    # Check if game exists
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check if character exists
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character = characters_db[character_id]
    game = games_db[game_id]
    
    # Check permissions - must be DM or the character's owner
    is_dm = game["dm_id"] == current_user["id"]
    is_owner = character["user_id"] == current_user["id"]
    
    if not (is_dm or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to view this character"
        )
    
    # Get environmental data for the character
    environment_data = {
        "radiation": 0,  # Default values
        "anomaly_proximity": "SAFE",
        "safety_level": "SECURE"
    }
    
    if game_id in pins_db and character_id in pins_db[game_id]:
        pos_x = pins_db[game_id][character_id]["x"]
        pos_y = pins_db[game_id][character_id]["y"]
        

        center_x = 2048 
        center_y = 2048
        distance_from_center = ((pos_x - center_x)**2 + (pos_y - center_y)**2)**0.5
        
        environment_data["radiation"] = min(10, max(0, (5000 - distance_from_center) / 1000))
        
        if distance_from_center < 500:
            environment_data["safety_level"] = "HOSTILE"
        elif distance_from_center < 1000:
            environment_data["safety_level"] = "DANGER"
        elif distance_from_center < 2000:
            environment_data["safety_level"] = "CONTESTED"
        elif distance_from_center < 3000:
            environment_data["safety_level"] = "NEUTRAL"
        else:
            environment_data["safety_level"] = "SECURE"
        
        if (1000 < pos_x < 3000) and (1000 < pos_y < 3000):
            if distance_from_center < 800:
                environment_data["anomaly_proximity"] = "DANGER"
            elif distance_from_center < 1500:
                environment_data["anomaly_proximity"] = "NEAR"
            elif distance_from_center < 2500:
                environment_data["anomaly_proximity"] = "DETECTED"
    
    response = {
        "id": character_id,
        "name": character["name"],
        "class": character.get("class", "Unknown"),
        "stats": character.get("stats", {}),
        "mods": character.get("mods", {}),
        "profs": character.get("profs", {}),
        "personality": character.get("personality", {}),
        "money": character.get("money", 0),
        "capacity": character.get("capacity", 50),
        "inventory": character.get("inventory", []),
        "equipment": character.get("equipment", {}),
        "avatar_url": character.get("avatar_url"),
        
        "radiation": environment_data["radiation"],
        "anomaly_proximity": environment_data["anomaly_proximity"],
        "safety_level": environment_data["safety_level"]
    }
    
    return response

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
    character_id = "1c5293ee-d3bd-4e7b-b91f-bb4f9f56a8a3"
    print(character_id)
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
@app.get("/api/item-types")
async def get_item_types():
    """Get all available item categories from the database"""
    try:
        # Return fixed categories that match our database tables
        item_types = [
            {"id": "weapons", "name": "Weapons"},
            {"id": "armor", "name": "Armor"},
            {"id": "ammo", "name": "Ammunition"},
            {"id": "medicine", "name": "Medicine"},
            {"id": "food", "name": "Food"},
            {"id": "artifacts", "name": "Artifacts"}
        ]
        print("Returning item types:", item_types)
        return JSONResponse(content=item_types)
    except Exception as e:
        print(f"Error in get_item_types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/items/{category}")
async def get_items_by_category(category: str):
    """Get all items from a specific category"""
    try:
        print(f"Fetching items for category: {category}")
        # Map frontend categories to database tables
        table_mapping = {
            "weapons": "weapons",
            "armor": "armor",
            "ammo": "ammo",
            "medicine": "medicine", 
            "food": "food",
            "artifacts": "artifacts"
        }
        
        table_name = table_mapping.get(category)
        if not table_name:
            print(f"Category not found: {category}")
            raise HTTPException(status_code=404, detail=f"Category {category} not found")
            
        items = db.get_all(table_name)
        print(f"Found {len(items)} items in category {category}")
        
        # Format the response based on category-specific fields
        formatted_items = []
        for item in items:
            base_item = {
                "id": item.get("id", ""),
                "name": item.get("name", ""),
                "weight": float(item.get("weight", 0)) if item.get("weight") else 0,
                "type": category
            }
            
            # Add category-specific fields
            if category == "weapons":
                base_item["damage"] = item.get("damage", "")
                base_item["range"] = item.get("range", "")
                base_item["calibre"] = item.get("calibre", "")
            elif category == "armor":
                base_item["protection"] = f"P:{item.get('physical', 0)} R:{item.get('radioactive', 0)} C:{item.get('chemical', 0)}"
                base_item["slots"] = item.get("artefact_slots", 0)
            elif category == "ammo":
                base_item["special"] = item.get("special", "")
            
            formatted_items.append(base_item)
        
        print("Returning formatted items")
        return JSONResponse(content=formatted_items)
    except Exception as e:
        print(f"Error in get_items_by_category: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    


@app.get("/games")
async def get_user_games(current_user: dict = Depends(get_current_user)):
    """Get all games where the user is either DM or player"""
    user_games = []
    
    # Find games where user is DM or player
    for game_id, game in games_db.items():
        is_dm = game["dm_id"] == current_user["id"]
        is_player = current_user["id"] in game.get("players", [])
        
        if is_dm or is_player:
            user_games.append({
                "id": game_id,
                "name": game.get("name", f"Game {game_id}"),
                "game_code": game["game_code"],
                "is_dm": is_dm,
                "created_at": game.get("created_at", datetime.now().isoformat())
            })
    
    return user_games
    
@app.put("/games/{game_id}")
async def update_game(
    game_id: str,
    game: GameUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update game details (only DM can do this)"""
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if games_db[game_id]["dm_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the DM can update this game")
    
    games_db[game_id]["name"] = game.name
    
    return {
        "id": game_id,
        "name": game.name,
        "game_code": games_db[game_id]["game_code"],
        "is_dm": True,
        "created_at": games_db[game_id].get("created_at", datetime.now().isoformat())
    }

@app.delete("/games/{game_id}")
async def delete_game(
    game_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a game (only DM can do this)"""
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if games_db[game_id]["dm_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the DM can delete this game")
    
    # Delete the game
    del games_db[game_id]
    
    # Also delete any associated characters
    characters_to_delete = []
    for char_id, character in characters_db.items():
        if character["game_id"] == game_id:
            characters_to_delete.append(char_id)
    
    for char_id in characters_to_delete:
        del characters_db[char_id]
    
    return {"message": "Game deleted successfully"}

# Add this endpoint for getting characters in a game

@app.get("/games/{game_id}/characters")
async def get_game_characters(
    game_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all characters in a game for the current user"""
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games_db[game_id]
    game_characters = []
    
    # Get all characters for this game that belong to the current user
    for character_id, character in characters_db.items():
        if character["game_id"] == game_id and character["user_id"] == current_user["id"]:
            game_characters.append({
                "id": character_id,
                "name": character["name"],
                "money": character.get("money", 0),
                "capacity": character.get("capacity", 60)
            })
    
    return {
        "game_id": game_id,
        "game_name": game.get("name", f"Game {game_id}"),
        "characters": game_characters
    }

@app.post("/games/{game_id}/characters")
async def create_game_character(
    game_id: str,
    character_data: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a new character for the current user in a game"""
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    character_name = character_data.get("name", "New Stalker")
    if not character_name:
        character_name = "New Stalker"
    
    # Create the character
    character_id = str(uuid.uuid4())
    inventory_items = copy.deepcopy(create_sample_inventory())
    
    # Create equipment slots
    equipment = {
        "headgear": None,
        "armor": None,
        "primary": None,
        "secondary": None,
        "tool": None,
        "pistol": None
    }
    
    # Create the character entry
    characters_db[character_id] = {
        "user_id": current_user["id"],
        "game_id": game_id,
        "name": character_name,
        "money": 10000,
        "capacity": 80,
        "inventory": inventory_items,
        "equipment": equipment
    }
    
    return {
        "id": character_id,
        "name": character_name,
        "money": 10000,
        "capacity": 80
    }
    
@app.post("/games/{game_id}/character/create")
async def create_detailed_character(
    game_id: str,
    character_data: CharacterCreationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a detailed character with stats, skills, and background"""
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Create a new character ID
    character_id = str(uuid.uuid4())
    
    equipment = {
        "headgear": None,
        "armor": None,
        "primary": None,
        "secondary": None,
        "tool": None,
        "pistol": None
    }
    
    # Create the character with detailed attributes
    characters_db[character_id] = {
        "user_id": current_user["id"],
        "game_id": game_id,
        "name": character_data.name,
        "class": character_data.charClass,
        "stats": character_data.stats.dict(),
        "mods": character_data.mods or {},
        "profs": character_data.profs or {},
        "personality": character_data.personality.dict(),
        "story": character_data.story,
        "motivation": character_data.motivation,
        "passivePerception": character_data.passivePerception or 10,
        "money": 50000,
        "capacity": 80,
        "inventory": [],
        "equipment": equipment
    }
    
    return {
        "id": character_id,
        "name": character_data.name,
        "class": character_data.charClass,
        "money": 10000,
        "capacity": 80
    }

@app.get("/games/{game_id}/pins")
async def get_game_pins(game_id: str, current_user: dict = Depends(get_current_user_or_none)):
    """Get all character pins for a game"""
    # Check if game exists
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games_db[game_id]
    is_dm = current_user and game["dm_id"] == current_user["id"]
    is_player = current_user and current_user["id"] in game["players"]
    
    # Check permissions - must be DM or player in this game
    if not (is_dm or is_player):
        raise HTTPException(status_code=403, detail="You don't have access to this game")
    
    # Get all characters in the game
    game_characters = []
    for char_id, char_data in characters_db.items():
        if char_data["game_id"] == game_id:
            game_characters.append({
                "id": char_id,
                "name": char_data["name"],
                "user_id": char_data["user_id"],
                "avatar_url": char_data.get("avatar_url", None),
                "is_monster": char_data.get("is_monster", False)
            })
    
    # Get or initialize pin positions
    if game_id not in pins_db:
        pins_db[game_id] = {}
    
    pins = []
    for char in game_characters:
        # Get the character's position or create default
        if char["id"] not in pins_db[game_id]:
            # Set default starting position (centered on map)
            pins_db[game_id][char["id"]] = {
                "x": 500,  # Default X position (center of map)
                "y": 500,  # Default Y position (center of map)
                "last_updated": datetime.now().isoformat()
            }
        
        position = pins_db[game_id][char["id"]]
        
        pins.append({
            "character_id": char["id"],
            "name": char["name"],
            "avatar_url": char["avatar_url"],
            "is_monster": char["is_monster"],
            "position_x": position["x"],
            "position_y": position["y"],
            "is_current_user": current_user and current_user["id"] == char["user_id"]
        })
    
    return {"pins": pins}

@app.put("/games/{game_id}/pins/{character_id}/position")
async def update_pin_position(
    game_id: str,
    character_id: str,
    position_data: PinPosition,
    current_user: dict = Depends(get_current_user)
):
    """Update a character pin position"""
    # Check if game exists
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check if character exists
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character = characters_db[character_id]
    game = games_db[game_id]
    
    # Check permissions - must be DM or the character's owner
    is_dm = game["dm_id"] == current_user["id"]
    is_owner = character["user_id"] == current_user["id"]
    
    if not (is_dm or is_owner):
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to move this pin"
        )
    
    # Initialize pins for game if they don't exist
    if game_id not in pins_db:
        pins_db[game_id] = {}
    
    # Update pin position
    pins_db[game_id][character_id] = {
        "x": position_data.x,
        "y": position_data.y,
        "last_updated": datetime.now().isoformat()
    }
    
    return {
        "status": "success",
        "character_id": character_id,
        "position": {
            "x": position_data.x,
            "y": position_data.y
        }
    }
@app.post("/games/{game_id}/monsters")
async def create_monster_pin(
    game_id: str,
    monster_data: MonsterPinCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a monster pin (DM only)"""
    # Check if game exists
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check permissions - only DM can add monsters
    game = games_db[game_id]
    if game["dm_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403, 
            detail="Only the DM can add monsters"
        )
    
    # Create a monster character
    monster_id = str(uuid.uuid4())
    characters_db[monster_id] = {
        "user_id": current_user["id"],  # DM owns the monster
        "game_id": game_id,
        "name": monster_data.name,
        "is_monster": True,
        "money": 0,
        "capacity": 0
    }
    
    # Set monster pin position
    if game_id not in pins_db:
        pins_db[game_id] = {}
    
    pins_db[game_id][monster_id] = {
        "x": monster_data.position_x,
        "y": monster_data.position_y,
        "last_updated": datetime.now().isoformat()
    }
    
    return {
        "character_id": monster_id,
        "name": monster_data.name,
        "position_x": monster_data.position_x,
        "position_y": monster_data.position_y,
        "is_monster": True
    }
@app.get("/games/{game_id}")
async def get_game_by_id(
    game_id: str,
    current_user: dict = Depends(get_current_user_or_none)
):
    """Get details for a specific game"""
    # Check if game exists
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games_db[game_id]
    
    # For authenticated users, check if they're DM or player
    is_dm = current_user and game["dm_id"] == current_user["id"]
    is_player = current_user and current_user["id"] in game["players"]
    
    return {
        "id": game_id,
        "name": game.get("name", f"Game {game_id}"),
        "game_code": game["game_code"],
        "created_at": game.get("created_at", datetime.now().isoformat()),
        "is_dm": is_dm,
        "player_count": len(game.get("players", []))
    }

@app.get("/{path:path}", include_in_schema=False)
async def serve_spa(path: str):
    # First check if the requested path exists as a file
    file_path = os.path.join(dist_path, path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # If not found, serve index.html for client-side routing
    return FileResponse(os.path.join(dist_path, "index.html"))
# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)