"use client";

export default function Dashboard() {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  return (
    <div className="p-6">
      <h1 className="text-2xl">Dashboard</h1>

      <p className="mt-4">Token:</p>
      <pre className="bg-gray-200 p-2 mt-2">{token}</pre>
    </div>
  );
}