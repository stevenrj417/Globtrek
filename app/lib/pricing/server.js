// Server only. Importing this module turns on observed prices for any budget
// computed in this server process (browser code never imports it).
import { registerObservedFares } from "../recommendation/travelFeasibility.js";
import { observedFare } from "./observedFares.js";

registerObservedFares(observedFare);
