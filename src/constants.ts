import { Tile } from "./types.js";

export const PLAYFIELD_HEIGHT = 20;
export const PLAYFIELD_WIDTH = 10;

export const CANVAS_COLORS: { [key in Tile]: string } = {
    [Tile.Empty]: "black",
    [Tile.LightBlue]: "cyan",
    [Tile.DarkBlue]: "#1E90FF",
    [Tile.Orange]: "orange",
    [Tile.Yellow]: "yellow",
    [Tile.Green]: "green",
    [Tile.Red]: "red",
    [Tile.Magenta]: "magenta",
};

export const LOCK_DELAY_MS = 500;

export const FRAMES_PER_SECOND = 60;

export const STARTING_GRAVITY = 1 / 128; // 1 tile / n frames
export const SOFTDROP_GRAVITY = 1/8;
// piece cannot move past the bottom in 1 frame
export const MAX_GRAVITY = PLAYFIELD_HEIGHT;
