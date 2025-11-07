# main.py

from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime, date
from math import radians, sin, cos, sqrt, atan2
import random

from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Numeric
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session


from typing import Optional as Opt, List as PyList, Any as PyAny, Dict as PyDict

class User:
    """
    Represents a base user in the thrift system.
    Corresponds to the User class in the diagram.
    Kept as a plain Python object for class-diagram fidelity.
    """
    def __init__(self, user_id: int, name: str, email: str, phone: str = "", location: str = "", profile_pic: str = ""):
        self.user_id: int = user_id
        self.name: str = name
        self.email: str = email
        self.phone: str = phone
        self.location: str = location
        self.profile_pic: str = profile_pic
        # lightweight in-memory structures (for demonstration)
        print(f"User '{name}' created.")

    def create_profile(self):
        """Creates the user's profile."""
        print(f"Profile for {self.name} created.")
        pass

    def update_profile(self, new_details: PyDict[str, PyAny]):
        """Updates the user's profile from a dictionary of new details."""
        print(f"Updating profile for {self.name}...")
        if 'name' in new_details:
            self.name = new_details['name']
        if 'phone' in new_details:
            self.phone = new_details['phone']
        if 'location' in new_details:
            self.location = new_details['location']
        print("Profile updated.")

    def delete_profile(self):
        """Deletes the user's profile."""
        print(f"Profile for {self.name} deleted.")
        pass

    def view_profile(self):
        """Displays the user's profile details."""
        print(f"--- Profile for {self.name} ---")
        print(f"ID: {self.user_id}")
        print(f"Email: {self.email}")
        print(f"Phone: {self.phone}")
        print(f"Location: {self.location}")
        print("--------------------------")


class Buyer(User):
    """
    Represents a user who buys products. Inherits from User.
    """
    def __init__(self, user_id: int, name: str, email: str, phone: str = "", location: str = "", profile_pic: str = ""):
        super().__init__(user_id, name, email, phone, location, profile_pic)
        self.order_history: PyList['Order'] = []
        print(f"Buyer '{name}' created.")

    def search_product(self, search_engine: 'SearchEngine', query: str, filters: Optional[Dict[str, Any]] = None):
        print(f"Buyer {self.name} is searching for: '{query}'")
        return search_engine.apply_advanced_filters(query, filters)

    def filter_product(self, search_results: PyList['Product'], filter_criteria: Dict[str, Any]) -> PyList['Product']:
        print(f"Filtering {len(search_results)} products...")
        return search_results

    def track_order_history(self):
        print(f"--- Order History for {self.name} ---")
        if not self.order_history:
            print("No orders found.")
            return
        for order in self.order_history:
            print(f"  - Order ID: {order.order_id}, Status: {order.status}")
        print("-----------------------------------")


class Seller(User):
    """
    Represents a user who sells products. Inherits from User.
    """
    def __init__(self, user_id: int, name: str, email: str, phone: str = "", location: str = "", profile_pic: str = ""):
        super().__init__(user_id, name, email, phone, location, profile_pic)
        self.product_listings: PyList['Product'] = []
        self.orders_received: PyList['Order'] = []
        print(f"Seller '{name}' created.")

    def post_product(self, product: 'Product'):
        print(f"Seller {self.name} is posting product: {product.name}")
        self.product_listings.append(product)

    def manage_listing(self):
        print(f"--- Listings for {self.name} ---")
        if not self.product_listings:
            print("No active listings.")
            return
        for product in self.product_listings:
            print(f"  - ID: {product.product_id}, Name: {product.name}, Price: ${product.price}")
        print("-----------------------------")


class Chat:
    """
    Manages messages between users.
    """
    def __init__(self, chat_id: int, participants: PyList['User']):
        self.chat_id: int = chat_id
        self.messages: PyList[str] = []
        self.participants: PyList['User'] = participants

    def send_message(self, sender: 'User', message_text: str):
        if sender not in self.participants:
            print(f"Error: {sender.name} is not in this chat.")
            return
        formatted_message = f"[{sender.name}]: {message_text}"
        print(f"Chat {self.chat_id} - New Message: {formatted_message}")
        self.messages.append(formatted_message)

    def receive_message(self):
        print(f"--- Chat Log {self.chat_id} ---")
        for msg in self.messages:
            print(msg)
        print("-------------------------")


class SearchEngine:
    """
    Provides search and filter functionality.
    (We'll use DB-backed search for real endpoints; this class remains as demo.)
    """
    def __init__(self):
        pass

    def geospatial_search(self, all_products: PyList['Product'], location: str, radius_km: int) -> PyList['Product']:
        print(f"Performing geospatial search near {location} (radius: {radius_km}km)...")
        results = [p for p in all_products if p.location == location]
        return results

    def apply_advanced_filters(self, query: str, filters: Optional[Dict[str, Any]] = None) -> PyList['Product']:
        print(f"Applying advanced filters for query: '{query}'")
        if filters:
            print(f"Filters: {filters}")
        return []


class Product:
    """
    Plain Python product class (mirrors ORM fields; used for class diagram fidelity).
    """
    def __init__(self, product_id: int, name: str, description: str, price: float, category: str, location: str, seller: 'Seller'):
        self.product_id: int = product_id
        self.name: str = name
        self.description: str = description
        self.price: float = price
        self.category: str = category
        self.images: PyList[str] = []
        self.location: str = location
        self.seller: 'Seller' = seller

    def upload_image(self, image_url: str):
        print(f"Uploading image {image_url} for {self.name}...")
        self.images.append(image_url)

    def update_product(self, new_price: Optional[float] = None, new_description: Optional[str] = None):
        print(f"Updating product {self.product_id}...")
        if new_price is not None:
            self.price = new_price
            print(f"Price updated to ${new_price}")
        if new_description is not None:
            self.description = new_description
            print("Description updated.")

    def delete_product(self):
        print(f"Deleting product {self.product_id}: {self.name}")
        pass


class Order:
    """
    Plain Python order class (diagram fidelity). Note: we will maintain DB-backed OrderORM as source-of-truth.
    """
    def __init__(self, order_id: int, buyer: 'Buyer', seller: 'Seller', products: PyList['Product'], quantity: int, order_date: date):
        self.order_id: int = order_id
        self.quantity: int = quantity
        self.status: str = "Pending"
        self.order_date: date = order_date
        self.completion_date: Optional[date] = None

        self.buyer: 'Buyer' = buyer
        self.seller: 'Seller' = seller
        self.products: PyList['Product'] = products
        self.transactions: PyList['Transaction'] = []

        buyer.order_history.append(self)
        seller.orders_received.append(self)

    def place_order(self):
        self.status = "Placed"
        print(f"Order {self.order_id} placed by {self.buyer.name} to {self.seller.name}.")
        total_amount = sum(p.price for p in self.products) * self.quantity
        new_trans = Transaction(
            transaction_id=self.order_id * 10,
            order=self,
            amount=total_amount,
            transaction_date=date.today()
        )
        self.transactions.append(new_trans)
        print(f"Transaction {new_trans.transaction_id} created for ${total_amount}.")
        return new_trans

    def cancel_order(self):
        if self.status in ["Completed", "Shipped"]:
            print(f"Cannot cancel order {self.order_id}, status is {self.status}.")
            return
        self.status = "Cancelled"
        print(f"Order {self.order_id} cancelled.")
        for t in self.transactions:
            if t.status in ("Pending", "Created"):
                t.cancel_transaction()

    def update_order_status(self, new_status: str):
        print(f"Order {self.order_id} status updated from {self.status} to {new_status}")
        self.status = new_status
        if new_status == "Completed":
            self.completion_date = date.today()

    def view_order_details(self):
        print(f"--- Order {self.order_id} Details ---")
        print(f"Status: {self.status}")
        print(f"Buyer: {self.buyer.name}")
        print(f"Seller: {self.seller.name}")
        print("Products:")
        for p in self.products:
            print(f"  - {p.name} (${p.price})")
        print(f"Total Quantity: {self.quantity}")
        print(f"Order Date: {self.order_date}")
        if self.completion_date:
            print(f"Completion Date: {self.completion_date}")
        print("Transactions:")
        for t in self.transactions:
            print(f"  - Trans ID: {t.transaction_id}, Status: {t.status}, Amount: ${t.amount}")
        print("------------------------------")


class Transaction:
    """
    Plain Python transaction (diagram fidelity).
    """
    def __init__(self, transaction_id: int, order: 'Order', amount: float, transaction_date: date):
        self.transaction_id: int = transaction_id
        self.amount: float = amount
        self.status: str = "Pending"
        self.date: date = transaction_date
        self.order: 'Order' = order
        self.payment: Optional['Payment'] = None

    def create_transaction(self):
        self.status = "Created"
        print(f"Transaction {self.transaction_id} for order {self.order.order_id} is now 'Created'.")

    def update_transaction(self, new_status: str):
        print(f"Transaction {self.transaction_id} status updated to {new_status}")
        self.status = new_status
        if new_status == "Paid":
            self.order.update_order_status("Paid")

    def cancel_transaction(self):
        self.status = "Cancelled"
        print(f"Transaction {self.transaction_id} cancelled.")


class Payment:
    """
    Base class for processing payments.
    """
    def __init__(self, payment_id: int, transaction: 'Transaction', amount: float):
        self.payment_id: int = payment_id
        self.payment_status: str = "Pending"
        self.amount: float = amount
        self.transaction: 'Transaction' = transaction
        self.transaction.payment = self

    def make_payment(self):
        print(f"Initiating base payment {self.payment_id} for ${self.amount}...")
        raise NotImplementedError("Subclass must implement the 'make_payment' method")

    def verify_payment(self) -> bool:
        print(f"Verifying payment {self.payment_id}...")
        if self.payment_status == "Completed":
            print("Verification successful.")
            return True
        else:
            print("Verification failed: Payment not completed.")
            return False


class GooglePay(Payment):
    def __init__(self, payment_id: int, transaction: 'Transaction', amount: float):
        super().__init__(payment_id, transaction, amount)

    def process_payment(self):
        print(f"Processing Google Pay payment {self.payment_id}...")
        print("...Google Pay API processing (simulated)...")
        print("Google Pay payment successful.")
        self.payment_status = "Completed"
        self.transaction.update_transaction("Paid")

    def make_payment(self):
        print(f"Initiating payment {self.payment_id} via Google Pay...")
        self.process_payment()


# ---------------------------
# SQLAlchemy ORM models (DB-backed)
# ---------------------------
from dotenv import load_dotenv
import os

load_dotenv()

dev=True
DATABASE_URL = os.getenv("DEV_DB_URL") if dev else os.getenv("DB_URL")
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


class UserORM(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    role = Column(String, nullable=False)  # 'buyer' or 'seller'
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    profile_pic = Column(String, nullable=True)
    lat = Column(Float, nullable=True)   # for geospatial
    lon = Column(Float, nullable=True)

    products = relationship("ProductORM", back_populates="seller", cascade="all, delete-orphan")


class ProductORM(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    category = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    seller = relationship("UserORM", back_populates="products")
    orders = relationship("OrderORM", back_populates="product", cascade="all, delete-orphan")


class OrderORM(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    status = Column(String, default="created")
    order_date = Column(DateTime, default=datetime.utcnow)
    completion_date = Column(DateTime, nullable=True)

    product = relationship("ProductORM", back_populates="orders")
    transaction = relationship("TransactionORM", back_populates="order", uselist=False, cascade="all, delete-orphan")


class TransactionORM(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    amount = Column(Numeric(12,2), nullable=False)
    status = Column(String, default="pending")
    date = Column(DateTime, default=datetime.utcnow)

    order = relationship("OrderORM", back_populates="transaction")


class ChatMessageORM(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)


# Create tables
Base.metadata.create_all(bind=engine)

# ---------------------------
# Helpers to convert ORM -> OOP objects
# ---------------------------

def orm_user_to_oop(u: UserORM) -> User:
    """Build Buyer or Seller OOP instance from UserORM row."""
    if u.role == "buyer":
        return Buyer(user_id=u.id, name=u.name, email=u.email, phone=(u.phone or ""), location=(u.location or ""), profile_pic=(u.profile_pic or ""))
    else:
        return Seller(user_id=u.id, name=u.name, email=u.email, phone=(u.phone or ""), location=(u.location or ""), profile_pic=(u.profile_pic or ""))


def orm_product_to_oop(p: ProductORM, db: Session) -> Product:
    """Construct a minimal Product OOP from ProductORM. Seller becomes Seller OOP instance."""
    seller_orm = db.query(UserORM).filter(UserORM.id == p.seller_id).first()
    seller_oop = orm_user_to_oop(seller_orm) if seller_orm else Seller(0, "Unknown", "unknown@example.com")
    return Product(product_id=p.id, name=p.name, description=(p.description or ""), price=float(p.price), category=(p.category or ""), location=(seller_oop.location or ""), seller=seller_oop)


# ---------------------------
# Haversine helper
# ---------------------------

def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


# ---------------------------
# Pydantic Schemas
# ---------------------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str = Field(..., example="buyer")  # buyer or seller
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_pic: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_pic: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

    class Config:
        orm_mode = True


class LoginRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    image_url: Optional[str] = None
    seller_id: int
    lat: Optional[float] = None
    lon: Optional[float] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    category: Optional[str]
    image_url: Optional[str]
    seller_id: int
    lat: Optional[float]
    lon: Optional[float]

    class Config:
        orm_mode = True


class OrderCreate(BaseModel):
    buyer_id: int
    product_id: int
    quantity: int = 1


class OrderOut(BaseModel):
    id: int
    buyer_id: int
    product_id: int
    quantity: int
    status: str
    order_date: datetime
    completion_date: Optional[datetime]

    class Config:
        orm_mode = True


class TransactionCreate(BaseModel):
    order_id: int


class TransactionOut(BaseModel):
    id: int
    order_id: int
    amount: float
    status: str
    date: datetime

    class Config:
        orm_mode = True


class ChatSend(BaseModel):
    sender_id: int
    receiver_id: int
    message: str


class ChatOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str
    timestamp: datetime

    class Config:
        orm_mode = True


# ---------------------------
# FastAPI app & dependencies
# ---------------------------

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Thrift Management System (OOP + SQLAlchemy single-file)")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------
# User routes
# ---------------------------

@app.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if user_in.role not in ("buyer", "seller"):
        raise HTTPException(status_code=400, detail="role must be 'buyer' or 'seller'")
    existing = db.query(UserORM).filter(UserORM.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    u = UserORM(
        name=user_in.name,
        email=user_in.email,
        role=user_in.role,
        phone=user_in.phone,
        location=user_in.location,
        profile_pic=user_in.profile_pic,
        lat=user_in.lat,
        lon=user_in.lon
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    # create OOP wrapper (for teacher/demo)
    oop_user = orm_user_to_oop(u)
    return u


@app.post("/login", response_model=UserOut)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if not req.name and not req.email:
        raise HTTPException(status_code=400, detail="Provide name or email to login")
    q = db.query(UserORM)
    user = None
    if req.email:
        user = q.filter(UserORM.email == req.email).first()
    else:
        user = q.filter(UserORM.name == req.name).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found (mock login failed)")
    # Return ORM row; caller may convert to OOP class if needed
    return user


@app.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(UserORM).all()


# ---------------------------
# Product routes
# ---------------------------

@app.get("/products", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(ProductORM).all()


@app.post("/products", response_model=ProductOut)
def add_product(p_in: ProductCreate, db: Session = Depends(get_db)):
    seller = db.query(UserORM).filter(UserORM.id == p_in.seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    if seller.role != "seller":
        raise HTTPException(status_code=403, detail="Only users with role 'seller' can add products")
    p = ProductORM(
        name=p_in.name,
        description=p_in.description,
        price=p_in.price,
        category=p_in.category,
        image_url=p_in.image_url,
        seller_id=p_in.seller_id,
        lat=p_in.lat,
        lon=p_in.lon
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    # Optionally instantiate OOP Product for diagram fidelity:
    # seller_oop = orm_user_to_oop(seller)
    # oop_product = orm_product_to_oop(p, db)
    return p


@app.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, p_in: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(ProductORM).filter(ProductORM.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in p_in.dict(exclude_unset=True).items():
        setattr(p, field, value)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(ProductORM).filter(ProductORM.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return {"detail": "Product deleted"}


@app.get("/search", response_model=List[ProductOut])
def search_products(lat: float = Query(...), lon: float = Query(...), radius: float = Query(5.0), db: Session = Depends(get_db)):
    products = db.query(ProductORM).filter(ProductORM.lat != None, ProductORM.lon != None).all()
    nearby = []
    for p in products:
        # p.lat and p.lon may be Decimal/float; convert safely
        if p.lat is None or p.lon is None:
            continue
        d = distance_km(float(lat), float(lon), float(p.lat), float(p.lon))
        if d <= float(radius):
            nearby.append(p)
    return nearby


# ---------------------------
# Orders, Transactions, Payment
# ---------------------------

@app.post("/orders", response_model=OrderOut)
def place_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    buyer = db.query(UserORM).filter(UserORM.id == order_in.buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    if buyer.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can place orders")
    product = db.query(ProductORM).filter(ProductORM.id == order_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    o = OrderORM(
        buyer_id=order_in.buyer_id,
        product_id=order_in.product_id,
        quantity=order_in.quantity,
        status="created",
        order_date=datetime.utcnow()
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    # buyer_oop = orm_user_to_oop(buyer)
    # seller_oop = orm_user_to_oop(db.query(UserORM).filter(UserORM.id == product.seller_id).first())
    return o


@app.post("/transactions", response_model=TransactionOut)
def create_transaction(tx_in: TransactionCreate, db: Session = Depends(get_db)):
    order = db.query(OrderORM).filter(OrderORM.id == tx_in.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.transaction:
        raise HTTPException(status_code=400, detail="Transaction already exists for this order")
    product = db.query(ProductORM).filter(ProductORM.id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    amount = float(product.price) * int(order.quantity)
    tx = TransactionORM(order_id=order.id, amount=amount, status="pending", date=datetime.utcnow())
    order.status = "processing"
    db.add(tx)
    db.add(order)
    db.commit()
    db.refresh(tx)
    return tx


@app.post("/payment/process")
def process_payment(transaction_id: int = Query(...), db: Session = Depends(get_db)):
    tx = db.query(TransactionORM).filter(TransactionORM.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.status = "processing"
    tx.date = datetime.utcnow()
    if tx.order:
        tx.order.status = "processing"
        db.add(tx.order)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return {"detail": "Payment processing started", "transaction_id": tx.id, "status": tx.status}


@app.post("/payment/verify")
def verify_payment(transaction_id: int = Query(...), db: Session = Depends(get_db)):
    tx = db.query(TransactionORM).filter(TransactionORM.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    # 70% chance of success, 30% chance of failure
    approved = random.choices([True, False], weights=[70, 30])[0]
    if approved:
        tx.status = "approved"
        if tx.order:
            tx.order.status = "completed"
            tx.order.completion_date = datetime.utcnow()
    else:
        tx.status = "denied"
        if tx.order:
            tx.order.status = "cancelled"
            tx.order.completion_date = None
    tx.date = datetime.utcnow()
    db.add(tx)
    if tx.order:
        db.add(tx.order)
    db.commit()
    db.refresh(tx)
    return {"transaction_id": tx.id, "approved": approved, "tx_status": tx.status, "order_status": tx.order.status if tx.order else None}


# ---------------------------
# Chat endpoints
# ---------------------------

@app.post("/chat/send", response_model=ChatOut)
def send_message(msg: ChatSend, db: Session = Depends(get_db)):
    sender = db.query(UserORM).filter(UserORM.id == msg.sender_id).first()
    receiver = db.query(UserORM).filter(UserORM.id == msg.receiver_id).first()
    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Sender or receiver not found")
    c = ChatMessageORM(sender_id=msg.sender_id, receiver_id=msg.receiver_id, message=msg.message, timestamp=datetime.utcnow())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@app.get("/chat/{user_id}", response_model=List[ChatOut])
def get_messages(user_id: int, db: Session = Depends(get_db)):
    msgs = db.query(ChatMessageORM).filter(
        (ChatMessageORM.sender_id == user_id) | (ChatMessageORM.receiver_id == user_id)
    ).order_by(ChatMessageORM.timestamp.asc()).all()
    return msgs


# ---------------------------
# Small convenience listing endpoints
# ---------------------------

@app.get("/orders", response_model=List[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(OrderORM).all()


@app.get("/transactions", response_model=List[TransactionOut])
def list_transactions(db: Session = Depends(get_db)):
    return db.query(TransactionORM).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
