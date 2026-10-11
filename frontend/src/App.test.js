import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import App from "./App";
import {
  getCars,
  getOwnerCars,
  getRentals,
  getRentInfo,
  rentCar,
  addCar,
  returnCar,
  deleteCar,
  suggestCars,
} from "./api";
jest.mock("./api", () => ({
  getCars: jest.fn(),
  getOwnerCars: jest.fn(),
  getRentals: jest.fn(),
  getRentInfo: jest.fn(),
  rentCar: jest.fn(),
  addCar: jest.fn(),
  returnCar: jest.fn(),
  deleteCar: jest.fn(),
  suggestCars: jest.fn(),
  errorMessage: (e) => e.message,
}));
const customer = { id: 2, name: "Customer", role: "CUSTOMER" },
  owner = { id: 1, name: "Owner", role: "RENTER" };
const available = {
  id: 1,
  brand: "Tata Nexon",
  vehicleType: "SUV",
  fuelType: "Petrol",
  capacity: 5,
  pricePerDay: 1800,
  status: "Free",
};
const rented = {
  id: 2,
  brand: "Honda City",
  vehicleType: "Sedan",
  fuelType: "Petrol",
  capacity: 5,
  pricePerDay: 2200,
  status: "Rented",
  rentalDays: 3,
  rentedAt: "2026-10-11T00:00:00Z",
  rentalTotal: 6600,
};
const rental = {
  car: rented,
  customerName: "Nikhil",
  customerEmail: "nikhil@example.test",
};
let host, root;
const button = (text) =>
  Array.from(host.querySelectorAll("button")).find((b) =>
    b.textContent.includes(text),
  );
const click = async (text) => {
  await act(async () => Simulate.click(button(text)));
};
const change = async (input, value) => {
  await act(async () => Simulate.change(input, { target: { value } }));
};
const render = async (user = customer, props = {}) => {
  await act(async () =>
    root.render(<App key={user?.role || "guest"} user={user} {...props} />),
  );
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  localStorage.clear();
  getCars.mockResolvedValue({ data: [available] });
  getOwnerCars.mockResolvedValue({ data: [available, rented] });
  getRentals.mockResolvedValue({ data: [rental] });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
test("customers see customer navigation and cannot manage vehicles", async () => {
  await render();
  expect(button("Fleet management")).toBeUndefined();
  expect(button("Delete ride")).toBeUndefined();
  expect(button("My rentals")).toBeTruthy();
  expect(getOwnerCars).not.toHaveBeenCalled();
});
test("guest can browse but booking opens sign-in", async () => {
  const onSignIn = jest.fn();
  await render(null, { onSignIn });
  await click("Book ride");
  expect(onSignIn).toHaveBeenCalled();
  expect(getRentInfo).not.toHaveBeenCalled();
  expect(button("My rentals")).toBeUndefined();
});
test("renter only loads own fleet and gets a dedicated rented list", async () => {
  await render(owner);
  expect(getOwnerCars).toHaveBeenCalled();
  expect(getCars).not.toHaveBeenCalled();
  expect(button("Book ride")).toBeUndefined();
  expect(host.querySelectorAll(".metric")).toHaveLength(4);
  await click("Rented cars");
  expect(host.querySelector(".rental-table").textContent).toContain("Nikhil");
  expect(host.querySelector(".rental-table").textContent).toContain(
    "Honda City",
  );
  expect(button("Return car")).toBeTruthy();
});
test("customer rental list has no return or delete controls", async () => {
  await render();
  await click("My rentals");
  expect(host.querySelector(".rental-table").textContent).toContain(
    "Honda City",
  );
  expect(host.querySelector(".rental-table").textContent).toContain("6,600");
  expect(host.querySelector(".rental-table").textContent).not.toContain(
    "nikhil@example.test",
  );
  expect(button("Return car")).toBeUndefined();
});
test("delete requires confirmation and refreshes owner fleet", async () => {
  await render(owner);
  deleteCar.mockResolvedValue({});
  await click("Delete ride");
  expect(host.querySelector("#dialog-title").textContent).toContain(
    "Tata Nexon",
  );
  expect(deleteCar).not.toHaveBeenCalled();
  await click("Keep ride");
  expect(deleteCar).not.toHaveBeenCalled();
  await click("Delete ride");
  await click("Delete permanently");
  expect(deleteCar).toHaveBeenCalledWith(1);
  expect(getOwnerCars).toHaveBeenCalledTimes(2);
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});
test("rented ride cannot be deleted and delete failures remain reviewable", async () => {
  await render(owner);
  expect(host.querySelectorAll(".delete-button")[1].disabled).toBe(true);
  deleteCar.mockRejectedValue(new Error("Return this vehicle first"));
  await click("Delete ride");
  await click("Delete permanently");
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Return this vehicle first",
  );
  expect(host.querySelector('[role="dialog"]')).toBeTruthy();
});
test("owner returns a rental and refreshes the lists", async () => {
  await render(owner);
  returnCar.mockResolvedValue({});
  await click("Rented cars");
  await click("Return car");
  expect(returnCar).toHaveBeenCalledWith(2);
  expect(getRentals).toHaveBeenCalledTimes(2);
});
test("quote changes invalidate old totals and booking uses reviewed duration", async () => {
  await render();
  getRentInfo
    .mockResolvedValueOnce({ data: { days: 3, totalCost: 5400 } })
    .mockResolvedValueOnce({ data: { days: 5, totalCost: 9000 } });
  rentCar.mockResolvedValue({ data: "Success" });
  await click("Book ride");
  await act(async () => Simulate.submit(host.querySelector(".dialog-form")));
  expect(button("Confirm rental")).toBeTruthy();
  await change(host.querySelector(".dialog-form input"), "5");
  expect(button("Confirm rental")).toBeUndefined();
  await act(async () => Simulate.submit(host.querySelector(".dialog-form")));
  await click("Confirm rental");
  expect(rentCar).toHaveBeenCalledWith(1, 5);
  expect(host.querySelector(".notice").textContent).toContain("5 days");
});
test("owner adds a numeric vehicle payload", async () => {
  await render(owner);
  addCar.mockResolvedValue({});
  await click("Add vehicle");
  const inputs = host.querySelectorAll(".dialog-form input");
  await change(inputs[0], " Maruti Swift ");
  await change(inputs[2], "1300");
  await act(async () => Simulate.submit(host.querySelector(".dialog-form")));
  expect(addCar).toHaveBeenCalledWith(
    expect.objectContaining({
      brand: "Maruti Swift",
      capacity: 5,
      pricePerDay: 1300,
    }),
  );
});
test("favorites are scoped to account, search, budget and list view work", async () => {
  await render();
  await act(async () =>
    Simulate.click(host.querySelector('[aria-label="Save Tata Nexon"]')),
  );
  expect(JSON.parse(localStorage.getItem("roam:favorites:2"))).toEqual([1]);
  await click("Saved rides");
  expect(host.querySelectorAll(".car-card")).toHaveLength(1);
  await change(host.querySelector('[aria-label="Maximum daily rate"]'), "1000");
  expect(host.querySelectorAll(".car-card")).toHaveLength(0);
  await click("Clear all filters");
  await click("List");
  expect(host.querySelector(".list-view")).toBeTruthy();
});
test("comparison caps at three and hands off to customer booking", async () => {
  getCars.mockResolvedValue({
    data: Array.from({ length: 8 }, (_, i) => ({
      ...available,
      id: i + 1,
      brand: `Car ${i + 1}`,
    })),
  });
  await render();
  expect(host.querySelectorAll(".car-card")).toHaveLength(6);
  const checks = host.querySelectorAll(".compare-checkbox input");
  await act(async () => {
    Simulate.change(checks[0]);
    Simulate.change(checks[1]);
    Simulate.change(checks[2]);
  });
  expect(
    host.querySelectorAll(".compare-checkbox input:disabled"),
  ).toHaveLength(3);
  await click("Compare rides");
  expect(host.querySelectorAll(".comparison-table thead th")).toHaveLength(4);
  await act(async () =>
    Simulate.click(host.querySelector(".comparison-table button")),
  );
  expect(host.querySelector("#dialog-title").textContent).toContain("Car 1");
  await act(async () =>
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
  );
  await click("Show more rides");
  expect(host.querySelectorAll(".car-card")).toHaveLength(8);
});
test("suggestions and backend failure/retry are handled", async () => {
  await render();
  await change(host.querySelector(".search-panel select"), "Petrol");
  suggestCars.mockResolvedValue({ data: [available] });
  await act(async () =>
    Simulate.submit(host.querySelector(".search-panel form")),
  );
  expect(suggestCars).toHaveBeenCalledWith("Petrol", 1);
  getCars.mockRejectedValueOnce(new Error("Offline"));
  await click("Refresh fleet");
  expect(host.querySelector('[role="alert"]').textContent).toContain("Offline");
  await click("Try again");
  expect(host.querySelectorAll(".car-card")).toHaveLength(1);
});
