import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import SessionApp from "./SessionApp";
import { getSession, login, logout, register } from "./api";

jest.mock("./App", () => (props) => (
  <div>
    <span>
      {props.user ? `${props.user.name} ${props.user.role}` : "Guest fleet"}
    </span>
    <button onClick={props.onSignIn}>Open sign in</button>
    <button onClick={props.onLogout}>Log out</button>
  </div>
));
jest.mock("./api", () => ({
  getSession: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  errorMessage: (e) => e.message,
}));
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
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  getSession.mockRejectedValue({ response: { status: 401 } });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<SessionApp />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
test("customer and renter login send the selected portal and logout clears user", async () => {
  await click("Open sign in");
  await click("Renter login");
  const inputs = host.querySelectorAll("form input");
  await change(inputs[0], "owner@example.test");
  await change(inputs[1], "Password123");
  login.mockResolvedValue({ data: { id: 1, name: "Owner", role: "RENTER" } });
  await act(async () => Simulate.submit(host.querySelector("form")));
  expect(login).toHaveBeenCalledWith({
    email: "owner@example.test",
    password: "Password123",
    role: "RENTER",
  });
  expect(host.textContent).toContain("Owner RENTER");
  logout.mockResolvedValue({});
  await click("Log out");
  expect(host.textContent).toContain("Guest fleet");
});
test("registration creates selected role, then requires a login", async () => {
  await click("Open sign in");
  await click("Create an account");
  const inputs = host.querySelectorAll("form input");
  await change(inputs[0], "New User");
  await change(inputs[1], "new@example.test");
  await change(inputs[2], "Password123");
  register.mockResolvedValue({});
  await act(async () => Simulate.submit(host.querySelector("form")));
  expect(register).toHaveBeenCalledWith({
    name: "New User",
    email: "new@example.test",
    password: "Password123",
    role: "CUSTOMER",
  });
  expect(login).not.toHaveBeenCalled();
  expect(host.textContent).toContain("Account created");
  expect(host.querySelector('input[type="password"]').value).toBe("");
});
test("invalid login shows inline error and session expiry clears authenticated user", async () => {
  await click("Open sign in");
  login.mockRejectedValue(new Error("Invalid credentials"));
  await act(async () => Simulate.submit(host.querySelector("form")));
  expect(host.querySelector('[role="alert"]').textContent).toContain(
    "Invalid credentials",
  );
  login.mockResolvedValue({
    data: { id: 2, name: "Customer", role: "CUSTOMER" },
  });
  await act(async () => Simulate.submit(host.querySelector("form")));
  await act(async () =>
    window.dispatchEvent(new Event("roam:session-expired")),
  );
  expect(host.textContent).toContain("Guest fleet");
  expect(host.textContent).toContain("session expired");
});
