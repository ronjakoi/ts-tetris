import { Tetromino } from "./tetromino.js";
import { Tile, Vec2 } from "./types.js";

export class TileMatrix {
    tiles: Tile[];
    height: number;
    width: number;
    readonly length: number;

    constructor(t: Tile[], w: number, h: number) {
        this.tiles = Array.from(t);
        this.height = h;
        this.width = w;
        this.length = this.tiles.length;
    }

    static newEmpty(width: number, height: number) {
        const t = Array(width * height).fill(Tile.Empty);
        return new TileMatrix(t, width, height);
    }

    get = (x: number, y: number): Tile => this.tiles[y * this.width + x];

    overlay(other: TileMatrix | Tetromino, position?: Vec2): TileMatrix {
        const ret = new TileMatrix(this.tiles, this.width, this.height);

        let pos: Vec2;
        if (position) {
            pos = position;
        } else {
            pos =
                other instanceof Tetromino && other.position
                    ? // other.position[1] (y coordinate) can be fractional
                      [other.position[0], Math.floor(other.position[1])]
                    : [0, 0];
        }
        for (let i = pos[1], y = 0; i < this.height && y < other.height; i++, y++) {
            for (let j = pos[0], x = 0; j < this.width && x < other.width; j++, x++) {
                const t = other.get(x, y);
                if (t != Tile.Empty) {
                    ret.tiles[i * this.width + j] = t.valueOf();
                }
            }
        }
        return ret;
    }

    clearRows(rows: number[]): void {
        // create new array with $lines * $width empty tiles
        let newTiles: Tile[] = Array(rows.length * this.width).fill(Tile.Empty);
        const lineStartIdxs = rows.map((n) => n * this.width);
        const lastLineStart = this.tiles.length - this.width;
        for (let i = 0; i <= lastLineStart; i += this.width) {
            // if this is not a line to be deleted, copy it to new array
            if (!lineStartIdxs.includes(i)) {
                const keepLine = this.tiles.slice(i, i + this.width);
                newTiles = newTiles.concat(keepLine);
            }
        }
        this.tiles = newTiles;
    }

    getFullRows(): number[] {
        const rows: number[] = [...Array(this.height).keys()];
        return rows.filter((row) =>
            this.tiles
                .slice(row * this.width, row * this.width + this.width)
                .every((col) => col != Tile.Empty),
        );
    }
}

export const intersects = (a: TileMatrix, b: TileMatrix, pos: Vec2): boolean => {
    const y0 = Math.floor(pos[1]);
    const x0 = pos[0];
    for (let i = 0; i < a.height; i++) {
        for (let j = 0; j < a.width; j++) {
            if (a.get(j, i) != Tile.Empty && b.get(x0 + j, y0 + i) != Tile.Empty) {
                return true;
            }
        }
    }
    return false;
};
