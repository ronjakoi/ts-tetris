import { Tile } from "./types.js";

export const PLAYFIELD_HEIGHT = 20;
export const PLAYFIELD_WIDTH = 10;

export const CANVAS_COLORS: { [key in Tile]: string } = {
    [Tile.Empty]: "black",
    [Tile.LightBlue]: "#00BCD4",
    [Tile.DarkBlue]: "#3F51B5",
    [Tile.Orange]: "#FF9800",
    [Tile.Yellow]: "#FFEB3B",
    [Tile.Green]: "#4CAF50",
    [Tile.Red]: "#D32F2F",
    [Tile.Magenta]: "#AD1457",
};

export const LOCK_DELAY_MS = 500;

export const FRAMES_PER_SECOND = 60;
// 1 tile / n frames
export const STARTING_GRAVITY = 1 / 128;
// on level-up, multiply gravity by this:
export const LEVEL_UP_GRAVITY_FACTOR = 1.4;
export const SOFTDROP_GRAVITY = 1/8;
// piece cannot move past the bottom in 1 frame
export const MAX_GRAVITY = PLAYFIELD_HEIGHT;

export const LINES_PER_LEVEL = 10;
