import { useState, useEffect } from "react";
import { H2HCard, H2HButton, H2HTag, H2HSkeleton } from "../ui";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Mock loading delay
    setTimeout(() => {
      setUser({
        name: "Admin User",
        email: "admin@example.com",
        role: "Admin",
        joined: "2024-12-15",
        avatar:
          "https://api.dicebear.com/7.x/avataaars/svg?seed=H2HThailand&backgroundColor=b6e3f4,c0aede,d1d4f9",
      });
      setLoading(false);
    }, 1200);
  }, []);

  return (
    <div className="section page-fade">
      {/* Header */}
      <div className="mb-6">
        <h1 className="title-glow mb-1">My Profile</h1>
        <p className="subtitle text-[var(--fg-muted)]">
          ข้อมูลส่วนตัวของคุณในระบบ H2H Thailand
        </p>
      </div>

      <H2HCard className="max-w-xl mx-auto text-center p-8 shadow-xl">
        {loading ? (
          <div className="grid gap-4">
            <div className="flex justify-center">
              <H2HSkeleton width="100px" height="100px" className="rounded-full" />
            </div>
            <H2HSkeleton width="60%" height="20px" className="mx-auto" />
            <H2HSkeleton width="50%" height="16px" className="mx-auto" />
          </div>
        ) : (
          <>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-28 h-28 mx-auto rounded-full border-2 border-[var(--accent)] shadow-[0_0_20px_rgba(242,193,78,0.25)]"
            />
            <h2 className="text-2xl mt-4 font-semibold">{user.name}</h2>
            <p className="text-[var(--fg-muted)]">{user.email}</p>
            <div className="mt-2">
              <H2HTag
                text={user.role}
                color={user.role === "Admin" ? "gold" : "blue"}
              />
            </div>

            <p className="caption mt-3">
              Joined since {new Date(user.joined).toLocaleDateString()}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <H2HButton variant="gold">
                <span className="material-icons-round text-base">edit</span>
                Edit Profile
              </H2HButton>
              <H2HButton variant="ghost">
                <span className="material-icons-round text-base">logout</span>
                Logout
              </H2HButton>
            </div>
          </>
        )}
      </H2HCard>
    </div>
  );
}
