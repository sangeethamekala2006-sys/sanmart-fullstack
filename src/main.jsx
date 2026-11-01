import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const money = n =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(n);

const token = () => localStorage.getItem("sm_token") || "";

async function api(path, opt = {}) {
  const r = await fetch(path, {
    ...opt,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: "Bearer " + token() } : {}),
      ...(opt.headers || {})
    }
  });

  const d = await r.json().catch(() => ({}));

  if (!r.ok) throw Error(d.message || "Request failed");

  return d;
}

function App() {
  const [products, P] = useState([]);
  const [categories, C] = useState(["All"]);
  const [cat, SC] = useState("All");
  const [q, SQ] = useState("");

  const [cart, Cart] = useState(() =>
    JSON.parse(localStorage.getItem("sm_cart") || "[]")
  );

  const [user, U] = useState(() =>
    JSON.parse(localStorage.getItem("sm_user") || "null")
  );

  const [modal, M] = useState("");
  const [msg, Msg] = useState("");
  const [form, F] = useState({});
  const [busy, B] = useState(false);

  const [adminProducts, AP] = useState([]);
  const [orders, O] = useState([]);
  const [myOrders, MO] = useState([]);
  const [editing, E] = useState(null);

const [profileOpen, setProfileOpen] = useState(false);
const [profileData, setProfileData] = useState(null);
const [wishlist, setWishlist] = useState([]);
const [addresses, setAddresses] = useState([]);
const [selectedAddress, setSelectedAddress] = useState("");
const [paymentMethod, setPaymentMethod] = useState("cod");
const [mockOutcome, setMockOutcome] = useState("success");
const [returnToCheckout, setReturnToCheckout] = useState(false);
const [language, setLanguage] = useState("English");
const [notifications, setNotifications] = useState({
  email: true,
  orderUpdates: true,
  offers: false
});


  async function load() {
    try {
      P(
        (await api(
          `/api/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`
        )).products
      );

      C([
        "All",
        ...(await api("/api/products/categories")).categories
      ]);
    } catch (e) {
      Msg(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [q, cat]);

  useEffect(() => {
    localStorage.setItem("sm_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
  if (!msg) return;

  const timer = setTimeout(() => {
    Msg("");
  }, 3000);

  return () => clearTimeout(timer);
}, [msg]);

  const total = cart.reduce(
    (s, x) => s + x.price * x.quantity,
    0
  );

  const count = cart.reduce(
    (s, x) => s + x.quantity,
    0
  );

  const set = (k, v) =>
    F(f => ({ ...f, [k]: v }));

  async function authSubmit(e) {
    e.preventDefault();
    B(true);

    try {
      const d = await api(
        modal === "register"
          ? "/api/auth/register"
          : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(form)
        }
      );

      localStorage.setItem("sm_token", d.token);
      localStorage.setItem("sm_user", JSON.stringify(d.user));

      U(d.user);
      M("");
      F({});

      Msg("Welcome, " + d.user.name);
    } catch (e) {
      Msg(e.message);
    } finally {
      B(false);
    }
  }

  async function loadProfile() {
    try {
      const d = await api("/api/profile");
      setProfileData(d.user || user);
      setAddresses(d.addresses || []);
      setWishlist(d.wishlist || []);
      setLanguage(d.language || "English");
      setNotifications(d.notifications || {
        email: true,
        orderUpdates: true,
        offers: false
      });
    } catch (e) {
      Msg(e.message);
    }
  }

  useEffect(() => {
    if (user) {
      loadProfile();
      loadOrders().catch(e => Msg(e.message));
    } else {
      MO([]);
    }
  }, [user?._id, user?.id]);

  function logout() {
    localStorage.removeItem("sm_token");
    localStorage.removeItem("sm_user");
    U(null);
    setProfileOpen(false);
    setWishlist([]);
    setAddresses([]);
    setSelectedAddress("");
    setReturnToCheckout(false);
    setProfileData(null);
    MO([]);
    M("");
    Msg("Signed out");
  }

  async function toggleWishlist(product) {
    if (!user) {
      M("login");
      Msg("Please sign in to use your wishlist.");
      return;
    }

    try {
      const exists = wishlist.some(x => (x._id || x) === product._id);
      await api("/api/wishlist/" + product._id, {
        method: exists ? "DELETE" : "POST"
      });
      await loadProfile();
      Msg(exists ? "Removed from wishlist" : "Added to wishlist ❤️");
    } catch (e) {
      Msg(e.message);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const d = await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          email: form.email
        })
      });
      U(d.user);
      localStorage.setItem("sm_user", JSON.stringify(d.user));
      setProfileData(d.user);
      M("");
      Msg("Profile updated successfully");
    } catch (e) {
      Msg(e.message);
    }
  }

  async function saveAddress(e) {
    e.preventDefault();
    try {
      const addressId = form.addressId;
      const result = await api(
        addressId ? "/api/profile/addresses/" + addressId : "/api/profile/addresses",
        {
          method: addressId ? "PUT" : "POST",
          body: JSON.stringify(form)
        }
      );

      await loadProfile();
      F({});
      Msg("Address saved successfully");

      if (returnToCheckout) {
        const updatedAddresses = result.addresses || [];
        const preferredAddress =
          updatedAddresses.find(a => a.isDefault) ||
          updatedAddresses[updatedAddresses.length - 1];

        setAddresses(updatedAddresses);
        setSelectedAddress(preferredAddress?._id || "");
        setReturnToCheckout(false);
        M("checkout");
      }
    } catch (e) {
      Msg(e.message);
    }
  }

  async function deleteAddress(id) {
    try {
      await api("/api/profile/addresses/" + id, { method: "DELETE" });
      await loadProfile();
      Msg("Address deleted");
    } catch (e) {
      Msg(e.message);
    }
  }

  async function saveLanguage(value) {
    try {
      await api("/api/profile/language", {
        method: "PUT",
        body: JSON.stringify({ language: value })
      });
      setLanguage(value);
      Msg("Language preference saved");
    } catch (e) {
      Msg(e.message);
    }
  }

  async function saveNotifications(value) {
    try {
      const d = await api("/api/profile/notifications", {
        method: "PUT",
        body: JSON.stringify(value)
      });
      setNotifications(d.notifications || value);
      Msg("Notification settings saved");
    } catch (e) {
      Msg(e.message);
    }
  }

  function openProfileSection(name) {
    setProfileOpen(false);
    setReturnToCheckout(false);
    F({});
    M(name);
    if (name === "wishlist" || name === "addresses" || name === "editprofile" ||
        name === "language" || name === "notifications") {
      loadProfile();
    }
  }

  // ADD TO CART FUNCTION
  function add(p) {
    if (!p.stock || p.stock <= 0) {
      Msg("Sorry! This product is out of stock.");
      return;
    }

    const existing = cart.find(a => a._id === p._id);
    const maxQuantity = Math.min(10, p.stock);

    if (existing && existing.quantity >= maxQuantity) {
      Msg("Maximum available quantity reached!");
      return;
    }

    Cart(old => {
      const item = old.find(a => a._id === p._id);

      if (item) {
        return old.map(a =>
          a._id === p._id
            ? { ...a, quantity: a.quantity + 1 }
            : a
        );
      }

      return [
        ...old,
        {
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          quantity: 1
        }
      ];
    });

    Msg("✓ Successfully added to cart!");
  }

  async function checkout() {
    if (!user) {
      M("login");
      Msg("Sign in before checkout");
      return;
    }

    if (!cart.length) {
      Msg("Your cart is empty.");
      return;
    }

    B(true);

    try {
      const d = await api("/api/profile");
      const savedAddresses = Array.isArray(d.addresses) ? d.addresses : [];
      const defaultAddress =
        savedAddresses.find(a => a.isDefault) || savedAddresses[0];

      setAddresses(savedAddresses);
      setSelectedAddress(defaultAddress?._id || "");
      setPaymentMethod("cod");
      setMockOutcome("success");
      setReturnToCheckout(false);
      M("checkout");
    } catch (e) {
      Msg(e.message);
    } finally {
      B(false);
    }
  }

  async function placeOrder() {
    const address = addresses.find(a => a._id === selectedAddress);

    if (!address) {
      Msg("Please select a delivery address.");
      return;
    }

    if (!cart.length) {
      Msg("Your cart is empty.");
      return;
    }

    B(true);

    try {
      const d = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map(x => ({
            productId: x._id,
            quantity: x.quantity
          })),
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            addressLine: address.addressLine,
            city: address.city,
            state: address.state,
            pincode: address.pincode
          },
          paymentMethod,
          ...(paymentMethod === "mock" ? { mockOutcome } : {})
        })
      });

      const completedSuccessfully =
        paymentMethod === "cod" || mockOutcome === "success";

      if (completedSuccessfully) {
        Cart([]);
        await load();
      }

      await loadOrders();
      M("myorders");
      Msg(d.message || "Order processed successfully.");
    } catch (e) {
      Msg(e.message);
    } finally {
      B(false);
    }
  }

  async function loadAdmin() {
    AP(
      (await api("/api/products?category=All")).products
    );

    O(
      (await api("/api/admin/orders")).orders
    );
  }

  async function loadOrders() {
    MO(
      (await api("/api/orders/mine")).orders
    );
  }

  async function open(name) {
    M(name);
    F({});

    if (name === "admin" && user?.role === "admin") {
      try {
        await loadAdmin();
      } catch (e) {
        Msg(e.message);
      }
    }

    if (name === "myorders" && user) {
      try {
        await loadOrders();
      } catch (e) {
        Msg(e.message);
      }
    }
  }

  async function save(e) {
    e.preventDefault();

    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock)
      };

      await api(
        editing
          ? "/api/products/" + editing
          : "/api/products",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(body)
        }
      );

      E(null);
      F({});

      await loadAdmin();
      await load();

      Msg("Product saved");
    } catch (e) {
      Msg(e.message);
    }
  }

  async function del(id) {
    if (!confirm("Delete product?")) return;

    try {
      await api("/api/products/" + id, {
        method: "DELETE"
      });

      await loadAdmin();
      await load();

    } catch (e) {
      Msg(e.message);
    }
  }

  return (
    <>
      <div className="top">
        SANMART — BIG FINDS, EVERYDAY PRICES
      </div>

      <header>
        <a className="logo" href="#">
          <b>S</b>
          <span>
            SAN<span>MART</span>
            <small>SHOP SMART. LIVE BETTER.</small>
          </span>
        </a>

        <input
          className="search"
          value={q}
          onChange={e => SQ(e.target.value)}
          placeholder="Search products..."
        />

        <div className="actions">
          {user ? (
            <>
              <div className="profile-wrap">
                <button
                  className="nav-icon-button profile-trigger"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-expanded={profileOpen}
                >
                  <span className="nav-symbol">👤</span>
                  <span>Hi, {user.name.split(" ")[0]}</span>
                  <span className="dropdown-arrow">▾</span>
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-user">
                      <b>{user.name}</b>
                      <small>{user.email}</small>
                    </div>
                    <button onClick={() => openProfileSection("editprofile")}>✏️ Edit Profile</button>
                    <button onClick={() => openProfileSection("addresses")}>📍 Address</button>
                    <button onClick={() => openProfileSection("language")}>🌐 Language</button>
                    <button onClick={() => openProfileSection("notifications")}>🔔 Notification Settings</button>
                    <button className="logout-item" onClick={logout}>↪ Log Out</button>
                  </div>
                )}
              </div>

              <button className="nav-icon-button" onClick={() => openProfileSection("wishlist")}>
                <span className="nav-symbol">♡</span><span>Wishlist ({wishlist.length})</span>
              </button>
              <button className="nav-icon-button" onClick={() => open("myorders")}>
                <span className="nav-symbol">📦</span><span>Orders ({myOrders.length})</span>
              </button>
              {user.role === "admin" && (
                <button className="nav-icon-button" onClick={() => open("admin")}>Admin</button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => open("login")}>Sign in</button>
              <button onClick={() => open("register")}>Register</button>
            </>
          )}

          <button className="cartbutton nav-icon-button" onClick={() => M("cart")}>
            <span className="nav-symbol">🛒</span><span>Cart ({count})</span>
          </button>
        </div>
      </header>

      <nav>
        {categories.map(c => (
          <button
            className={c === cat ? "chosen" : ""}
            key={c}
            onClick={() => SC(c)}
          >
            {c}
          </button>
        ))}
      </nav>

      <main>
        <section className="hero">
          <div>
            <small>THE SANMART EDIT</small>

            <h1>
              Good finds.
              <br />
              <em>Great prices.</em>
            </h1>

            <p>
              Everyday essentials and little upgrades,
              all in one place.
            </p>

            <button
              className="primary"
              onClick={() =>
                document.getElementById("products").scrollIntoView({
                  behavior: "smooth"
                })
              }
            >
              Explore products →
            </button>
          </div>

          <div className="heroart">
            <div className="tile one">
              JUST IN
              <strong>
                Everyday
                <br />
                upgrades.
              </strong>
              ✦
            </div>

            <div className="tile two">
              GOOD THINGS
              <strong>Start here.</strong>
              ◒
            </div>
          </div>
        </section>

        {msg && (
  <div className="toast-popup">
    <span className="toast-icon">✓</span>
    <span>{msg}</span>
    <button onClick={() => Msg("")}>×</button>
  </div>
)}

        <div id="products" className="section">
          <div>
            <small>SHOP THE COLLECTION</small>

            <h2>
              {cat === "All"
                ? "Discover your next favourite"
                : cat + " picks"}
            </h2>
          </div>

          <span>{products.length} products</span>
        </div>

        <section className="grid">
          {products.map((p, i) => (
            <article className="product" key={p._id}>
              <div className={"photo tone" + (i % 4)}>
                {p.image && <img src={p.image} alt={p.name} />}
                <button
                  className={"wishlist-heart " + (wishlist.some(x => (x._id || x) === p._id) ? "active" : "")}
                  onClick={() => toggleWishlist(p)}
                  aria-label="Add to wishlist"
                  title="Add to wishlist"
                >
                  {wishlist.some(x => (x._id || x) === p._id) ? "♥" : "♡"}
                </button>
                <small>{p.stock ? "READY TO SHIP" : "SOLD OUT"}</small>
              </div>

              <div className="info">
                <small>{p.category}</small>

                <h3>{p.name}</h3>

                <p>{p.description}</p>

                <div>
                  <b>{money(p.price)}</b>

                  <button
                    disabled={!p.stock}
                    onClick={() => add(p)}
                  >
                    Add +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {!products.length && (
          <p className="empty">
            No products found. Try another search.
          </p>
        )}

        <section className="perks">
          <div>
            <small>01 /</small>
            <h3>Easy discoveries</h3>
            <p>Everyday favourites without the fuss.</p>
          </div>

          <div>
            <small>02 /</small>
            <h3>Secure payments</h3>
            <p>Cash on Delivery and local test checkout.</p>
          </div>

          <div>
            <small>03 /</small>
            <h3>Made to be simple</h3>
            <p>A smoother way to shop.</p>
          </div>
        </section>
      </main>

      <footer>
        <b>SANMART</b>
        <span>
          © {new Date().getFullYear()} SANMART · Learning starter store
        </span>
      </footer>

      {modal && (
        <div className="shade" onClick={() => { M(""); setReturnToCheckout(false); }}>
          <section
            className={
              "modal " +
              (["admin", "myorders", "addresses", "wishlist", "checkout"].includes(modal) ? "wide" : "")
            }
            onClick={e => e.stopPropagation()}
          >
            <div className="modalhead">
              <h2>
                {{
                  login: "Welcome back",
                  register: "Create account",
                  cart: "Your shopping cart",
                  checkout: "Checkout",
                  admin: "Store admin",
                  myorders: "Your orders",
                  editprofile: "Edit Profile",
                  addresses: "Manage Addresses",
                  language: "Language Settings",
                  notifications: "Notification Settings",
                  wishlist: "My Wishlist"
                }[modal]}
              </h2>

              <button onClick={() => { M(""); setReturnToCheckout(false); }}>×</button>
            </div>

            {["login", "register"].includes(modal) && (
              <form onSubmit={authSubmit}>
                {modal === "register" && (
                  <label>
                    Name
                    <input
                      required
                      value={form.name || ""}
                      onChange={e => set("name", e.target.value)}
                    />
                  </label>
                )}

                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={form.email || ""}
                    onChange={e => set("email", e.target.value)}
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    minLength="8"
                    required
                    value={form.password || ""}
                    onChange={e => set("password", e.target.value)}
                  />
                </label>

                <button className="primary full" disabled={busy}>
                  {busy
                    ? "Please wait..."
                    : modal === "register"
                    ? "Create account"
                    : "Sign in"}
                </button>

                <p className="switch">
                  {modal === "login"
                    ? "New here?"
                    : "Already registered?"}

                  <button
                    type="button"
                    onClick={() => {
                      M(modal === "login" ? "register" : "login");
                      F({});
                    }}
                  >
                    {modal === "login"
                      ? "Create account"
                      : "Sign in"}
                  </button>
                </p>
              </form>
            )}

            {modal === "cart" && (
              <>
                {cart.length ? (
                  cart.map(x => (
                    <div className="cartline" key={x._id}>
                      <span>
                        {x.name}
                        <small>{money(x.price)} each</small>
                      </span>

                      <div>
                        <button
                          onClick={() =>
                            Cart(c =>
                              c
                                .map(a =>
                                  a._id === x._id
                                    ? { ...a, quantity: a.quantity - 1 }
                                    : a
                                )
                                .filter(a => a.quantity > 0)
                            )
                          }
                        >
                          −
                        </button>

                        {" "}{x.quantity}{" "}

                        <button
                          onClick={() =>
                            Cart(c =>
                              c.map(a =>
                                a._id === x._id
                                  ? {
                                      ...a,
                                      quantity: Math.min(10, a.quantity + 1)
                                    }
                                  : a
                              )
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <b>{money(x.price * x.quantity)}</b>
                    </div>
                  ))
                ) : (
                  <p>Your cart is empty.</p>
                )}

                <h3 className="total">
                  Subtotal: {money(total)}
                </h3>

                <button
                  className="primary full"
                  disabled={!cart.length || busy}
                  onClick={checkout}
                >
                  {busy ? "Please wait..." : "Continue to checkout →"}
                </button>
              </>
            )}

            {modal === "checkout" && user && (
              <div className="profile-form checkout-form">
                <h3>1. Delivery Address</h3>

                {addresses.length ? (
                  <label>
                    Select a saved address
                    <select
                      value={selectedAddress}
                      onChange={e => setSelectedAddress(e.target.value)}
                    >
                      <option value="">Choose delivery address</option>
                      {addresses.map(a => (
                        <option key={a._id} value={a._id}>
                          {a.fullName} — {a.addressLine}, {a.city} ({a.pincode})
                          {a.isDefault ? " · Default" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p>No saved delivery address. Please add one to continue.</p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setReturnToCheckout(true);
                    F({});
                    M("addresses");
                  }}
                >
                  Add / Manage Address
                </button>

                <h3>2. Payment Method</h3>

                <label className="check-row">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  Cash on Delivery
                </label>

                <label className="check-row">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "mock"}
                    onChange={() => setPaymentMethod("mock")}
                  />
                  Online Payment (Mock Test Only)
                </label>

                {paymentMethod === "mock" && (
                  <label>
                    Mock payment result
                    <select
                      value={mockOutcome}
                      onChange={e => setMockOutcome(e.target.value)}
                    >
                      <option value="success">Simulate Success</option>
                      <option value="failed">Simulate Failure</option>
                    </select>
                  </label>
                )}

                {paymentMethod === "mock" && (
                  <p className="muted-note">
                    This is a local development simulation only. No real payment is processed.
                  </p>
                )}

                <h3>3. Order Summary</h3>
                {cart.map(item => (
                  <div className="cartline" key={item._id}>
                    <span>{item.name} × {item.quantity}</span>
                    <b>{money(item.price * item.quantity)}</b>
                  </div>
                ))}

                <h3 className="total">Total: {money(total)}</h3>

                <button
                  type="button"
                  className="primary full"
                  disabled={busy || !selectedAddress || !cart.length}
                  onClick={placeOrder}
                >
                  {busy
                    ? "Processing..."
                    : paymentMethod === "cod"
                    ? "Place COD Order"
                    : "Confirm Mock Payment"}
                </button>
              </div>
            )}

            {modal === "editprofile" && user && (
              <form onSubmit={saveProfile} className="profile-form">
                <label>
                  Full name
                  <input
                    required
                    value={form.name ?? profileData?.name ?? user.name ?? ""}
                    onChange={e => set("name", e.target.value)}
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    required
                    value={form.email ?? profileData?.email ?? user.email ?? ""}
                    onChange={e => set("email", e.target.value)}
                  />
                </label>
                <button className="primary full">Save Profile</button>
              </form>
            )}

            {modal === "addresses" && user && (
              <div className="profile-form">
                <form onSubmit={saveAddress}>
                  <h3>{form.addressId ? "Edit address" : "Add new address"}</h3>
                  {[
                    ["fullName", "Full name"],
                    ["phone", "Phone number"],
                    ["addressLine", "Address"],
                    ["city", "City"],
                    ["state", "State"],
                    ["pincode", "PIN code"]
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        required
                        value={form[key] || ""}
                        onChange={e => set(key, e.target.value)}
                      />
                    </label>
                  ))}
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isDefault)}
                      onChange={e => set("isDefault", e.target.checked)}
                    />
                    Set as default address
                  </label>
                  <button className="primary full">Save Address</button>
                  {form.addressId && (
                    <button type="button" onClick={() => F({})}>Cancel edit</button>
                  )}
                </form>

                <div className="saved-addresses">
                  <h3>Saved addresses</h3>
                  {addresses.length ? addresses.map(a => (
                    <div className="saved-address" key={a._id}>
                      <div>
                        <b>{a.fullName} {a.isDefault ? "· Default" : ""}</b>
                        <p>{a.addressLine}, {a.city}, {a.state} - {a.pincode}</p>
                        <small>{a.phone}</small>
                      </div>
                      <div className="address-actions">
                        <button onClick={() => F({
                          addressId: a._id,
                          fullName: a.fullName || "",
                          phone: a.phone || "",
                          addressLine: a.addressLine || "",
                          city: a.city || "",
                          state: a.state || "",
                          pincode: a.pincode || "",
                          isDefault: Boolean(a.isDefault)
                        })}>Edit</button>
                        <button onClick={() => deleteAddress(a._id)}>Delete</button>
                      </div>
                    </div>
                  )) : <p>No saved addresses yet.</p>}
                </div>
              </div>
            )}

            {modal === "language" && user && (
              <div className="profile-form">
                <label>
                  Choose your preferred language
                  <select value={language} onChange={e => saveLanguage(e.target.value)}>
                    <option>English</option>
                    <option>Tamil</option>
                    <option>Hindi</option>
                  </select>
                </label>
                <p className="muted-note">
                  This saves your language preference. The store interface will remain in its current language until translations are added.
                </p>
              </div>
            )}

            {modal === "notifications" && user && (
              <div className="profile-form notification-options">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(notifications.email)}
                    onChange={e => saveNotifications({...notifications, email: e.target.checked})}
                  />
                  Email notifications
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(notifications.orderUpdates)}
                    onChange={e => saveNotifications({...notifications, orderUpdates: e.target.checked})}
                  />
                  Order updates
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(notifications.offers)}
                    onChange={e => saveNotifications({...notifications, offers: e.target.checked})}
                  />
                  Offers and promotions
                </label>
                <p className="muted-note">
                  These preferences are saved to your account. Actual email or push delivery needs a notification service.
                </p>
              </div>
            )}

            {modal === "wishlist" && user && (
              <div className="wishlist-list">
                {wishlist.length ? wishlist.map(item => {
                  const product = typeof item === "object"
                    ? item
                    : products.find(p => p._id === item);
                  if (!product) return null;
                  return (
                    <div className="wishlist-row" key={product._id}>
                      {product.image && <img src={product.image} alt={product.name} />}
                      <div className="wishlist-product-info">
                        <b>{product.name}</b>
                        <small>{money(product.price)}</small>
                      </div>
                      <button onClick={() => add(product)} disabled={!product.stock}>Add to cart</button>
                      <button onClick={() => toggleWishlist(product)}>Remove ♥</button>
                    </div>
                  );
                }) : <p>Your wishlist is empty. Tap ♡ on a product to save it.</p>}
              </div>
            )}

            {modal === "admin" && user?.role === "admin" && (
              <div className="admin">
                <form onSubmit={save}>
                  <h3>{editing ? "Edit product" : "Add product"}</h3>

                  {[
                    ["name", "Product name", "text"],
                    ["description", "Description", "text"],
                    ["category", "Category", "text"],
                    ["price", "Price (INR)", "number"],
                    ["image", "Image URL", "text"],
                    ["stock", "Stock", "number"]
                  ].map(([k, l, t]) => (
                    <label key={k}>
                      {l}

                      <input
                        required={["name", "category", "price", "stock"].includes(k)}
                        type={t}
                        min={t === "number" ? "0" : undefined}
                        value={form[k] ?? (k === "stock" ? "0" : "")}
                        onChange={e => set(k, e.target.value)}
                      />
                    </label>
                  ))}

                  <button className="primary full">
                    {editing ? "Save changes" : "Add product"}
                  </button>

                  {editing && (
                    <button
                      type="button"
                      onClick={() => {
                        E(null);
                        F({});
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>

                <div>
                  <h3>Products ({adminProducts.length})</h3>

                  {adminProducts.map(p => (
                    <div className="adminrow" key={p._id}>
                      <span>
                        <b>{p.name}</b>
                        <small>
                          {money(p.price)} · stock {p.stock}
                        </small>
                      </span>

                      <button
                        onClick={() => {
                          E(p._id);
                          F({
                            name: p.name,
                            description: p.description,
                            category: p.category,
                            price: p.price,
                            image: p.image,
                            stock: p.stock
                          });
                        }}
                      >
                        Edit
                      </button>

                      <button onClick={() => del(p._id)}>
                        Delete
                      </button>
                    </div>
                  ))}

                  <h3>Recent orders</h3>

                  {orders.map(o => (
                    <div className="adminrow" key={o._id}>
                      <span>
                        <b>{o.user?.name || "Customer"}</b>
                        <small>
                          {o.status} · {money(o.amountPaise / 100)}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modal === "admin" && user?.role !== "admin" && (
              <p>Admin access required.</p>
            )}

            {modal === "myorders" && (
              myOrders.length ? (
                myOrders.map(o => (
                  <div className="order" key={o._id}>
                    <div>
                      <b>
                        Order #{String(o._id).slice(-8).toUpperCase()}
                      </b>

                      <p>
                        {o.items.map(i =>
                          i.name + " × " + i.quantity
                        ).join(", ")}
                      </p>

                      <small>
                        {new Date(o.createdAt).toLocaleString()}
                      </small>
                      <small>
                        Payment: {o.paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : o.paymentMethod === "mock"
                          ? "Mock Payment (Simulated)"
                          : "Razorpay"}
                      </small>
                      {o.shippingAddress && (
                        <small>
                          Deliver to: {o.shippingAddress.addressLine}, {o.shippingAddress.city}
                        </small>
                      )}
                    </div>

                    <span>
                      {money(o.amountPaise / 100)}
                      <small className={"status " + o.status}>
                        {o.status}
                      </small>
                    </span>
                  </div>
                ))
              ) : (
                <p>No orders yet.</p>
              )
            )}
          </section>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
