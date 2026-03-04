import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Register from "./Register";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login response status:", res.status);
    console.log("Login response data:", data);

    if (res.ok) {
      // IMPORTANT: Pass token along with user to setUser
      console.log("Setting user and token in context/localStorage");
      setUser(data.user, data.token);

      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } else {
      setError(data.error || "Login failed");
    }
  } catch (error) {
    console.error("Login request error:", error);
    setError("Server error");
  }
};


  if (showRegister) {
    return (
      <div>
        <Register />
        <p className="text-center mt-4 text-white">
          Already have an account?{" "}
          <button
            className="underline text-indigo-400"
            onClick={() => setShowRegister(false)}
          >
            Login here
          </button>
        </p>
      </div>
    );
  }



  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-gray-800 text-white rounded">
      <h2 className="text-2xl mb-6">Login</h2>
      {error && <p className="mb-4 text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700"
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 py-2 rounded hover:bg-indigo-700"
        >
          Login
        </button>
      </form>

      <p className="text-center mt-4">
        Don't have an account?{" "}
        <button
          className="underline text-indigo-400"
          onClick={() => setShowRegister(true)}
        >
          Register here
        </button>
      </p>
    </div>
  );
}
