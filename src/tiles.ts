import { Tetromino } from "./tetromino.js";
import { Move, Orientation, Tile, Vec2 } from "./types.js";

export interface Matrix {
    tiles: any;
    width: number;
    height: number;
    position?: Vec2;
    orientation?: Orientation;
    get(x: number, y: number): Tile;
    overlay(other: Matrix, position?: Vec2): Matrix;
    intersects?(other: Matrix, position?: Vec2): boolean;
    translate?(direction: Move): Matrix;
    rotate?(deg: -90 | 90): Matrix;
    inBoundsOf?(other: Matrix, position?: Vec2): boolean;
    clearRows?(rows: number[]): void;
    getFullRows?(): number[];
}

export class TileMatrix implements Matrix {
    tiles: Tile[];
    height: number;
    width: number;

    constructor(t: Tile[], w: number, h: number) {
        this.tiles = Array.from(t);
        this.height = h;
        this.width = w;
    }

    static newEmpty(width: number, height: number) {
        const t = Array(width * height).fill(Tile.Empty);
        return new TileMatrix(t, width, height);
    }

    get = (x: number, y: number): Tile => this.tiles[y * this.width + x];

    overlay(other: Matrix, position?: Vec2): Matrix {
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

    intersects(other: Matrix, position?: Vec2): boolean {
        const pos = position ? position : [0, 0];
        const y0 = Math.floor(pos[1]);
        const x0 = pos[0];
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.get(j, i) != Tile.Empty && other.get(x0 + j, y0 + i) != Tile.Empty) {
                    return true;
                }
            }
        }
        return false;
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

    inBoundsOf(other: Matrix, position?: Vec2): boolean {
        const pos = position ? position : [0, 0];
        return (
            pos[0] >= 0 &&
            pos[1] >= 0 &&
            pos[0] <= other.width - this.width &&
            Math.floor(pos[1]) <= other.height - this.height
        );
    }
}
