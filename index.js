import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
      <div style={{background:'#1c2230',padding:'40px',borderRadius:'20px',textAlign:'center'}}>
        <h1>🚀 Discord SaaS</h1>
        <button onClick={() => signIn("discord")}>
          Login with Discord
        </button>
      </div>
    </div>
  );
}