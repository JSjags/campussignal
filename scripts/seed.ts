import "dotenv/config";
import { resetSeed } from "../lib/store";
resetSeed()
  .then(() => console.log("CampusSignal seeded: Amaka, Tunde, Chioma."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
