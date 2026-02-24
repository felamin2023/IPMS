import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <h1>Home</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
