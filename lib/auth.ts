import {SignJWT,jwtVerify} from "jose";import {cookies} from "next/headers";
const key=()=>new TextEncoder().encode(process.env.SESSION_SECRET||"development-only-change-me");
export async function session(){try{const token=(await cookies()).get("strike_session")?.value;if(!token)return null;return (await jwtVerify(token,key())).payload as {playerId:number;role:string}}catch{return null}}
export async function setSession(playerId:number,role:string){const token=await new SignJWT({playerId,role}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(key());(await cookies()).set("strike_session",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:2592000,path:"/"})}
export async function clearSession(){(await cookies()).delete("strike_session")}
