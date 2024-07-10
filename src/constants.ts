import { TileType } from "./types.js";

export const PLAYFIELD_HEIGHT = 20;
export const PLAYFIELD_WIDTH = 10;

export const CANVAS_COLORS: { [key in TileType]: string } = {
    [TileType.Empty]: "black",
    [TileType.LightBlue]: "cyan",
    [TileType.DarkBlue]: "#1E90FF",
    [TileType.Orange]: "orange",
    [TileType.Yellow]: "yellow",
    [TileType.Green]: "green",
    [TileType.Red]: "red",
    [TileType.Magenta]: "magenta",
};
