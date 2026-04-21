import {
  collection,
  addDoc,
  doc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Save a scan record to the authenticated user's subcollection.
 * Path: users/{uid}/scans/{auto-id}
 *
 * @param {string} uid - Firebase Auth user ID
 * @param {Object} product - Enriched product object
 */
export async function saveScanToUser(uid, product) {
  const scansRef = collection(db, "users", uid, "scans");
  await addDoc(scansRef, {
    barcode: product.barcode || "",
    name: product.name || "",
    brand: product.brand || "",
    category: product.category || "",
    greenScore: product.greenScore ?? 0,
    scoreLabel: product.scoreLabel || "",
    image: product.image || "",
    scannedAt: serverTimestamp(),
  });
}

/**
 * Upsert a global leaderboard entry for the scanned product.
 * Path: scans/{barcode}
 * Increments the scan count and updates metadata on each scan.
 *
 * @param {Object} product - Enriched product object
 */
export async function updateGlobalLeaderboard(product) {
  const barcode = product.barcode;
  if (!barcode) return;

  const scanRef = doc(db, "scans", barcode);
  await setDoc(
    scanRef,
    {
      barcode,
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      greenScore: product.greenScore ?? 0,
      scoreLabel: product.scoreLabel || "",
      image: product.image || "",
      count: increment(1),
      lastScannedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Submit an unknown / unrecognized product for community review.
 * Path: suggestions/{barcode}
 *
 * @param {string} barcode - The scanned barcode
 * @param {Object} formData - User-submitted product details
 * @param {string} uid - Firebase Auth user ID of the submitter
 */
export async function submitUnknownProduct(barcode, formData, uid) {
  const suggestionRef = doc(db, "suggestions", barcode);
  await setDoc(suggestionRef, {
    barcode,
    ...formData,
    submittedBy: uid,
    submittedAt: serverTimestamp(),
    status: "pending",
  });
}
