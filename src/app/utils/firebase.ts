import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from "fs";
import path from "path";

let serviceAccount: ServiceAccount;

const keyPath = path.join(__dirname, "../../../firebase-service-account.json");
serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const firebaseAdmin = { messaging: getMessaging };
export default firebaseAdmin;