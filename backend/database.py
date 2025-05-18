import os
import csv
import mysql.connector
from mysql.connector import Error
import logging
import time
from typing import List, Dict, Any, Optional, Tuple, Union
from contextlib import contextmanager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Database:
    """Database connector with automatic CSV loading and data access methods."""
    
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        """Create singleton instance to ensure one database connection."""
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, 
                 host: str = 'stalker-ttrpg_database_1', 
                 user: str = 'ttrpg_user', 
                 password: str = None,
                 database: str = 'TTRPG_DB',
                 csv_directory: str = '/app/data/import'):
        """
        Initialize the database connector.
        
        Args:
            host: Database host
            user: Database user
            password: Database password
            database: Database name
            csv_directory: Directory containing CSV files
        """
        if self._initialized:
            return
            
        if password is None:
            password = os.environ.get('MYSQL_PASSWORD', 'secretpass')
            
        self.config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database
        }
        self.csv_directory = csv_directory
        self.connection = None
        self.cursor = None
        self._initialized = True
        
    @contextmanager
    def get_connection(self):
        """Context manager for database connections."""
        conn = None
        try:
            if self.connection and self.connection.is_connected():
                conn = self.connection
            else:
                conn = mysql.connector.connect(**self.config)
            yield conn
        except Error as e:
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn != self.connection and conn is not None:
                conn.close()

    @contextmanager
    def get_cursor(self, dictionary=True):
        """Context manager for database cursors."""
        with self.get_connection() as conn:
            cursor = None
            try:
                cursor = conn.cursor(dictionary=dictionary)
                yield cursor
                conn.commit()
            except Error as e:
                conn.rollback()
                logger.error(f"Database cursor error: {e}")
                raise
            finally:
                if cursor:
                    cursor.close()
                    
    def connect(self) -> bool:
        """Establish database connection with retry mechanism."""
        if self.connection and self.connection.is_connected():
            return True
            
        max_retries = 5
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                self.connection = mysql.connector.connect(**self.config)
                self.cursor = self.connection.cursor(dictionary=True)
                logger.info("Successfully connected to database")
                return True
            except Error as e:
                retry_count += 1
                wait_time = retry_count * 3 
                logger.warning(f"Connection attempt {retry_count} failed: {e}. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
        
        logger.error(f"Failed to connect to database after {max_retries} attempts")
        return False
    
    def close(self) -> None:
        """Close database connection."""
        if self.cursor:
            self.cursor.close()
            self.cursor = None
        if self.connection:
            self.connection.close()
            self.connection = None
            logger.info("Database connection closed")
            
    def __del__(self):
        """Cleanup resources on deletion."""
        self.close()
    
    def execute_query(self, query: str, params: tuple = None):
        """Execute a query and return results."""
        with self.get_cursor() as cursor:
            cursor.execute(query, params or ())
            if query.strip().upper().startswith(('SELECT', 'SHOW')):
                return cursor.fetchall()
            return cursor.rowcount
    
    def execute_many(self, query: str, params_list: List[tuple]):
        """Execute a query with multiple parameter sets."""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.executemany(query, params_list)
                conn.commit()
                return cursor.rowcount
    
    def get_tables(self) -> List[str]:
        """Get list of all tables in the database."""
        try:
            with self.get_cursor() as cursor:
                cursor.execute("SHOW TABLES")
                tables = [row[list(row.keys())[0]] for row in cursor.fetchall()]
                return tables
        except Error as e:
            logger.error(f"Error getting tables: {e}")
            return []
    
    def get_column_names(self, table_name: str) -> List[str]:
        """Get column names for a table."""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(f"DESCRIBE {table_name}")
                columns = [row['Field'] for row in cursor.fetchall()]
                return columns
        except Error as e:
            logger.error(f"Error getting column names for {table_name}: {e}")
            return []
    
    def table_is_empty(self, table_name: str) -> bool:
        """Check if a table is empty."""
        try:
            with self.get_cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
                result = cursor.fetchone()
                return result['count'] == 0
        except Error as e:
            logger.error(f"Error checking if {table_name} is empty: {e}")
            return True
    
    def load_csv_to_table(self, csv_file: str, table_name: str) -> bool:
        """
        Load data from a CSV file into a database table.
        
        Args:
            csv_file: Path to CSV file
            table_name: Name of target database table
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not os.path.exists(csv_file):
            logger.error(f"CSV file not found: {csv_file}")
            return False
            
        try:
            columns = self.get_column_names(table_name)
            
            with open(csv_file, 'r', encoding='utf-8') as f:
                csv_reader = csv.DictReader(f)
                
                csv_columns = csv_reader.fieldnames
                valid_columns = [col for col in csv_columns if col in columns]
                
                if not valid_columns:
                    logger.error(f"No matching columns found for table {table_name} in {csv_file}")
                    return False
                
                rows_loaded = 0
                for chunk in self._chunk_csv_rows(csv_reader, valid_columns, 1000):
                    if chunk:
                        with self.get_connection() as conn:
                            with conn.cursor() as cursor:
                                placeholders = ', '.join(['%s'] * len(valid_columns))
                                columns_str = ', '.join(valid_columns)
                                query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
                                
                                cursor.executemany(query, chunk)
                                conn.commit()
                                rows_loaded += len(chunk)
            
            logger.info(f"Successfully loaded {rows_loaded} rows from {csv_file} into {table_name}")
            return True
            
        except Error as e:
            logger.error(f"Error loading data into {table_name}: {e}")
            return False
    
    def _chunk_csv_rows(self, csv_reader, columns, chunk_size=1000):
        """Process CSV reader in chunks to handle large files."""
        chunk = []
        for row in csv_reader:
            values = [row.get(col, None) for col in columns]
            chunk.append(values)
            
            if len(chunk) >= chunk_size:
                yield chunk
                chunk = []
        
        if chunk: 
            yield chunk
    
    def ensure_csv_data_loaded(self) -> None:
        """
        Main function to ensure all CSV data is loaded into respective tables.
        This function detects empty tables and loads data from corresponding CSV files.
        """
        if not self.connect():
            logger.error("Cannot ensure CSV data is loaded: database connection failed")
            return
            
        try:
            tables = self.get_tables()
            logger.info(f"Found {len(tables)} tables in database")
            
            csv_files_loaded = 0
            for table in tables:
                if self.table_is_empty(table):
                    csv_file = os.path.join(self.csv_directory, f"{table}.csv")
                    
                    if os.path.exists(csv_file):
                        logger.info(f"Table {table} is empty. Loading data from {csv_file}")
                        if self.load_csv_to_table(csv_file, table):
                            csv_files_loaded += 1
                    else:
                        logger.warning(f"Table {table} is empty but no matching CSV file found at {csv_file}")
                else:
                    logger.info(f"Table {table} already contains data, skipping")
            
            logger.info(f"Loaded data from {csv_files_loaded} CSV files")
            
        except Exception as e:
            logger.error(f"Error ensuring CSV data is loaded: {e}")
        finally:
            self.close()
    
    def get_all(self, table_name: str, limit: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all records from a table with pagination."""
        try:
            query = f"SELECT * FROM {table_name} LIMIT %s OFFSET %s"
            return self.execute_query(query, (limit, offset))
        except Error as e:
            logger.error(f"Error getting data from {table_name}: {e}")
            return []
            
    def get_by_id(self, table_name: str, id_column: str, id_value: Any) -> Optional[Dict[str, Any]]:
        """Get a record by its ID."""
        try:
            query = f"SELECT * FROM {table_name} WHERE {id_column} = %s"
            results = self.execute_query(query, (id_value,))
            return results[0] if results else None
        except Error as e:
            logger.error(f"Error getting {table_name} by ID: {e}")
            return None
            
    def search(self, table_name: str, column: str, search_term: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Search in a table for matching records."""
        try:
            query = f"SELECT * FROM {table_name} WHERE {column} LIKE %s LIMIT %s"
            return self.execute_query(query, (f"%{search_term}%", limit))
        except Error as e:
            logger.error(f"Error searching in {table_name}: {e}")
            return []
            
    def get_related(self, table_name: str, foreign_table: str, 
                   foreign_key: str, primary_key_value: Any, 
                   limit: int = 100) -> List[Dict[str, Any]]:
        """Get related records from a foreign table."""
        try:
            query = f"""
                SELECT {foreign_table}.* 
                FROM {foreign_table}
                JOIN {table_name} ON {foreign_table}.{foreign_key} = {table_name}.id
                WHERE {table_name}.id = %s
                LIMIT %s
            """
            return self.execute_query(query, (primary_key_value, limit))
        except Error as e:
            logger.error(f"Error getting related data: {e}")
            return []
    
    def run_custom_query(self, query: str, params: tuple = None) -> Union[List[Dict[str, Any]], int]:
        """Run a custom SQL query."""
        return self.execute_query(query, params)
    
    def count(self, table_name: str, where_clause: str = None, params: tuple = None) -> int:
        """Count records in a table with optional where clause."""
        try:
            query = f"SELECT COUNT(*) as count FROM {table_name}"
            if where_clause:
                query += f" WHERE {where_clause}"
            result = self.execute_query(query, params)
            return result[0]['count'] if result else 0
        except Error as e:
            logger.error(f"Error counting records in {table_name}: {e}")
            return 0

db = Database()

def ensure_data_loaded():
    """Ensure all CSV data is loaded into database tables."""
    db.ensure_csv_data_loaded()

if __name__ == "__main__":
    ensure_data_loaded()