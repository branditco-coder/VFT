
import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile, UserRole } from '../types';

export const authService = {
  
  // Real-time listener for user state
  observeUser: (callback: (user: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          let userDoc;
          
          try {
             userDoc = await getDoc(userDocRef);
          } catch (err) {
             console.warn("Firestore read failed, using Auth data only:", err);
             userDoc = null;
          }
          
          let role: UserRole = 'pro'; 
          
          if (userDoc && userDoc.exists()) {
             const data = userDoc.data();
             
             // --- AUTO-HEAL & NORMALIZE ROLE ---
             const rawRole = data.role || data.Role || 'pro';
             const normalizedRole = rawRole.toLowerCase();
             
             if (normalizedRole === 'admin' || normalizedRole === 'pro' || normalizedRole === 'guest') {
                 role = normalizedRole as UserRole;
             }

             // Force Admin for specific email (God Mode)
             if (firebaseUser.email === 'warrasderiv@gmail.com' && role !== 'admin') {
                 role = 'admin';
                 await setDoc(userDocRef, { role: 'admin' }, { merge: true });
             }
             // Standard Heal
             else if (!data.role || data.role !== role) {
                 try {
                     await setDoc(userDocRef, { role: role }, { merge: true });
                 } catch (e) {
                     console.warn("Auto-heal write failed:", e);
                 }
             }

          } else {
             // Create profile if missing
             try {
                // Force Admin for your email upon creation/recovery
                if (firebaseUser.email === 'warrasderiv@gmail.com') {
                    role = 'admin';
                }

                await setDoc(userDocRef, {
                    email: firebaseUser.email,
                    role: role, 
                    joinedAt: Date.now()
                });
             } catch (writeErr) {
                console.warn("Firestore write failed (likely permissions), continuing with in-memory session:", writeErr);
             }
          }

          const profile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Trader',
            role: role,
            avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email?.split('@')[0]}&background=0052CC&color=fff`,
            joinedAt: Date.now() 
          };
          callback(profile);

        } catch (e) {
          console.error("Critical Auth Error:", e);
          const safeProfile: UserProfile = {
             id: firebaseUser.uid,
             email: firebaseUser.email || '',
             name: 'Trader',
             role: 'pro',
             joinedAt: Date.now()
          };
          callback(safeProfile);
        }
      } else {
        callback(null);
      }
    });
  },

  login: async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error("Login failed:", error);
      let msg = "Invalid email or password.";
      if (error.code === 'auth/user-not-found') msg = "No account found. Please Register.";
      if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (error.code === 'auth/too-many-requests') msg = "Too many attempts. Try again later.";
      return { success: false, message: msg };
    }
  },

  loginWithGoogle: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check/Create Firestore Profile
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
         // Force Admin for specific email
         let role: UserRole = 'pro';
         if (user.email === 'warrasderiv@gmail.com') {
             role = 'admin';
         }

         await setDoc(userDocRef, {
            email: user.email,
            role: role,
            joinedAt: Date.now()
         });
      }

      return { success: true };
    } catch (error: any) {
      console.error("Google Sign-In failed:", error);
      let msg = "Google Sign-In failed.";
      if (error.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
      
      // SPECIFIC HANDLER FOR UNAUTHORIZED DOMAIN
      if (error.code === 'auth/unauthorized-domain') {
          msg = `Domain not authorized. Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized Domains.`;
      }
      
      return { success: false, message: msg };
    }
  },

  register: async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Force Admin for your email
      let role: UserRole = 'pro';
      if (email === 'warrasderiv@gmail.com') {
          role = 'admin';
      }

      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          email: email,
          role: role,
          joinedAt: Date.now()
        });
      } catch (fsError) {
        console.warn("Firestore profile creation failed, but Auth succeeded.", fsError);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Registration failed:", error);
      
      if (error.code === 'auth/email-already-in-use') {
         try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true, message: "Account existed. Logged in successfully." };
         } catch (loginErr: any) {
             if (loginErr.code === 'auth/wrong-password') {
                 return { success: false, message: "Account exists, but password was incorrect." };
             }
             return { success: false, message: "Account exists. Please Sign In." };
         }
      }

      let msg = "Registration failed.";
      if (error.code === 'auth/weak-password') msg = "Password must be 6+ chars.";
      if (error.code === 'auth/invalid-email') msg = "Invalid email.";
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    await signOut(auth);
    window.location.reload(); 
  },

  resetPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "Password reset email sent!" };
    } catch (error: any) {
        console.error("Reset password failed:", error);
        if (error.code === 'auth/user-not-found') return { success: false, message: "No account found with this email." };
        if (error.code === 'auth/invalid-email') return { success: false, message: "Invalid email address." };
        return { success: false, message: "Failed to send reset email." };
    }
  },

  canAccess: (user: UserProfile | null, requiredRole: UserRole): boolean => {
    if (!user) return requiredRole === 'guest';
    if (user.role === 'admin') return true;
    if (user.role === 'pro') return requiredRole !== 'admin';
    return requiredRole === 'guest';
  }
};
