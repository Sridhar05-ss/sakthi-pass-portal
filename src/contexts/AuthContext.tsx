import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchAllStudents, fetchAllHods, fetchAllWardens, cleanupOldPassRequests, deleteExpiredPassRequests } from "@/lib/utils";

export type UserRole = "student" | "warden" | "hod";

interface User {
  username: string;
  role: UserRole;
  first_name: string;
  department?: string;
  parentsMobileNumber?: string;
  block?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Restore user from localStorage on mount and cleanup old requests
  useEffect(() => {
    const storedUser = localStorage.getItem("ssec_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Immediate deletion of expired requests on app startup
    deleteExpiredPassRequests().catch(console.error);
    
    // Also run general cleanup
    cleanupOldPassRequests().catch(console.error);
    
    // Set up frequent cleanup every 2 minutes for immediate deletion
    const deleteInterval = setInterval(() => {
      deleteExpiredPassRequests().catch(console.error);
    }, 2 * 60 * 1000); // 2 minutes in milliseconds
    
    // Set up general cleanup every 10 minutes
    const cleanupInterval = setInterval(() => {
      cleanupOldPassRequests().catch(console.error);
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
    
    // Cleanup intervals on unmount
    return () => {
      clearInterval(deleteInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  // Updated login function to use Firebase Realtime Database
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("🔐 Login attempt for username:", username);
      
      // Check students in all departments - use emp_code as username and birthday as password
      // Only allow students with position "HOSTELLER"
      const students = await fetchAllStudents();
      console.log(`🔍 Login: Found ${students.length} total students in database`);
      
      // More flexible student matching
      let found = students.find((s) => {
        const empCodeMatch = s.emp_code === username;
        const birthdayMatch = s.birthday === password;
        const isHosteller = s.position === "HOSTELLER" || s.position === "hosteller" || !s.position;
        
        if (empCodeMatch) {
          console.log(`🔍 Login: Found student with matching emp_code: ${s.emp_code}, birthday match: ${birthdayMatch}, hosteller: ${isHosteller}`);
        }
        
        return empCodeMatch && birthdayMatch && isHosteller;
      });

      if (found) {
        console.log("✅ Student authentication successful for:", found.emp_code);
      } else {
        console.log("❌ Student authentication failed, checking HODs...");
        
        // If not found, check HODs in all departments - keep existing logic
        const hods = await fetchAllHods();
        console.log(`🔍 Login: Found ${hods.length} total HODs in database`);
        
        found = hods.find(
          (h) => h.username === username && h.password === password && h.role === "hod"
        );
        
        if (found) {
          console.log("✅ HOD authentication successful for:", found.username);
        } else {
          console.log("❌ HOD authentication failed, checking wardens...");
          
          // If not found, check wardens - keep existing logic
          const wardens = await fetchAllWardens();
          console.log(`🔍 Login: Found ${wardens.length} total wardens in database`);
          
          found = wardens.find(
            (w) => w.username === username && w.password === password && w.role === "warden"
          );
          
          if (found) {
            console.log("✅ Warden authentication successful for:", found.username);
          } else {
            console.log("❌ All authentication methods failed for username:", username);
          }
        }
      }

      if (found) {
        const allowedRoles = ["student", "warden", "hod"];
        // For students, default to "student" role since they don't have a role field
        // For HODs and wardens, use their existing role field
        let role: UserRole = "student";
        if (found.role) {
          role = ((found as { role?: UserRole }).role || "student").trim() as UserRole;
          if (!allowedRoles.includes(role)) {
            role = "student";
          }
        }
        const userObj = {
          username: found.emp_code || found.username, // Use emp_code for students, username for others
          role: role as UserRole,
          first_name: found.first_name || found.Name || found.name || found.username || "",
          department: found.department || "",
          parentsMobileNumber: String(found.contact_no || ""),
          block: found.block || "",
        };
        
        console.log("✅ Login successful, user object created:", {
          username: userObj.username,
          role: userObj.role,
          first_name: userObj.first_name,
          department: userObj.department
        });
        
        setUser(userObj);
        localStorage.setItem("ssec_user", JSON.stringify(userObj));
        return true;
      }
      
      console.log("❌ Login failed: No matching user found");
      return false;
    } catch (error) {
      console.error("❌ Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ssec_user");
    // Redirect to login page after logout
    window.location.href = "/";
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};