import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Profile({ me, toast }) {
  const [p, setP] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try { const res = await api("/api/profiles/me", { auth: true }); setP(res.profile); }
    catch (e) { setMsg(e.message); }
  }
  useEffect(() => { if (me) load(); }, [me]);

  async function save(e) {
    e.preventDefault();
    try {
      const payload = { displayName: p.displayName||"", bio: p.bio||"", avatarUrl: p.avatarUrl||"", phone: p.phone||"", address: p.address||{}, socials: p.socials||{} };
      const res = await api("/api/profiles/me", { method:"PUT", body: payload, auth: true });
      setP(res.profile); toast.success("Saved!");
    } catch (e) { toast.error(e.message); }
  }

  if (!me) return <div>Please login</div>;
  if (!p) return <div className="text-white/70">Loading profile...</div>;

  return (
    <div className="grid gap-4 max-w-3xl">
      <div className="card">
        <h4 className="text-bro-gold mb-2">Auth (read-only)</h4>
        <pre className="text-sm overflow-auto">{JSON.stringify(me, null, 2)}</pre>
      </div>

      <form onSubmit={save} className="card grid gap-3">
        <h4 className="text-bro-gold">Profile (profile_db)</h4>
        <input className="input" value={p.displayName||""} onChange={e=>setP({...p,displayName:e.target.value})} placeholder="displayName" />
        <input className="input" value={p.avatarUrl||""} onChange={e=>setP({...p,avatarUrl:e.target.value})} placeholder="avatarUrl" />
        <input className="input" value={p.phone||""} onChange={e=>setP({...p,phone:e.target.value})} placeholder="phone" />
        <textarea className="textarea" value={p.bio||""} onChange={e=>setP({...p,bio:e.target.value})} placeholder="bio" rows={4} />

        <fieldset className="border border-white/10 rounded-xl p-3">
          <legend className="px-2 text-white/70">Address</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" value={p.address?.line1||""} onChange={e=>setP({...p,address:{...p.address,line1:e.target.value}})} placeholder="line1" />
            <input className="input" value={p.address?.line2||""} onChange={e=>setP({...p,address:{...p.address,line2:e.target.value}})} placeholder="line2" />
            <input className="input" value={p.address?.city||""} onChange={e=>setP({...p,address:{...p.address,city:e.target.value}})} placeholder="city" />
            <input className="input" value={p.address?.state||""} onChange={e=>setP({...p,address:{...p.address,state:e.target.value}})} placeholder="state" />
            <input className="input" value={p.address?.postalCode||""} onChange={e=>setP({...p,address:{...p.address,postalCode:e.target.value}})} placeholder="postalCode" />
            <input className="input" value={p.address?.country||""} onChange={e=>setP({...p,address:{...p.address,country:e.target.value}})} placeholder="country" />
          </div>
        </fieldset>

        <fieldset className="border border-white/10 rounded-xl p-3">
          <legend className="px-2 text-white/70">Socials</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" value={p.socials?.github||""} onChange={e=>setP({...p,socials:{...p.socials,github:e.target.value}})} placeholder="github" />
            <input className="input" value={p.socials?.facebook||""} onChange={e=>setP({...p,socials:{...p.socials,facebook:e.target.value}})} placeholder="facebook" />
            <input className="input" value={p.socials?.twitter||""} onChange={e=>setP({...p,socials:{...p.socials,twitter:e.target.value}})} placeholder="twitter" />
            <input className="input" value={p.socials?.instagram||""} onChange={e=>setP({...p,socials:{...p.socials,instagram:e.target.value}})} placeholder="instagram" />
            <input className="input" value={p.socials?.website||""} onChange={e=>setP({...p,socials:{...p.socials,website:e.target.value}})} placeholder="website" />
          </div>
        </fieldset>

        <div className="flex gap-2 justify-end">
          <button type="submit" className="btn btn-gold">Save</button>
        </div>
        {msg && <div className="text-red-400">{msg}</div>}
      </form>
    </div>
  );
}
