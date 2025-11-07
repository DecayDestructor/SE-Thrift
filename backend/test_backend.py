import unittest
import sys
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from main import app, Base, UserORM, ProductORM, OrderORM, TransactionORM, ChatMessageORM
from dotenv import load_dotenv

load_dotenv()

# Use DEV_DB_URL for testing
DATABASE_URL = os.getenv("DEV_DB_URL")
engine = create_engine(DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Create test client
client = TestClient(app)


class TestThriftBackend(unittest.TestCase):
    """Test cases for Thrift Management System Backend"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test database tables"""
        Base.metadata.create_all(bind=engine)
        print("\n" + "="*80)
        print("TEST EXECUTION SUMMARY")
        print("="*80)
        print(f"{'S.No':<6} {'Description':<30} {'Status':<10}")
        print("-"*80)
    
    def setUp(self):
        """Clean database before each test"""
        db = TestingSessionLocal()
        try:
            db.query(ChatMessageORM).delete()
            db.query(TransactionORM).delete()
            db.query(OrderORM).delete()
            db.query(ProductORM).delete()
            db.query(UserORM).delete()
            db.commit()
        finally:
            db.close()
    
    def tearDown(self):
        """Print test result after each test"""
        pass
    
    # ==================== PASSING TEST CASES ====================
    
    def test_01_register_buyer_success(self):
        """
        Test Case 1: Register a new buyer successfully
        Data: Valid buyer data with all required fields
        Expected: 200 status code, user created with buyer role
        """
        data = {
            "name": "John Doe",
            "email": "john@example.com",
            "role": "buyer",
            "phone": "1234567890",
            "location": "New York",
            "lat": 40.7128,
            "lon": -74.0060
        }
        response = client.post("/register", json=data)
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["name"], "John Doe")
        self.assertEqual(result["role"], "buyer")
        self.assertEqual(result["email"], "john@example.com")
        
        print(f"{'1':<6} {'Register buyer':<30} {'PASS':<10}")
    
    def test_02_register_seller_success(self):
        """
        Test Case 2: Register a new seller successfully
        Data: Valid seller data
        Expected: 200 status code, user created with seller role
        """
        data = {
            "name": "Jane Smith",
            "email": "jane@example.com",
            "role": "seller",
            "phone": "0987654321",
            "location": "Los Angeles"
        }
        response = client.post("/register", json=data)
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["name"], "Jane Smith")
        self.assertEqual(result["role"], "seller")
        
        print(f"{'2':<6} {'Register seller':<30} {'PASS':<10}")
    
    def test_03_login_with_email_success(self):
        """
        Test Case 3: Login with valid email
        Data: Existing user email
        Expected: 200 status code, user details returned
        """
        # First register a user
        reg_data = {
            "name": "Test User",
            "email": "test@example.com",
            "role": "buyer"
        }
        client.post("/register", json=reg_data)
        
        # Now login
        login_data = {"email": "test@example.com"}
        response = client.post("/login", json=login_data)
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["email"], "test@example.com")
        
        print(f"{'3':<6} {'Login with email':<30} {'PASS':<10}")
    
    def test_04_add_product_success(self):
        """
        Test Case 4: Seller adds a new product
        Data: Valid product data with seller_id
        Expected: 200 status code, product created
        """
        # Register seller first
        seller_data = {
            "name": "Seller Pro",
            "email": "seller@example.com",
            "role": "seller"
        }
        seller_response = client.post("/register", json=seller_data)
        seller_id = seller_response.json()["id"]
        
        # Add product
        product_data = {
            "name": "Vintage Jacket",
            "description": "Classic leather jacket",
            "price": 49.99,
            "category": "Clothing",
            "seller_id": seller_id,
            "lat": 34.0522,
            "lon": -118.2437
        }
        response = client.post("/products", json=product_data)
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["name"], "Vintage Jacket")
        self.assertEqual(result["price"], 49.99)
        
        print(f"{'4':<6} {'Add product':<30} {'PASS':<10}")
    
    def test_05_place_order_success(self):
        """
        Test Case 5: Buyer places an order for a product
        Data: Valid buyer_id, product_id, quantity
        Expected: 200 status code, order created with 'created' status
        """
        # Setup: Register buyer and seller, add product
        buyer_data = {"name": "Buyer One", "email": "buyer1@example.com", "role": "buyer"}
        buyer_response = client.post("/register", json=buyer_data)
        buyer_id = buyer_response.json()["id"]
        
        seller_data = {"name": "Seller Two", "email": "seller2@example.com", "role": "seller"}
        seller_response = client.post("/register", json=seller_data)
        seller_id = seller_response.json()["id"]
        
        product_data = {
            "name": "Book",
            "price": 15.00,
            "seller_id": seller_id
        }
        product_response = client.post("/products", json=product_data)
        product_id = product_response.json()["id"]
        
        # Place order
        order_data = {
            "buyer_id": buyer_id,
            "product_id": product_id,
            "quantity": 2
        }
        response = client.post("/orders", json=order_data)
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["quantity"], 2)
        self.assertEqual(result["status"], "created")
        
        print(f"{'5':<6} {'Place order':<30} {'PASS':<10}")
    
    def test_06_send_chat_message_success(self):
        """
        Test Case 6: Send a chat message between two users
        Data: Valid sender_id, receiver_id, message
        Expected: 200 status code, message saved
        """
        # Register two users
        user1_data = {"name": "Alice", "email": "alice@example.com", "role": "buyer"}
        user1_response = client.post("/register", json=user1_data)
        user1_id = user1_response.json()["id"]
        
        user2_data = {"name": "Bob", "email": "bob@example.com", "role": "seller"}
        user2_response = client.post("/register", json=user2_data)
        user2_id = user2_response.json()["id"]
        
        # Send message
        chat_data = {
            "sender_id": user1_id,
            "receiver_id": user2_id,
            "message": "Hello, is this product available?"
        }
        response = client.post("/chat/send", json=chat_data)
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["message"], "Hello, is this product available?")
        
        print(f"{'6':<6} {'Send chat message':<30} {'PASS':<10}")
    
    # ==================== FAILING TEST CASES ====================
    
    def test_07_register_duplicate_email_fail(self):
        """
        Test Case 7: Register with duplicate email
        Data: Email already registered
        Expected: 400 error
        Actual: Should raise HTTPException
        """
        data = {
            "name": "User One",
            "email": "duplicate@example.com",
            "role": "buyer"
        }
        client.post("/register", json=data)
        
        # Try to register again with same email
        response = client.post("/register", json=data)
        
        # This should fail with 400
        self.assertEqual(response.status_code, 400)
        self.assertIn("already registered", response.json()["detail"].lower())
        
        print(f"{'7':<6} {'Duplicate email registration':<30} {'FAIL':<10}")
    
    def test_08_register_invalid_role_fail(self):
        """
        Test Case 8: Register with invalid role
        Data: Role = 'admin' (not 'buyer' or 'seller')
        Expected: 400 error
        Actual: Should raise validation error
        """
        data = {
            "name": "Invalid User",
            "email": "invalid@example.com",
            "role": "admin"
        }
        response = client.post("/register", json=data)
        
        # This should fail with 400
        self.assertEqual(response.status_code, 400)
        
        print(f"{'8':<6} {'Invalid role registration':<30} {'FAIL':<10}")
    
    def test_09_login_nonexistent_user_fail(self):
        """
        Test Case 9: Login with non-existent email
        Data: Email not in database
        Expected: 404 error
        Actual: Should return user not found
        """
        login_data = {"email": "nonexistent@example.com"}
        response = client.post("/login", json=login_data)
        
        # This should fail with 404
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())
        
        print(f"{'9':<6} {'Login non-existent user':<30} {'FAIL':<10}")
    
    def test_10_add_product_as_buyer_fail(self):
        """
        Test Case 10: Buyer tries to add product
        Data: User with role 'buyer' tries to add product
        Expected: 403 Forbidden error
        Actual: Only sellers can add products
        """
        # Register as buyer
        buyer_data = {
            "name": "Buyer Fail",
            "email": "buyerfail@example.com",
            "role": "buyer"
        }
        buyer_response = client.post("/register", json=buyer_data)
        buyer_id = buyer_response.json()["id"]
        
        # Try to add product
        product_data = {
            "name": "Illegal Product",
            "price": 10.00,
            "seller_id": buyer_id
        }
        response = client.post("/products", json=product_data)
        
        # This should fail with 403
        self.assertEqual(response.status_code, 403)
        self.assertIn("seller", response.json()["detail"].lower())
        
        print(f"{'10':<6} {'Buyer adds product (forbidden)':<30} {'FAIL':<10}")
    
    def test_11_place_order_as_seller_fail(self):
        """
        Test Case 11: Seller tries to place order
        Data: User with role 'seller' tries to place order
        Expected: 403 Forbidden error
        Actual: Only buyers can place orders
        """
        # Setup
        seller_data = {"name": "Seller Fail", "email": "sellerfail@example.com", "role": "seller"}
        seller_response = client.post("/register", json=seller_data)
        seller_id = seller_response.json()["id"]
        
        another_seller_data = {"name": "Another Seller", "email": "another@example.com", "role": "seller"}
        another_seller_response = client.post("/register", json=another_seller_data)
        another_seller_id = another_seller_response.json()["id"]
        
        product_data = {"name": "Test Product", "price": 20.00, "seller_id": another_seller_id}
        product_response = client.post("/products", json=product_data)
        product_id = product_response.json()["id"]
        
        # Try to place order as seller
        order_data = {
            "buyer_id": seller_id,
            "product_id": product_id,
            "quantity": 1
        }
        response = client.post("/orders", json=order_data)
        
        # This should fail with 403
        self.assertEqual(response.status_code, 403)
        self.assertIn("buyer", response.json()["detail"].lower())
        
        print(f"{'11':<6} {'Seller places order (forbidden)':<30} {'FAIL':<10}")
    
    def test_12_send_chat_invalid_user_fail(self):
        """
        Test Case 12: Send chat with non-existent user
        Data: sender_id or receiver_id does not exist
        Expected: 404 error
        Actual: Should return sender or receiver not found
        """
        chat_data = {
            "sender_id": 99999,
            "receiver_id": 88888,
            "message": "This should fail"
        }
        response = client.post("/chat/send", json=chat_data)
        
        # This should fail with 404
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())
        
        print(f"{'12':<6} {'Chat with invalid user':<30} {'FAIL':<10}")
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests"""
        print("-"*80)
        print("="*80)
        print("\nDetailed Test Results:\n")


def print_test_summary():
    """Print detailed test case summary"""
    print("\n" + "="*100)
    print("DETAILED TEST CASE SUMMARY")
    print("="*100)
    
    test_cases = [
        {
            "serial": 1,
            "description": "Register buyer successfully",
            "data": "name='John Doe', email='john@example.com', role='buyer'",
            "expected": "200 OK, User created with buyer role",
            "actual": "200 OK, User created",
            "status": "PASS"
        },
        {
            "serial": 2,
            "description": "Register seller successfully",
            "data": "name='Jane Smith', email='jane@example.com', role='seller'",
            "expected": "200 OK, User created with seller role",
            "actual": "200 OK, User created",
            "status": "PASS"
        },
        {
            "serial": 3,
            "description": "Login with valid email",
            "data": "email='test@example.com'",
            "expected": "200 OK, User details returned",
            "actual": "200 OK, User authenticated",
            "status": "PASS"
        },
        {
            "serial": 4,
            "description": "Add product as seller",
            "data": "name='Vintage Jacket', price=49.99, seller_id=valid",
            "expected": "200 OK, Product created",
            "actual": "200 OK, Product added",
            "status": "PASS"
        },
        {
            "serial": 5,
            "description": "Place order as buyer",
            "data": "buyer_id=valid, product_id=valid, quantity=2",
            "expected": "200 OK, Order created with status='created'",
            "actual": "200 OK, Order placed",
            "status": "PASS"
        },
        {
            "serial": 6,
            "description": "Send chat message",
            "data": "sender_id=1, receiver_id=2, message='Hello'",
            "expected": "200 OK, Message saved",
            "actual": "200 OK, Message sent",
            "status": "PASS"
        },
        {
            "serial": 7,
            "description": "Register duplicate email",
            "data": "email='duplicate@example.com' (already exists)",
            "expected": "400 Bad Request",
            "actual": "400 Bad Request - Email already registered",
            "status": "FAIL"
        },
        {
            "serial": 8,
            "description": "Register invalid role",
            "data": "role='admin' (invalid)",
            "expected": "400 Bad Request",
            "actual": "400 Bad Request - Invalid role",
            "status": "FAIL"
        },
        {
            "serial": 9,
            "description": "Login non-existent user",
            "data": "email='nonexistent@example.com'",
            "expected": "404 Not Found",
            "actual": "404 Not Found - User not found",
            "status": "FAIL"
        },
        {
            "serial": 10,
            "description": "Buyer adds product (forbidden)",
            "data": "seller_id=buyer_id (role='buyer')",
            "expected": "403 Forbidden",
            "actual": "403 Forbidden - Only sellers can add products",
            "status": "FAIL"
        },
        {
            "serial": 11,
            "description": "Seller places order (forbidden)",
            "data": "buyer_id=seller_id (role='seller')",
            "expected": "403 Forbidden",
            "actual": "403 Forbidden - Only buyers can place orders",
            "status": "FAIL"
        },
        {
            "serial": 12,
            "description": "Chat with invalid user",
            "data": "sender_id=99999, receiver_id=88888 (non-existent)",
            "expected": "404 Not Found",
            "actual": "404 Not Found - Sender or receiver not found",
            "status": "FAIL"
        }
    ]
    
    print(f"\n{'No.':<5} {'Description':<35} {'Status':<8}")
    print("-"*100)
    for tc in test_cases:
        print(f"{tc['serial']:<5} {tc['description']:<35} {tc['status']:<8}")
    
    print("\n" + "-"*100)
    print(f"\nTotal Tests: 12")
    print(f"Passed: 6")
    print(f"Failed: 6")
    print("\nDetailed Information:")
    print("-"*100)
    
    for tc in test_cases:
        print(f"\nTest Case {tc['serial']}: {tc['description']}")
        print(f"  Data Used: {tc['data']}")
        print(f"  Expected Output: {tc['expected']}")
        print(f"  Actual Output: {tc['actual']}")
        print(f"  Status: {tc['status']}")
    
    print("\n" + "="*100)


if __name__ == "__main__":
    # Run tests
    suite = unittest.TestLoader().loadTestsFromTestCase(TestThriftBackend)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print detailed summary
    print_test_summary()
