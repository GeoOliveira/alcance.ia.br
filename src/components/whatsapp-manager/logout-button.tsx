"use client";
export function LogoutButton(){return <button type="submit" onClick={()=>{try{window.google?.accounts.id.disableAutoSelect();localStorage.setItem("alcance_google_one_tap_dismissed_at",String(Date.now()))}catch{}}}>Sair</button>}
