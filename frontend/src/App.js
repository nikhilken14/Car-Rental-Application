import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  getCars,
  getOwnerCars,
  getRentals,
  deleteCar,
  addCar,
  getRentInfo,
  rentCar,
  returnCar,
  suggestCars,
  errorMessage,
} from "./api";
import "./styles.css";
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
const rented = (car) => String(car.status).toLowerCase() === "rented";
function CarArt({ type = "", hero = false }) {
  return (
    <svg
      className={hero ? "car-art hero-art" : "car-art"}
      viewBox="0 0 640 300"
      role="img"
      aria-label={`${type || "Car"} illustration`}
    >
      <defs>
        <linearGradient
          id={hero ? "paint-hero" : "paint"}
          x1="0"
          y1="0"
          x2="0.5"
          y2="1"
        >
          <stop stopColor="#e6e8df" />
          <stop offset="1" stopColor="#929e92" />
        </linearGradient>
      </defs>
      <ellipse
        cx="325"
        cy="252"
        rx="258"
        ry="18"
        fill="#112a22"
        opacity=".15"
      />
      <path
        d="M60 207 83 166 175 144 244 78Q255 67 288 67L414 70Q437 72 455 91L511 151 570 172Q589 180 585 220L568 239 76 239Q52 237 60 207Z"
        fill={`url(#${hero ? "paint-hero" : "paint"})`}
        stroke="#78887c"
        strokeWidth="3"
      />
      <path
        d="m201 144 58-57 46-1-2 62Zm117-58 91 2 63 63-155-3Z"
        fill="#173b35"
      />
      <path d="m328 92 66 2 39 38-105-3Z" fill="#54766d" opacity=".65" />
      <path d="M89 172h75l-10 17H80Zm457 9h31v16h-37Z" fill="#f5f2db" />
      <path
        d="M92 215h458M312 154v53m166-51 18 54"
        fill="none"
        stroke="#74877c"
        strokeWidth="3"
      />
      <rect x="335" y="160" width="25" height="5" rx="2" fill="#3b5448" />
      {[166, 482].map((x) => (
        <g key={x}>
          <circle cx={x} cy="229" r="43" fill="#182b27" />
          <circle cx={x} cy="229" r="27" fill="#bcc5bc" />
          <circle cx={x} cy="229" r="16" fill="#63766d" />
          <circle cx={x} cy="229" r="7" fill="#cfd6cf" />
        </g>
      ))}
    </svg>
  );
}
function Modal({ title, children, onClose, busy }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.focus();
    const key = (e) => {
      if (e.key === "Escape" && !busy) onClose();
      if (e.key === "Tab") {
        const items = ref.current.querySelectorAll(
          'button:not(:disabled),input,select,[tabindex="0"]',
        );
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose, busy]);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={ref}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="modal"
      >
        <button
          className="close"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h2 id="dialog-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
const initialCar = {
  brand: "",
  vehicleType: "SUV",
  fuelType: "Petrol",
  capacity: 5,
  pricePerDay: "",
};
function readSaved(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}
function RentalList({
  records,
  isOwner,
  loading,
  error,
  busy,
  onReturn,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const rows = records.filter((record) =>
    `${record.car.brand} ${record.customerName} ${record.customerEmail}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <section className="rental-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ACTIVE RENTALS</p>
          <h2>{isOwner ? "Your rented cars." : "My rented cars."}</h2>
          <p>
            {isOwner
              ? "Only your vehicles and their current customers."
              : "Vehicles currently rented through your account."}
          </p>
        </div>
        <button
          className="button light"
          disabled={loading || busy}
          onClick={onRefresh}
        >
          ↻ Refresh rentals
        </button>
      </div>
      <label className="rental-search">
        Search active rentals
        <input
          placeholder={isOwner ? "Vehicle or customer" : "Vehicle name"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {loading ? (
        <div className="empty" role="status">
          Loading rentals…
        </div>
      ) : error ? (
        <div className="empty" role="alert">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="empty">
          <h3>No active rentals.</h3>
          <p>
            {search
              ? "Try a different search."
              : isOwner
                ? "Your rented vehicles will appear here after a customer books."
                : "Book an available ride to see it here."}
          </p>
        </div>
      ) : (
        <div className="rental-table-scroll">
          <table className="rental-table">
            <caption>
              {rows.length} active {rows.length === 1 ? "rental" : "rentals"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Vehicle</th>
                {isOwner && <th scope="col">Customer</th>}
                <th scope="col">Started</th>
                <th scope="col">Days</th>
                <th scope="col">Expected return</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                {isOwner && <th scope="col">Action</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ car, customerName, customerEmail }) => (
                <tr key={car.id}>
                  <td>
                    <strong>{car.brand}</strong>
                    <small>
                      {car.vehicleType} · {car.fuelType}
                    </small>
                  </td>
                  {isOwner && (
                    <td>
                      {customerName}
                      <small>{customerEmail}</small>
                    </td>
                  )}
                  <td>
                    {car.rentedAt
                      ? new Date(car.rentedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>{car.rentalDays || "—"}</td>
                  <td>
                    {car.rentedAt && car.rentalDays
                      ? new Date(
                          new Date(car.rentedAt).getTime() +
                            car.rentalDays * 86400000,
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    {car.rentalTotal != null ? money(car.rentalTotal) : "—"}
                  </td>
                  <td>
                    <span className="rental-badge">Rented</span>
                  </td>
                  {isOwner && (
                    <td>
                      <button
                        className="book"
                        disabled={busy}
                        onClick={() => onReturn(car)}
                      >
                        Return car ↗
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
export default function App({
  user = null,
  onSignIn = () => {},
  onLogout = () => {},
  sessionBusy = false,
}) {
  const isOwner = user?.role === "RENTER";
  const favoriteKey = `roam:favorites:${user?.id || "guest"}`;
  const [rentals, setRentals] = useState([]),
    [deleteTarget, setDeleteTarget] = useState(null);

  const [favorites, setFavorites] = useState(() => readSaved(favoriteKey)),
    [compared, setCompared] = useState([]),
    [compareOpen, setCompareOpen] = useState(false),
    [view, setView] = useState("grid"),
    [budget, setBudget] = useState(""),
    [statusFilter, setStatusFilter] = useState("all"),
    [limit, setLimit] = useState(6);
  useEffect(() => {
    try {
      localStorage.setItem(favoriteKey, JSON.stringify(favorites));
    } catch {}
  }, [favorites, favoriteKey]);
  function toggleFavorite(id) {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  }
  function toggleCompare(id) {
    setCompared((previous) => {
      if (previous.includes(id))
        return previous.filter((value) => value !== id);
      if (previous.length >= 3) return previous;
      return [...previous, id];
    });
  }

  const [cars, setCars] = useState([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(""),
    [tab, setTab] = useState(isOwner ? "manage" : "fleet"),
    [query, setQuery] = useState(""),
    [type, setType] = useState("All"),
    [fuel, setFuel] = useState(""),
    [travelers, setTravelers] = useState(1),
    [sort, setSort] = useState("price"),
    [suggested, setSuggested] = useState(null),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState(null),
    [days, setDays] = useState(3),
    [quote, setQuote] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [adding, setAdding] = useState(false),
    [draft, setDraft] = useState(initialCar);
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const results = await Promise.all([
        isOwner ? getOwnerCars() : getCars(),
        user ? getRentals() : Promise.resolve({ data: [] }),
      ]);
      setCars(results[0].data);
      setRentals(results[1].data);
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [isOwner, user]);
  useEffect(() => {
    load();
  }, [load]);
  const close = useCallback(() => {
    setSelected(null);
    setAdding(false);
    setCompareOpen(false);
    setDeleteTarget(null);
    setError("");
    setQuote(null);
  }, []);
  const available = cars.filter((c) => !rented(c));
  const types = ["All", ...new Set(cars.map((c) => c.vehicleType))];
  const visible = (tab === "manage" || tab === "saved" ? cars : available)
    .filter(
      (c) =>
        (tab !== "saved" || favorites.includes(c.id)) &&
        (!budget || c.pricePerDay <= Number(budget)) &&
        (tab !== "manage" ||
          statusFilter === "all" ||
          (statusFilter === "rented" ? rented(c) : !rented(c))) &&
        (type === "All" || c.vehicleType === type) &&
        (!fuel || c.fuelType?.toLowerCase() === fuel.toLowerCase()) &&
        c.capacity >= Number(travelers) &&
        `${c.brand} ${c.vehicleType}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (suggested === null || suggested.includes(c.id)),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.pricePerDay - b.pricePerDay
        : sort === "seats"
          ? b.capacity - a.capacity
          : a.brand.localeCompare(b.brand),
    );
  useEffect(() => {
    setLimit(6);
  }, [tab, query, type, fuel, travelers, budget, statusFilter, suggested]);
  const comparisonCars = cars.filter((car) => compared.includes(car.id));
  const occupancy = cars.length
    ? Math.round(((cars.length - available.length) / cars.length) * 100)
    : 0;
  async function recommendations(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!fuel) {
      setSuggested(null);
      return;
    }
    setBusy(true);
    try {
      setSuggested(
        (await suggestCars(fuel, Number(travelers))).data.map((c) => c.id),
      );
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function calculate(e) {
    e.preventDefault();
    setBusy(true);
    setQuote(null);
    setError("");
    try {
      const result = await getRentInfo(selected.id, Number(days));
      setQuote(result.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await rentCar(selected.id, quote.days);
      setNotice(
        `${selected.brand} booked for ${quote.days} days. Total: ${money(quote.totalCost)}.`,
      );
      close();
      setSuggested(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
      setQuote(null);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addCar({
        ...draft,
        brand: draft.brand.trim(),
        capacity: Number(draft.capacity),
        pricePerDay: Number(draft.pricePerDay),
      });
      setNotice("Your new car has been added to the fleet.");
      setDraft(initialCar);
      close();
      setSuggested(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function giveBack(car) {
    setBusy(true);
    try {
      await returnCar(car.id);
      setNotice(`${car.brand} is available again.`);
      await load();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function removeRide() {
    setBusy(true);
    setError("");
    try {
      await deleteCar(deleteTarget.id);
      setFavorites((previous) =>
        previous.filter((id) => id !== deleteTarget.id),
      );
      setCompared((previous) =>
        previous.filter((id) => id !== deleteTarget.id),
      );
      setNotice(`${deleteTarget.brand} was deleted from your fleet.`);
      close();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="header">
        <a className="brand" href="#home">
          <span className="brand-mark">r.</span>roam
          <span className="brand-dot">®</span>
        </a>
        <nav aria-label="Main navigation">
          {isOwner ? (
            <>
              <button
                className={tab === "manage" ? "nav-active" : ""}
                onClick={() => {
                  setTab("manage");
                  setSuggested(null);
                }}
              >
                Fleet management
              </button>
              <button
                className={tab === "rentals" ? "nav-active" : ""}
                onClick={() => setTab("rentals")}
              >
                Rented cars ({rentals.length})
              </button>
            </>
          ) : (
            <>
              <button
                className={tab === "fleet" ? "nav-active" : ""}
                onClick={() => {
                  setTab("fleet");
                  setSuggested(null);
                }}
              >
                Explore fleet
              </button>
              <button
                className={tab === "saved" ? "nav-active" : ""}
                onClick={() => {
                  setTab("saved");
                  setSuggested(null);
                }}
              >
                Saved rides ({favorites.length})
              </button>
              {user && (
                <button
                  className={tab === "rentals" ? "nav-active" : ""}
                  onClick={() => setTab("rentals")}
                >
                  My rentals ({rentals.length})
                </button>
              )}
            </>
          )}
        </nav>
        <div className="account-actions">
          {user ? (
            <>
              <span>
                {user.name}
                <small>{isOwner ? "Renter portal" : "Customer portal"}</small>
              </span>
              <button disabled={sessionBusy || busy} onClick={onLogout}>
                Sign out
              </button>
            </>
          ) : (
            <button className="button dark" onClick={onSignIn}>
              Sign in ↗
            </button>
          )}
        </div>
      </header>
      <main id="home">
        {isOwner ? (
          <section className="owner-intro">
            <p className="eyebrow">RENTER WORKSPACE</p>
            <h1>
              Your fleet.
              <br />
              <em>Your business.</em>
            </h1>
            <p>
              Manage your vehicles, track active rentals and keep every ride
              ready for its next customer.
            </p>
          </section>
        ) : (
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">GOOD CARS. GREAT POSSIBILITIES.</p>
              <h1>
                The journey
                <br />
                is <em>yours.</em>
              </h1>
              <p>
                City streets or the scenic route. Find a ride that fits your
                plans, and make the most of every mile.
              </p>
              <a className="button dark" href="#fleet">
                Find your ride <span>↗</span>
              </a>
              <div className="hero-note">
                <span>01 /</span> A fresh start, on four wheels.
              </div>
            </div>
            <div className="hero-visual">
              <span className="visual-label">MADE FOR THE OPEN ROAD</span>
              <span className="visual-orbit" />
              <span className="visual-word">GO.</span>
              <CarArt hero />
              <div className="visual-bottom">
                <span>YOUR PLANS. YOUR PACE.</span>
                <span>↗</span>
              </div>
            </div>
          </section>
        )}
        {tab !== "rentals" && (
          <section className="search-panel" aria-label="Find a car">
            <form onSubmit={recommendations}>
              <label>
                <span>SEARCH THE FLEET</span>
                <input
                  placeholder="Brand or vehicle type"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSuggested(null);
                  }}
                />
              </label>
              <label>
                <span>FUEL PREFERENCE</span>
                <select
                  value={fuel}
                  onChange={(e) => {
                    setFuel(e.target.value);
                    setSuggested(null);
                  }}
                >
                  <option value="">Any fuel</option>
                  {[
                    ...new Set([
                      "Petrol",
                      "Diesel",
                      "Electric",
                      "Hybrid",
                      ...cars.map((c) => c.fuelType),
                    ]),
                  ].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>TRAVELERS</span>
                <input
                  aria-label="Number of travelers"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  required
                  value={travelers}
                  onChange={(e) => {
                    setTravelers(e.target.value);
                    setSuggested(null);
                  }}
                />
              </label>
              <button className="button dark" disabled={busy}>
                {busy
                  ? "Finding…"
                  : fuel
                    ? "Suggest a ride ↗"
                    : "Explore rides ↗"}
              </button>
            </form>
          </section>
        )}
        <section className="benefits">
          <span>
            ↗ <b>Your next adventure, simplified.</b>
          </span>
          <span>01 &nbsp; Clear daily pricing</span>
          <span>02 &nbsp; A ride for every plan</span>
          <span>03 &nbsp; Book in a few clicks</span>
        </section>
        <section id="fleet" className="fleet">
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {tab === "rentals" ? (
            <RentalList
              records={rentals}
              isOwner={isOwner}
              loading={loading}
              error={loadError}
              busy={busy}
              onReturn={giveBack}
              onRefresh={load}
            />
          ) : (
            <>
              {tab === "manage" && (
                <section className="dashboard" aria-label="Fleet dashboard">
                  <div className="metric">
                    <span>Total vehicles</span>
                    <strong>{cars.length}</strong>
                    <small>Across {types.length - 1} vehicle types</small>
                  </div>
                  <div className="metric">
                    <span>Ready to go</span>
                    <strong>{available.length}</strong>
                    <small>Available for immediate rental</small>
                  </div>
                  <div className="metric">
                    <span>Currently rented</span>
                    <strong>{cars.length - available.length}</strong>
                    <small>{occupancy}% fleet utilization</small>
                    <div
                      className="progress"
                      role="meter"
                      aria-label="Fleet utilization"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={occupancy}
                    >
                      <span style={{ width: `${occupancy}%` }} />
                    </div>
                  </div>
                  <div className="metric">
                    <span>Average daily rate</span>
                    <strong>
                      {money(
                        cars.length
                          ? cars.reduce(
                              (sum, car) => sum + car.pricePerDay,
                              0,
                            ) / cars.length
                          : 0,
                      )}
                    </strong>
                    <small>Based on current fleet prices</small>
                  </div>
                </section>
              )}
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    {tab === "manage"
                      ? "THE WHOLE PICTURE"
                      : "PICK YOUR TRAVEL COMPANION"}
                  </p>
                  <h2>
                    {tab === "manage"
                      ? "Your fleet, in focus."
                      : tab === "saved"
                        ? "Your personal shortlist."
                        : "A ride for every road."}
                  </h2>
                  <p>
                    {tab === "manage"
                      ? `${cars.length} vehicles · ${available.length} available · ${cars.length - available.length} rented`
                      : tab === "saved"
                        ? "Save the rides you love. Your favorites stay in this browser."
                        : "Find the right fit. Your next story starts here."}
                  </p>
                </div>
                {tab === "manage" ? (
                  <button
                    className="button dark"
                    onClick={() => {
                      setAdding(true);
                      setError("");
                    }}
                  >
                    + Add vehicle
                  </button>
                ) : (
                  <span className="count">
                    {tab === "saved"
                      ? cars.filter((car) => favorites.includes(car.id)).length
                      : available.length}{" "}
                    {tab === "saved" ? "saved rides" : "available rides"}
                  </span>
                )}
              </div>
              <div className="fleet-tools">
                <div className="tabs" aria-label="Vehicle types">
                  {types.map((t) => (
                    <button
                      key={t}
                      className={type === t ? "active" : ""}
                      onClick={() => setType(t)}
                    >
                      {t === "All" ? "All vehicles" : t}
                    </button>
                  ))}
                </div>
                <label className="sort">
                  Sort by{" "}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="price">Price: low to high</option>
                    <option value="seats">Most seats</option>
                    <option value="name">Brand name</option>
                  </select>
                </label>
              </div>
              <div className="advanced-tools">
                <label>
                  Maximum daily rate (₹)
                  <input
                    aria-label="Maximum daily rate"
                    type="number"
                    min="0"
                    step="100"
                    value={budget}
                    placeholder="No limit"
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </label>
                {tab === "manage" && (
                  <label>
                    Availability
                    <select
                      aria-label="Availability"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All vehicles</option>
                      <option value="available">Available</option>
                      <option value="rented">Rented</option>
                    </select>
                  </label>
                )}
                <div
                  className="view-controls"
                  role="group"
                  aria-label="Fleet view"
                >
                  <button
                    className={view === "grid" ? "active" : ""}
                    aria-pressed={view === "grid"}
                    onClick={() => setView("grid")}
                  >
                    ▦ Grid
                  </button>
                  <button
                    className={view === "list" ? "active" : ""}
                    aria-pressed={view === "list"}
                    onClick={() => setView("list")}
                  >
                    ☷ List
                  </button>
                </div>
                <button
                  className="refresh-button"
                  disabled={loading || busy}
                  onClick={() => {
                    setSuggested(null);
                    load();
                  }}
                >
                  ↻ Refresh fleet
                </button>
                <span className="results-count" role="status">
                  {visible.length} matching{" "}
                  {visible.length === 1 ? "ride" : "rides"}
                </span>
              </div>
              {(query ||
                fuel ||
                type !== "All" ||
                Number(travelers) > 1 ||
                budget ||
                statusFilter !== "all") && (
                <div className="filter-summary">
                  <span>Filters are active</span>
                  <button
                    onClick={() => {
                      setQuery("");
                      setFuel("");
                      setTravelers(1);
                      setType("All");
                      setBudget("");
                      setStatusFilter("all");
                      setSuggested(null);
                    }}
                  >
                    Clear all filters ×
                  </button>
                </div>
              )}
              {suggested !== null && (
                <p className="recommendation">
                  Best available matches for your group{" "}
                  <button onClick={() => setSuggested(null)}>
                    Show all matches
                  </button>
                </p>
              )}
              {loading ? (
                <div className="empty" role="status">
                  Loading your next ride…
                </div>
              ) : loadError ? (
                <div className="empty" role="alert">
                  <h3>We couldn’t load the fleet.</h3>
                  <p>{loadError}</p>
                  <button className="button dark" onClick={load}>
                    Try again
                  </button>
                </div>
              ) : visible.length === 0 ? (
                <div className="empty">
                  <h3>
                    {tab === "saved"
                      ? "No saved rides match."
                      : cars.length
                        ? "No rides match your plans."
                        : "Your fleet starts here."}
                  </h3>
                  <p>
                    {tab === "saved"
                      ? "Tap the heart on a vehicle to save it, or clear your filters."
                      : cars.length
                        ? "Try a different fuel, budget, group size or search."
                        : isOwner
                          ? "Add your first vehicle in Fleet management to get started."
                          : "No vehicles are available right now. Please check again soon."}
                  </p>
                  <button
                    className="button light"
                    onClick={() => {
                      setQuery("");
                      setFuel("");
                      setTravelers(1);
                      setType("All");
                      setBudget("");
                      setStatusFilter("all");
                      setSuggested(null);
                      if (tab === "saved") setTab("fleet");
                      else if (!cars.length && isOwner) setTab("manage");
                    }}
                  >
                    {tab === "saved"
                      ? "Explore rides"
                      : cars.length
                        ? "Reset filters"
                        : isOwner
                          ? "Manage fleet"
                          : "Reset filters"}
                  </button>
                </div>
              ) : (
                <div
                  className={`car-grid ${view === "list" ? "list-view" : ""}`}
                >
                  {visible.slice(0, limit).map((car, index) => (
                    <article className="car-card" key={car.id}>
                      <div className={`car-picture tint-${index % 3}`}>
                        <span
                          className={
                            "status " + (rented(car) ? "unavailable" : "")
                          }
                        >
                          <i />
                          {rented(car) ? "Rented" : "Available"}
                        </span>
                        {!isOwner && (
                          <button
                            className={`favorite-button ${favorites.includes(car.id) ? "is-saved" : ""}`}
                            aria-label={`${favorites.includes(car.id) ? "Unsave" : "Save"} ${car.brand}`}
                            aria-pressed={favorites.includes(car.id)}
                            onClick={() => toggleFavorite(car.id)}
                          >
                            {favorites.includes(car.id) ? "♥" : "♡"}
                          </button>
                        )}
                        <CarArt type={car.vehicleType} />
                      </div>
                      <div className="car-content">
                        <p className="eyebrow">{car.vehicleType}</p>
                        <h3>{car.brand}</h3>
                        <div className="specs">
                          <span>◉ &nbsp; {car.fuelType}</span>
                          <span>♙ &nbsp; {car.capacity} seats</span>
                        </div>
                        {!isOwner && (
                          <label className="compare-checkbox">
                            <input
                              type="checkbox"
                              checked={compared.includes(car.id)}
                              disabled={
                                !compared.includes(car.id) &&
                                compared.length >= 3
                              }
                              onChange={() => toggleCompare(car.id)}
                            />
                            Compare this ride
                          </label>
                        )}
                        <div className="card-bottom">
                          <div>
                            <strong>{money(car.pricePerDay)}</strong>
                            <span> / day</span>
                          </div>
                          {rented(car) ? (
                            tab === "manage" ? (
                              <button
                                className="book"
                                disabled={busy}
                                onClick={() => giveBack(car)}
                              >
                                Return car ↗
                              </button>
                            ) : (
                              <span className="rented-label">
                                Currently rented
                              </span>
                            )
                          ) : isOwner ? (
                            <span className="rented-label">Ready to rent</span>
                          ) : (
                            <button
                              className="book"
                              disabled={busy}
                              onClick={() => {
                                if (!user) {
                                  onSignIn();
                                  return;
                                }
                                setSelected(car);
                                setDays(3);
                                setQuote(null);
                                setError("");
                              }}
                            >
                              Book ride ↗
                            </button>
                          )}
                        </div>
                        {isOwner && (
                          <div className="owner-card-actions">
                            <button
                              className="delete-button"
                              disabled={busy || rented(car)}
                              title={
                                rented(car)
                                  ? "Return this car before deleting it."
                                  : "Delete this vehicle"
                              }
                              onClick={() => {
                                setDeleteTarget(car);
                                setError("");
                              }}
                            >
                              Delete ride
                            </button>
                            {rented(car) && (
                              <small>Return before deleting</small>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {visible.length > limit && !loading && !loadError && (
                <div className="load-more">
                  <button
                    className="button light"
                    onClick={() => setLimit((previous) => previous + 6)}
                  >
                    Show more rides ({visible.length - limit} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
        <section className="banner">
          <div>
            <p className="eyebrow">TAKE THE LONG WAY HOME.</p>
            <h2>
              Less planning.
              <br />
              More possibilities.
            </h2>
          </div>
          <div>
            <p>
              A weekend away, a daily commute, or somewhere entirely new. Start
              with the right ride.
            </p>
            <a className="button light" href="#fleet">
              Explore the fleet ↗
            </a>
          </div>
          <span className="banner-decoration" aria-hidden="true">
            ↗
          </span>
        </section>
      </main>
      <footer>
        <a className="brand" href="#home">
          roam®
        </a>
        <p>Every road has a story. Make it yours.</p>
        <span>© {new Date().getFullYear()} Roam</span>
      </footer>
      {comparisonCars.length > 0 && (
        <aside className="compare-tray" aria-label="Comparison shortlist">
          <div>
            <strong>{comparisonCars.length}/3 rides selected</strong>
            <span>{comparisonCars.map((car) => car.brand).join(" · ")}</span>
          </div>
          <button className="tray-clear" onClick={() => setCompared([])}>
            Clear
          </button>
          <button className="button dark" onClick={() => setCompareOpen(true)}>
            Compare rides ↗
          </button>
        </aside>
      )}
      {compareOpen && (
        <Modal title="Find your perfect fit." onClose={close} busy={busy}>
          <div className="comparison-scroll">
            <table className="comparison-table">
              <caption>Side-by-side vehicle comparison</caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {comparisonCars.map((car) => (
                    <th scope="col" key={car.id}>
                      {car.brand}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Vehicle type", (car) => car.vehicleType],
                  ["Fuel", (car) => car.fuelType],
                  ["Seats", (car) => car.capacity],
                  ["Daily rate", (car) => money(car.pricePerDay)],
                  ["3-day estimate", (car) => money(car.pricePerDay * 3)],
                  [
                    "Availability",
                    (car) => (rented(car) ? "Rented" : "Available"),
                  ],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {comparisonCars.map((car) => (
                      <td key={car.id}>{value(car)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Your ride</th>
                  {comparisonCars.map((car) => (
                    <td key={car.id}>
                      <button
                        className="book"
                        disabled={rented(car) || busy}
                        onClick={() => {
                          if (!user) {
                            onSignIn();
                            return;
                          }
                          setCompareOpen(false);
                          setSelected(car);
                          setDays(3);
                          setQuote(null);
                          setError("");
                        }}
                      >
                        Book ride ↗
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="comparison-note">
            Estimates use the current daily rate. Review the backend quote
            before confirming.
          </p>
        </Modal>
      )}
      {deleteTarget && (
        <Modal
          title={`Delete ${deleteTarget.brand}?`}
          onClose={close}
          busy={busy}
        >
          <p className="delete-explanation">
            This removes the vehicle from your fleet and the public catalog.
            This action cannot be undone.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="delete-dialog-actions">
            <button className="button light" disabled={busy} onClick={close}>
              Keep ride
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={removeRide}
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}
      {(selected || adding) && (
        <Modal
          title={
            adding
              ? "Make room for a new ride."
              : `Your ride: ${selected.brand}`
          }
          onClose={close}
          busy={busy}
        >
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {adding ? (
            <form onSubmit={save} className="dialog-form">
              <label>
                Brand / model
                <input
                  value={draft.brand}
                  maxLength="120"
                  required
                  pattern=".*\S.*"
                  onChange={(e) =>
                    setDraft({ ...draft, brand: e.target.value })
                  }
                  placeholder="e.g. Tata Nexon"
                />
              </label>
              <div className="form-row">
                <label>
                  Vehicle type
                  <select
                    value={draft.vehicleType}
                    onChange={(e) =>
                      setDraft({ ...draft, vehicleType: e.target.value })
                    }
                  >
                    {["SUV", "Sedan", "Hatchback", "MPV", "Van"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Fuel
                  <select
                    value={draft.fuelType}
                    onChange={(e) =>
                      setDraft({ ...draft, fuelType: e.target.value })
                    }
                  >
                    {["Petrol", "Diesel", "Electric", "Hybrid"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Seats
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    required
                    value={draft.capacity}
                    onChange={(e) =>
                      setDraft({ ...draft, capacity: e.target.value })
                    }
                  />
                </label>
                <label>
                  Daily rate (₹)
                  <input
                    type="number"
                    min="0.01"
                    max="1000000"
                    step="0.01"
                    required
                    value={draft.pricePerDay}
                    onChange={(e) =>
                      setDraft({ ...draft, pricePerDay: e.target.value })
                    }
                  />
                </label>
              </div>
              <button className="button dark" disabled={busy}>
                {busy ? "Saving…" : "Add to fleet ↗"}
              </button>
            </form>
          ) : (
            <>
              <div className="booking-car">
                <CarArt type={selected.vehicleType} />
                <p>
                  {selected.vehicleType} · {selected.fuelType} ·{" "}
                  {selected.capacity} seats
                </p>
              </div>
              <form onSubmit={calculate} className="dialog-form">
                <label>
                  Rental duration (days)
                  <input
                    type="number"
                    required
                    min="1"
                    max="365"
                    step="1"
                    value={days}
                    disabled={busy}
                    onChange={(e) => {
                      setDays(e.target.value);
                      setQuote(null);
                      setError("");
                    }}
                  />
                </label>
                <p>
                  {money(selected.pricePerDay)} per day. Rentals start when
                  confirmed.
                </p>
                {Number.isInteger(Number(days)) &&
                  Number(days) > 0 &&
                  Number(days) <= 365 && (
                    <div className="live-estimate">
                      <span>Estimated total</span>
                      <strong>
                        {money(selected.pricePerDay * Number(days))}
                      </strong>
                    </div>
                  )}
                <button className="button light" disabled={busy}>
                  {busy ? "Please wait…" : "Review price"}
                </button>
              </form>
              {quote && (
                <div className="quote">
                  <div>
                    <span>
                      {quote.days} days × {money(selected.pricePerDay)}
                    </span>
                    <strong>{money(quote.totalCost)}</strong>
                  </div>
                  <p>Confirming marks this car as rented.</p>
                  <button
                    className="button dark"
                    disabled={busy}
                    onClick={confirm}
                  >
                    {busy ? "Booking…" : "Confirm rental ↗"}
                  </button>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
