import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
