/**
 * walkContext.ts — React context carrying the active WalkLayout down the
 * 3D scene graph, so one Corridor implementation can render both the home
 *  gallery walk and the standalone /about walk without prop drilling.
 */
import { createContext, useContext } from "react";
import { homeLayout, type WalkLayout } from "./path";

export const WalkLayoutContext = createContext<WalkLayout>(homeLayout);

export const useWalkLayout = (): WalkLayout => useContext(WalkLayoutContext);
