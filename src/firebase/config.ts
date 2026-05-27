import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID

let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined
let googleProvider: GoogleAuthProvider | undefined

if (isFirebaseConfigured && getApps().length === 0) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
} else if (isFirebaseConfigured && getApps().length > 0) {
  app = getApps()[0]
  db = getFirestore(app)
  auth = getAuth(app)
  googleProvider = new GoogleAuthProvider()
}

export { app, db, auth, googleProvider }
