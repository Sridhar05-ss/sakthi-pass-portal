import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { ref, get, child, push, set, remove, getDatabase } from "firebase/database";
import { db } from './firebase';

interface DatabaseOperationError extends Error {
  code?: string;
  details?: unknown;
}

interface WardenData {
  id: string;
  username: string;
  password: string;
  role: string;
  name: string;
  block: string;
  department: string;
  parentsMobileNumber: string;
}

interface HodData {
  id: string;
  username: string;
  password: string;
  role: string;
  name: string;
  department: string;
  parentsMobileNumber: string;
  block: string;
}

interface StudentData {
  id: string;
  name: string;
  password: string;
  role: string;
  department: string;
  parentsMobileNumber: string;
  year: number;
}

// Error handling utility
const handleDatabaseError = (error: unknown, operation: string): never => {
  let dbError: DatabaseOperationError;
  if (error instanceof Error) {
    const errorWithCode = error as unknown as { code?: string; details?: unknown };
    const code = typeof errorWithCode.code === 'string' ? errorWithCode.code : undefined;
    const details = errorWithCode.details;
    dbError = Object.assign(error, { code, details });
  } else {
    dbError = new Error('Unknown database error');
  }
  console.error(`Error during ${operation}:`, dbError);
  throw dbError;
};

// Data validation utility
const validateData = <T>(data: T | null | undefined, errorMessage: string): T => {
  if (data === null || data === undefined) {
    throw new Error(errorMessage);
  }
  return data;
};

// Cache implementation
class Cache<T> {
  private data: T | null = null;
  private lastFetch: number = 0;
  private readonly expiryMs: number = 5 * 60 * 1000; // 5 minutes

  isExpired(): boolean {
    return Date.now() - this.lastFetch > this.expiryMs;
  }

  set(data: T): void {
    this.data = data;
    this.lastFetch = Date.now();
  }

  get(): T | null {
    return this.isExpired() ? null : this.data;
  }

  clear(): void {
    this.data = null;
    this.lastFetch = 0;
  }
}

// Initialize caches with proper types
const wardenCache = new Cache<Record<string, WardenData>>();
const hodCache = new Cache<Record<string, HodData>>();
const studentCache = new Cache<Record<string, StudentData>>();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to fetch student data with improved error handling and caching
export async function fetchStudentData() {
  try {
    const cachedData = studentCache.get();
    if (cachedData) return cachedData;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `students`));
    const data = validateData(snapshot.val(), 'No student data found');

    const students = Object.keys(data).map((key) => {
      const student = validateData(data[key], `Invalid student data for key: ${key}`);
      return {
        name: student.name,
        username: student.username,
        password: student.password,
        role: student.role,
        department: student.department,
        parentsMobileNumber: student.contact_no,
      };
    });

    // Convert array to record for cache
    // Map students to StudentData and include only known properties
    const studentsRecord: Record<string, StudentData> = {};
    Object.keys(data).forEach((key) => {
      const student = data[key];
      studentsRecord[key] = {
        id: key,
        name: student.name,
        password: student.password,
        role: student.role,
        department: student.department,
        parentsMobileNumber: student.contact_no,
        year: student.year
      };  
    });
    studentCache.set(studentsRecord);
    return Object.values(studentsRecord);
  } catch (error) {
    handleDatabaseError(error, 'fetchStudentData');
    return [];
  }
}

// Function to fetch warden data with improved error handling and caching
export async function fetchWardenData() {
  try {
    const cachedData = wardenCache.get();
    if (cachedData) return cachedData;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `warden`));
    const data = validateData(snapshot.val(), 'No warden data found');

    const wardens = Object.keys(data).map((key) => {
      const warden = validateData(data[key], `Invalid warden data for key: ${key}`);
      return {
        username: warden.username,
        password: warden.password,
        role: warden.role,
        block: warden.block,
        name: warden.name || warden.username || "",
        department: "",
        parentsMobileNumber: "",
      };
    });

    // Convert array to record for cache
    const wardensRecord: Record<string, WardenData> = {};
    wardens.forEach((warden, index) => {
      wardensRecord[index.toString()] = warden as WardenData;
    });
    wardenCache.set(wardensRecord);
    return wardens;
  } catch (error) {
    handleDatabaseError(error, 'fetchWardenData');
    return [];
  }
}

// Function to fetch HOD data with improved error handling and caching
export async function fetchHodData() {
  try {
    const cachedData = hodCache.get();
    if (cachedData) return cachedData;

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `hod`));
    const data = validateData(snapshot.val(), 'No HOD data found');

    const hods = Object.keys(data).map((key) => {
      const hod = validateData(data[key], `Invalid HOD data for key: ${key}`);
      return {
        username: hod.username,
        password: hod.password,
        role: hod.role,
        name: hod.name || hod.username || "",
        department: hod.department || "",
        parentsMobileNumber: "",
        block: "",
      };
    });

    // Convert array to record for cache
    const hodsRecord: Record<string, HodData> = {};
    hods.forEach((hod, index) => {
      hodsRecord[index.toString()] = hod as HodData;
    });
    hodCache.set(hodsRecord);
    return hods;
  } catch (error) {
    handleDatabaseError(error, 'fetchHodData');
    return [];
  }
}

export async function fetchAllStudents() {
  try {
    console.log("🔍 fetchAllStudents: Starting to fetch all students...");
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "students"));
    const students = [];
    
    if (snapshot.exists()) {
      const departments = snapshot.val();
      console.log("🔍 fetchAllStudents: Found departments:", Object.keys(departments));
      
      for (const dept in departments) {
        const deptStudents = departments[dept];
        console.log(`🔍 fetchAllStudents: Processing department ${dept} with ${Object.keys(deptStudents).length} students`);
        
        for (const studentId in deptStudents) {
          const student = deptStudents[studentId];
          console.log(`🔍 fetchAllStudents: Processing student ${studentId}:`, student);
          
          // More flexible field mapping to handle different database structures
          const studentData = {
            ...student,
            department: dept,
            // Try multiple field variations for emp_code
            emp_code: student.emp_code || student.username || student.roll_no || student.register_no || studentId,
            // Try multiple field variations for password/birthday
            birthday: student.birthday || student.password || student.dob || student.birth_date,
            // Try multiple field variations for name
            first_name: student.first_name || student.Name || student.name || student.full_name || "",
            // Try multiple field variations for contact
            contact_no: student.contact_no || student.parentsMobileNumber || student.mobile || student.phone || "",
            // Handle position field
            position: student.position || student.hostel_status || "HOSTELLER",
            // Additional fields that might be needed
            block: student.block || student.hostel_block || "",
            room_no: student.room_no || student.room_number || "",
          };
          
          console.log(`✅ fetchAllStudents: Mapped student data:`, {
            emp_code: studentData.emp_code,
            birthday: studentData.birthday ? "***" : "MISSING",
            first_name: studentData.first_name,
            position: studentData.position,
            department: studentData.department
          });
          
          students.push(studentData);
        }
      }
    } else {
      console.log("🔍 fetchAllStudents: No students data found in database");
    }
    
    console.log(`🔍 fetchAllStudents: Total students fetched: ${students.length}`);
    console.log(`🔍 fetchAllStudents: Students with valid emp_code: ${students.filter(s => s.emp_code).length}`);
    console.log(`🔍 fetchAllStudents: Students with valid birthday: ${students.filter(s => s.birthday).length}`);
    return students;
  } catch (error) {
    console.error("❌ Error fetching all students:", error);
    return [];
  }
}

export async function fetchAllHods() {
  const db = getDatabase();
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "hod"));
  const hods = [];
  if (snapshot.exists()) {
    const hodDepartments = snapshot.val();
    for (const hodId in hodDepartments) {
      hods.push({
        ...hodDepartments[hodId],
        department: hodId,
      });
    }
  }
  return hods;
}

export async function fetchAllWardens() {
  const db = getDatabase();
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "warden"));
  const wardens = [];
  if (snapshot.exists()) {
    const wardenNodes = snapshot.val();
    for (const wardenId in wardenNodes) {
      wardens.push({
        ...wardenNodes[wardenId],
        wardenId,
      });
    }
  }
  return wardens;
}

export async function getAssignedWardenByBlock(block: string) {
  try {
    console.log("🔍 Looking for warden assigned to block:", block);
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "warden"));
    
    if (snapshot.exists()) {
      const wardens = snapshot.val();
      console.log("📋 All wardens in database:", wardens);
      // Find warden assigned to this block
      for (const wardenId in wardens) {
        const warden = wardens[wardenId];
        console.log(`🔍 Checking warden ${wardenId}:`, warden);
        if (warden.block === block) {
          console.log(`✅ Found warden for block ${block}:`, warden);
          return {
            username: warden.username,
            name: warden.name || warden.username,
            block: warden.block
          };
        }
      }
      console.log(`❌ No warden found for block ${block}`);
    } else {
      console.log("❌ No wardens found in database");
    }
    return null;
  } catch (error) {
    console.error("Error getting assigned warden:", error);
    return null;
  }
}

export async function getAssignedHodByDepartment(department: string) {
  try {
    console.log("🔍 Looking for HOD assigned to department:", department);

    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "hod"));
    
    if (snapshot.exists()) {
      const hods = snapshot.val();
      console.log("📋 All HODs in database:", hods);
      
      // Department to HOD mapping
      const departmentToHodMapping: { [key: string]: string } = {
        "AIDS": "HOD006",
        "AIML": "HOD006", 
        "CYBER SECURITY": "HOD006",
        "CSE": "HOD006",
        "IT": "HOD006",
        "ECE": "HOD001",
        "CIVIL": "HOD003",
        "EEE": "HOD002",
        "MECH": "HOD004"
      };
      
      const assignedHodId = departmentToHodMapping[department.toUpperCase()];
      console.log(`🎯 Department ${department} maps to HOD ID: ${assignedHodId}`);
      
      if (assignedHodId && hods[assignedHodId]) {
        const hod = hods[assignedHodId];
        console.log(`✅ Found HOD for department ${department}:`, hod);
        return {
          username: hod.username,
          name: hod.name || hod.username,
          department: hod.department || department
        };
      } else {
        console.log(`❌ No HOD found for department ${department} (HOD ID: ${assignedHodId})`);
      }
    } else {
      console.log("❌ No HODs found in database");
    }
    return null;
  } catch (error) {
    console.error("Error getting assigned HOD:", error);
    return null;
  }
}

interface PassRequestData {
  emp_code: string;
  type: "outing" | "home_visit";
  first_name: string;
  department: string;
  year: string;
  date: string;
  reason: string;
  block?: string;
  roomNumber?: string;
  mobileNumber?: string;
  numberOfDaysLeave?: string;
  noOfWorkingDays?: string;
  arrivalTime?: string;
  status?: "pending" | "hod_approved" | "warden_approved" | "declined";
  registerNumber?: string;
}

// Track recent submissions to prevent duplicates
const recentSubmissions = new Map<string, number>();
const DUPLICATE_PREVENTION_WINDOW = 5000; // 5 seconds

export async function savePassRequest(requestData: PassRequestData) {
  try {
    console.log("🔍 savePassRequest: Saving request data:", requestData);

    
    // Check if emp_code exists in the request data
    if (!requestData.emp_code) {
      throw new Error("Employee code is required to save pass request");
    }
    
    // Sanitize emp_code to match the format used in the dashboard
    const sanitizedEmpCode = requestData.emp_code.replace(/[.#$[\]]/g, '_');
    
    // Create a unique signature for this request to prevent duplicates
    const requestSignature = `${sanitizedEmpCode}-${requestData.type}-${requestData.date}-${requestData.reason.substring(0, 50)}`;
    const now = Date.now();
    
    // Check if a similar request was submitted recently
    if (recentSubmissions.has(requestSignature)) {
      const lastSubmission = recentSubmissions.get(requestSignature)!;
      if (now - lastSubmission < DUPLICATE_PREVENTION_WINDOW) {
        console.log('⚠️ Duplicate request detected, blocking submission');
        throw new Error('Please wait 5 seconds before submitting another similar request');
      }
    }
    
    // Record this submission
    recentSubmissions.set(requestSignature, now);
    
    // Clean up old entries periodically
    for (const [key, timestamp] of recentSubmissions.entries()) {
      if (now - timestamp > DUPLICATE_PREVENTION_WINDOW) {
        recentSubmissions.delete(key);
      }
    }
    
    // Use the new format - save under passRequests/{sanitizedEmpCode}
    const requestsRef = ref(db, `passRequests/${sanitizedEmpCode}`);
    const newRequestRef = push(requestsRef);
    
    console.log("🔍 savePassRequest: Firebase path:", `passRequests/${requestData.emp_code}`);
    console.log("🔍 savePassRequest: Generated ID:", newRequestRef.key);
    
    // Get assigned warden based on block (for outing requests)
    let assignedWarden = null;
    if (requestData.block) {
      assignedWarden = await getAssignedWardenByBlock(requestData.block);
      console.log("🔍 savePassRequest: Assigned warden for block", requestData.block, ":", assignedWarden);
    }
    
    // Get assigned HOD based on department (for home visit requests)
    let assignedHod = null;
    if (requestData.type === "home_visit" && requestData.department) {
      assignedHod = await getAssignedHodByDepartment(requestData.department);
      console.log("🔍 savePassRequest: Assigned HOD for department", requestData.department, ":", assignedHod);
    }
    
    const requestWithId = {
      ...requestData,
      id: newRequestRef.key,
      createdAt: new Date().toISOString(),
      status: "pending",
      assignedWarden: assignedWarden,
      assignedHod: assignedHod
    };
    
    console.log("🔍 savePassRequest: Final request with ID:", requestWithId);
    await set(newRequestRef, requestWithId);
    console.log("🔍 savePassRequest: Request saved successfully with ID:", newRequestRef.key);
    return newRequestRef.key;
  } catch (error) {
    console.error("🔍 savePassRequest: Error saving pass request:", error);
    throw error;
  }
}

export async function fetchUserPassRequests(emp_code: string) {
  try {
    console.log("Fetching requests for emp_code:", emp_code);
    // First try to fetch from the new format - under passRequests/{emp_code}
    const newFormatRef = ref(db, `passRequests/${emp_code}`);
    const newFormatSnapshot = await get(newFormatRef);
    
    if (newFormatSnapshot.exists()) {
      const requests = newFormatSnapshot.val();
      console.log("User requests from new format:", requests);
      // Convert object of objects to array
      const userRequests = Object.values(requests);
      console.log("User requests array:", userRequests);
      // Filter out expired requests
      const validRequests = filterOutExpiredRequests(userRequests as { createdAt: string }[]);
      console.log("Valid (non-expired) user requests:", validRequests);
      return validRequests;
    }
    
    // Fallback to old format for backward compatibility
    const oldFormatRef = ref(db, `passRequests`);
    const oldFormatSnapshot = await get(oldFormatRef);
    
    if (oldFormatSnapshot.exists()) {
      const requests = oldFormatSnapshot.val();
      console.log("All requests from old format:", requests);
      // Filter requests by emp_code
      const userRequests = Object.values(requests).filter((request: unknown) => 
        request && typeof request === 'object' && 'emp_code' in request && request.emp_code === emp_code
      );
      console.log("User requests from old format:", userRequests);
      // Filter out expired requests
      const validRequests = filterOutExpiredRequests(userRequests as { createdAt: string }[]);
      console.log("Valid (non-expired) user requests from old format:", validRequests);
      return validRequests;
    }
    
    console.log("No requests found for user:", emp_code);
    return [];
  } catch (error) {
    console.error("Error fetching user pass requests:", error);
    return [];
  }
}

export async function fetchAllPassRequests() {
  try {
    const allRequests: unknown[] = [];
    
    // First check the old format - all requests directly under passRequests
    const oldFormatRef = ref(db, "passRequests");
    const oldFormatSnapshot = await get(oldFormatRef);
    
    if (oldFormatSnapshot.exists()) {
      const oldFormatData = oldFormatSnapshot.val();
      
      // Check if the data is in the old format (direct key-value pairs)
      // or if it's already in the new format (username-based organization)
      const firstValue = Object.values(oldFormatData)[0];
      
      if (firstValue && typeof firstValue === 'object' && !('username' in firstValue)) {
        // This is the new format where data is organized by username
        console.log("🔍 fetchAllPassRequests: Found data in new format");
        
        // Iterate through each username
        for (const username in oldFormatData) {
          const userRequests = oldFormatData[username];
          // Add all requests for this user
          const userRequestValues = Object.values(userRequests);
          console.log(`🔍 fetchAllPassRequests: Found ${userRequestValues.length} requests for user ${username}`);
          allRequests.push(...userRequestValues);
        }
      } else {
        // This is the old format with direct key-value pairs
        console.log("🔍 fetchAllPassRequests: Found data in old format");
        const requestValues = Object.values(oldFormatData);
        console.log(`🔍 fetchAllPassRequests: Total requests found in old format:`, requestValues.length);
        allRequests.push(...requestValues);
      }
    }
    
    console.log("🔍 fetchAllPassRequests: Total requests found:", allRequests.length);
    // Filter out expired requests before returning
    const validRequests = filterOutExpiredRequests(allRequests as { createdAt: string }[]);
    console.log("🔍 fetchAllPassRequests: Valid (non-expired) requests:", validRequests.length);
    return validRequests;
  } catch (error) {
    console.error("Error fetching all pass requests:", error);
    return [];
  }
}

export async function deletePassRequest(id: string, emp_code?: string) {
  try {

    
    // If emp_code is provided, try to delete from the new format first
    if (emp_code) {
      console.log(`🔍 deletePassRequest: Trying to delete request ${id} for user ${emp_code}`);
      
      // Sanitize emp_code to match the format used in the dashboard
      const sanitizedEmpCode = emp_code.replace(/[.#$[\]]/g, '_');
      
      // First check if the request exists under the emp_code
      const userRequestsRef = ref(db, `passRequests/${sanitizedEmpCode}`);
      const userSnapshot = await get(userRequestsRef);
      
      if (userSnapshot.exists()) {
        const userRequests = userSnapshot.val();
        
        // Check if this ID exists under the user's requests
        if (id in userRequests) {
          console.log(`🔍 deletePassRequest: Found request ${id} under user ${emp_code}`);
          const requestRef = ref(db, `passRequests/${sanitizedEmpCode}/${id}`);
          await remove(requestRef);
          console.log(`✅ Request with ID ${id} deleted successfully from user ${emp_code}.`);
          return true;
        }
      }
    }
    
    // Fallback to old format if username not provided or request not found under username
    console.log(`🔍 deletePassRequest: Trying old format for request ${id}`);
    const oldFormatRef = ref(db, `passRequests/${id}`);
    await remove(oldFormatRef);
    console.log(`✅ Request with ID ${id} deleted successfully from old format.`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting pass request:", error);
    return false;
  }
}

// Helper function to check if a request is older than 3 days
function isOlderThan3Days(createdAt: string) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created > 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
}

// Helper function to check if a request is expired (3 days from creation)
export function isExpired(createdAt: string): boolean {
  if (!createdAt) return true; // If no creation date, consider it expired
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created > 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
}

// Function to filter out expired requests from any array
export function filterOutExpiredRequests<T extends { createdAt: string }>(requests: T[]): T[] {
  return requests.filter(request => !isExpired(request.createdAt));
}

// Function to calculate time remaining until expiry (3 days from creation)
export function getTimeUntilExpiry(createdAt: string): {
  isExpired: boolean;
  timeRemaining: string;
  percentageRemaining: number;
  color: string;
} {
  if (!createdAt) {
    return {
      isExpired: true,
      timeRemaining: "Unknown",
      percentageRemaining: 0,
      color: "text-red-600"
    };
  }

  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const expiryTime = created + (3 * 24 * 60 * 60 * 1000); // 3 days from creation
  const timeRemaining = expiryTime - now;
  
  if (timeRemaining <= 0) {
    return {
      isExpired: true,
      timeRemaining: "Expired",
      percentageRemaining: 0,
      color: "text-red-600"
    };
  }

  // Calculate percentage remaining (0-100)
  const totalDuration = 3 * 24 * 60 * 60 * 1000; // 3 days
  const percentageRemaining = Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100));

  // Format time remaining
  const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

  let timeRemainingText = "";
  if (days > 0) {
    timeRemainingText = `${days}d ${hours}h`;
  } else if (hours > 0) {
    timeRemainingText = `${hours}h ${minutes}m`;
  } else {
    timeRemainingText = `${minutes}m`;
  }

  // Determine color based on time remaining
  let color = "text-green-600";
  if (percentageRemaining <= 25) {
    color = "text-red-600";
  } else if (percentageRemaining <= 50) {
    color = "text-yellow-600";
  } else if (percentageRemaining <= 75) {
    color = "text-orange-600";
  }

  return {
    isExpired: false,
    timeRemaining: timeRemainingText,
    percentageRemaining,
    color
  };
}

// Computes time remaining until a pass expires, using an explicit expiresAt timestamp (ISO string)
// The pass validity window is 24 hours from grant time, so we compute percentage relative to 24h.
export function getTimeUntilPassExpiry(expiresAt?: string | null): {
  isExpired: boolean;
  timeRemaining: string;
  percentageRemaining: number;
  color: string;
} {
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (!expiresAt) {
    return {
      isExpired: false,
      timeRemaining: "—",
      percentageRemaining: 100,
      color: "text-muted-foreground",
    };
  }

  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const timeRemaining = expiryTime - now;

  if (Number.isNaN(expiryTime)) {
    return {
      isExpired: true,
      timeRemaining: "Expired",
      percentageRemaining: 0,
      color: "text-red-600",
    };
  }

  if (timeRemaining <= 0) {
    return {
      isExpired: true,
      timeRemaining: "Expired",
      percentageRemaining: 0,
      color: "text-red-600",
    };
  }

  const percentageRemaining = Math.max(0, Math.min(100, (timeRemaining / oneDayMs) * 100));

  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

  const timeRemainingText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  let color = "text-green-600";
  if (percentageRemaining <= 25) {
    color = "text-red-600";
  } else if (percentageRemaining <= 50) {
    color = "text-yellow-600";
  } else if (percentageRemaining <= 75) {
    color = "text-orange-600";
  }

  return {
    isExpired: false,
    timeRemaining: timeRemainingText,
    percentageRemaining,
    color,
  };
}

// Function to check if a pass is expiring within 24 hours
export function isExpiringWithin24Hours(createdAt: string): boolean {
  if (!createdAt) return false;
  
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const expiryTime = created + (3 * 24 * 60 * 60 * 1000); // 3 days from creation
  const timeRemaining = expiryTime - now;
  
  // Check if expiring within 24 hours (but not already expired)
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return timeRemaining > 0 && timeRemaining <= twentyFourHours;
}

// Function to filter passes that are expiring within 24 hours
export function filterUrgentPasses<T extends { createdAt: string }>(passes: T[]): T[] {
  return passes.filter(pass => isExpiringWithin24Hours(pass.createdAt));
}

// Function to get urgent pass statistics
export function getUrgentPassStats<T extends { createdAt: string; type: string }>(passes: T[]): {
  totalUrgent: number;
  urgentOuting: number;
  urgentHomeVisit: number;
} {
  const urgentPasses = filterUrgentPasses(passes);
  return {
    totalUrgent: urgentPasses.length,
    urgentOuting: urgentPasses.filter(pass => pass.type === "outing").length,
    urgentHomeVisit: urgentPasses.filter(pass => pass.type === "home_visit").length,
  };
}

// Function to immediately delete expired pass requests from database
export async function deleteExpiredPassRequests() {
  try {
    console.log("🗑️ Starting immediate deletion of expired pass requests...");
    const db = getDatabase();
    const requestsRef = ref(db, "passRequests");
    const snapshot = await get(requestsRef);
    
    if (!snapshot.exists()) {
      console.log("📭 No pass requests found to delete");
      return;
    }
    
    const data = snapshot.val();
    let totalDeleted = 0;
    let homeVisitDeleted = 0;
    let outingDeleted = 0;
    
    // Check if the data is in the new format (username-based organization)
    const firstValue = Object.values(data)[0];
    
    if (firstValue && typeof firstValue === 'object' && !('username' in firstValue)) {
      // New format where data is organized by username
      console.log("🔍 deleteExpiredPassRequests: Found data in new format");
      
      for (const username in data) {
        const userRequests = data[username];
        
        for (const requestId in userRequests) {
          const request = userRequests[requestId];
          
          // Check if request is expired (older than 3 days)
          if (request.createdAt && isExpired(request.createdAt)) {
            try {
              const requestType = request.type || 'unknown';
              console.log(`🗑️ DELETING expired ${requestType} request ${requestId} for user ${username} (created: ${request.createdAt})`);
              
              // Delete from database immediately
              const requestRef = ref(db, `passRequests/${username}/${requestId}`);
              await remove(requestRef);
              
              totalDeleted++;
              if (requestType === 'home_visit') {
                homeVisitDeleted++;
              } else if (requestType === 'outing') {
                outingDeleted++;
              }
              
              console.log(`✅ DELETED expired ${requestType} request ${requestId} from database`);
            } catch (deleteError) {
              console.error(`❌ Failed to delete expired request ${requestId}:`, deleteError);
            }
          }
        }
      }
    } else {
      // Old format with direct key-value pairs
      console.log("🔍 deleteExpiredPassRequests: Found data in old format");
      
      for (const requestId in data) {
        const request = data[requestId];
        
        if (request.createdAt && isExpired(request.createdAt)) {
          try {
            const requestType = request.type || 'unknown';
            console.log(`🗑️ DELETING expired ${requestType} request ${requestId} (created: ${request.createdAt})`);
            
            // Delete from database immediately
            const requestRef = ref(db, `passRequests/${requestId}`);
            await remove(requestRef);
            
            totalDeleted++;
            if (requestType === 'home_visit') {
              homeVisitDeleted++;
            } else if (requestType === 'outing') {
              outingDeleted++;
            }
            
            console.log(`✅ DELETED expired ${requestType} request ${requestId} from database`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete expired request ${requestId}:`, deleteError);
          }
        }
      }
    }
    
    if (totalDeleted === 0) {
      console.log("✅ No expired requests found to delete");
    } else {
      console.log(`🗑️ DELETED ${totalDeleted} expired pass requests from database:`);
      console.log(`   📋 Home visit requests deleted: ${homeVisitDeleted}`);
      console.log(`   🚶 Outing requests deleted: ${outingDeleted}`);
    }
    
    return { totalDeleted, homeVisitDeleted, outingDeleted };
  } catch (error) {
    console.error("❌ Error during deletion of expired pass requests:", error);
    return { totalDeleted: 0, homeVisitDeleted: 0, outingDeleted: 0 };
  }
}

// Function to automatically cleanup old pass requests (older than 3 days)
export async function cleanupOldPassRequests() {
  try {
    console.log("🧹 Starting cleanup of old pass requests...");
    const db = getDatabase();
    const requestsRef = ref(db, "passRequests");
    const snapshot = await get(requestsRef);
    
    if (!snapshot.exists()) {
      console.log("📭 No pass requests found to cleanup");
      return;
    }
    
    const data = snapshot.val();
    let totalDeleted = 0;
    let homeVisitDeleted = 0;
    let outingDeleted = 0;
    
    // Check if the data is in the new format (username-based organization)
    // or the old format (direct key-value pairs)
    const firstValue = Object.values(data)[0];
    
    if (firstValue && typeof firstValue === 'object' && !('username' in firstValue)) {
      // This is the new format where data is organized by username
      console.log("🔍 cleanupOldPassRequests: Found data in new format");
      
      // Iterate through each username
      for (const username in data) {
        const userRequests = data[username];
        
        // Check each request for this user
        for (const requestId in userRequests) {
          const request = userRequests[requestId];
          
          // Check if request is expired (older than 3 days)
          if (request.createdAt && isOlderThan3Days(request.createdAt)) {
            try {
              // Log what type of request is being deleted
              const requestType = request.type || 'unknown';
              console.log(`🗑️ Deleting expired ${requestType} request ${requestId} for user ${username} (created: ${request.createdAt})`);
              
              // Use remove() to delete from database
              const requestRef = ref(db, `passRequests/${username}/${requestId}`);
              await remove(requestRef);
              
              // Update counters
              totalDeleted++;
              if (requestType === 'home_visit') {
                homeVisitDeleted++;
              } else if (requestType === 'outing') {
                outingDeleted++;
              }
              
              console.log(`✅ Successfully deleted expired ${requestType} request ${requestId}`);
            } catch (deleteError) {
              console.error(`❌ Failed to delete request ${requestId} for user ${username}:`, deleteError);
            }
          }
        }
      }
    } else {
      // This is the old format with direct key-value pairs
      console.log("🔍 cleanupOldPassRequests: Found data in old format");
      
      // Check each request for age
      for (const requestId in data) {
        const request = data[requestId];
        
        if (request.createdAt && isOlderThan3Days(request.createdAt)) {
          try {
            // Log what type of request is being deleted
            const requestType = request.type || 'unknown';
            console.log(`🗑️ Deleting expired ${requestType} request ${requestId} (created: ${request.createdAt})`);
            
            // Use remove() to delete from database
            const requestRef = ref(db, `passRequests/${requestId}`);
            await remove(requestRef);
            
            // Update counters
            totalDeleted++;
            if (requestType === 'home_visit') {
              homeVisitDeleted++;
            } else if (requestType === 'outing') {
              outingDeleted++;
            }
            
            console.log(`✅ Successfully deleted expired ${requestType} request ${requestId}`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete request ${requestId}:`, deleteError);
          }
        }
      }
    }
    
    if (totalDeleted === 0) {
      console.log("✅ No expired requests found to delete");
    } else {
      console.log(`✅ Successfully deleted ${totalDeleted} expired pass requests:`);
      console.log(`   📋 Home visit requests deleted: ${homeVisitDeleted}`);
      console.log(`   🚶 Outing requests deleted: ${outingDeleted}`);
    }
    
  } catch (error) {
    console.error("❌ Error during cleanup of old pass requests:", error);
  }
}
