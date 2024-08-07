import { describe, expect, test } from "vitest";
import { Move, Orientation, Tile, Vec2 } from "./types";
import { transpose, tetrominoFactory, rotate90CW, maybeRotate, maybeMove } from "./tetromino";
import { Playfield } from "./game";
import { TileMatrix } from "./tiles";

describe("utility", () => {
    test("transpose 2d array", () => {
        const arr = [
            [1, 0, 2],
            [0, 3, 0],
            [4, 0, 5],
        ];
        expect(transpose(arr)).toEqual([
            [1, 0, 4],
            [0, 3, 0],
            [2, 0, 5],
        ]);
    });
    test("rotate 2d array 90° clockwise", () => {
        const arr = [
            [1, 0, 2],
            [0, 3, 0],
            [4, 0, 5],
        ];
        expect(rotate90CW(arr)).toEqual([
            [4, 0, 1],
            [0, 3, 0],
            [5, 0, 2],
        ]);
    });
    test("matrix in bounds of other matrix", () => {
        const a = TileMatrix.newEmpty(2, 2);
        const b = TileMatrix.newEmpty(3, 3);
        expect(a.inBoundsOf(b, [0, 0])).toBeTruthy();
        expect(a.inBoundsOf(b, [1, 1])).toBeTruthy();
    });
    test("matrix out of bounds of other matrix", () => {
        const a = TileMatrix.newEmpty(2, 2);
        const b = TileMatrix.newEmpty(3, 3);
        expect(a.inBoundsOf(b, [-1, 0])).toBeFalsy();
        expect(a.inBoundsOf(b, [2, 1])).toBeFalsy();
        expect(a.inBoundsOf(b, [1, 2])).toBeFalsy();
    });
});

describe("tetromino behavior", () => {
    test.each([
        {
            pf: new Playfield(5, 8),
            t: tetrominoFactory.getByIdx(2),
            // prettier-ignore
            mtx: [
            4,4,0,0,0,
            4,4,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
        ],
        },
        {
            pf: new Playfield(5, 8),
            t: tetrominoFactory.getByIdx(0),
            // prettier-ignore
            mtx: [
            0,7,0,0,0,
            7,7,7,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
        ],
        },
    ])("overlay tetromino at origin", ({ pf, t, mtx }) => {
        expect(pf.overlay(t).tiles).toEqual(mtx);
    });

    test.each([
        {
            pf: new Playfield(5, 8),
            t: tetrominoFactory.getByIdx(2),
            // prettier-ignore
            mtx: [
            0,0,0,0,0,
            0,0,4,4,0,
            0,0,4,4,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
        ],
        },
        {
            pf: new Playfield(5, 8),
            t: tetrominoFactory.getByIdx(0),
            // prettier-ignore
            mtx: [
            0,0,0,0,0,
            0,0,0,7,0,
            0,0,7,7,7,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
            0,0,0,0,0,
        ],
        },
    ])("overlay tetromino at (2,1)", ({ pf, t, mtx }) => {
        expect(pf.overlay(t, [2, 1]).tiles).toEqual(mtx);
    });

    test("rotate J tetromino 90°", () => {
        const pf = new Playfield(5, 8);
        const t = tetrominoFactory.getByIdx(3);
        t.position = [1, 1];
        // prettier-ignore
        const correctArr = [Tile.DarkBlue, Tile.DarkBlue, Tile.DarkBlue,
                            Tile.Empty, Tile.DarkBlue, Tile.Empty];
        const r = maybeRotate(t, pf, 90);
        expect(r).toBeDefined();
        t.orientation = r![0];
        t.width = t.tiles[r![0]].width;
        t.height = t.tiles[r![0]].height;
        expect(t.orientation).toEqual(Orientation.East);
        expect(t.tiles[t.orientation].tiles).toEqual(correctArr);
    });
});

describe("gameplay events", () => {
    test.each([
        { tId: 0, pos: [0, 6] },
        { tId: 1, pos: [0, 7] },
        { tId: 2, pos: [0, 6] },
        { tId: 3, pos: [0, 6] },
        { tId: 4, pos: [0, 6] },
        { tId: 5, pos: [0, 6] },
        { tId: 6, pos: [0, 6] },
    ])(
        "tetromino $tId in default orientation at $pos in empty playfield:\tlanded",
        ({ tId, pos }) => {
            const pf = new Playfield(5, 8);
            const t = tetrominoFactory.getByIdx(tId);
            t.position = [pos[0], pos[1]]; // dumb thing to silence a type warning
            expect(maybeMove(t, pf, Move.Down)).toBeUndefined();
        },
    );
    test.each([
        { tId: 0, pos: [0, 5] },
        { tId: 1, pos: [0, 6] },
        { tId: 2, pos: [0, 5] },
        { tId: 3, pos: [0, 5] },
        { tId: 4, pos: [0, 5] },
        { tId: 5, pos: [0, 5] },
        { tId: 6, pos: [0, 5] },
    ])(
        "tetromino $tId in default orientation at $pos in empty playfield:\t not landed",
        ({ tId, pos }) => {
            const pf = new Playfield(5, 8);
            const t = tetrominoFactory.getByIdx(tId);
            t.position = [pos[0], pos[1]]; // dumb thing to silence a type warning
            expect(maybeMove(t, pf, Move.Down)).toBeDefined();
        },
    );
    test("clear rows", () => {
        const mtx = new TileMatrix(
            // prettier-ignore
            [
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,3,0,1,
                2,2,2,0,4,
                2,2,2,0,1,
                2,2,2,4,4,
                2,2,2,1,1,
                2,2,2,1,1,
            ],
            5,
            8,
        );
        mtx.clearRows([5, 6, 7]);
        expect(mtx.tiles).toEqual(
            // prettier-ignore
            [
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,3,0,1,
                2,2,2,0,4,
                2,2,2,0,1,
            ],
        );
    });
    test("find full rows", () => {
        const mtx = new TileMatrix(
            // prettier-ignore
            [
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,3,0,1,
                2,2,2,0,4,
                2,2,2,0,1,
                2,2,2,4,4,
                2,2,2,1,1,
                2,2,2,1,1,
            ],
            5,
            8,
        );
        const fullRows = mtx.getFullRows();
        expect(fullRows).toEqual([5, 6, 7]);
    });
    test("shuffle random bag", () => {
        const bagBefore = [...tetrominoFactory.randomBag];
        expect(bagBefore.length).toBeGreaterThan(0);
        tetrominoFactory.shuffle();
        expect(tetrominoFactory.randomBag.length).toBeGreaterThan(0);
        expect(tetrominoFactory.randomBag).not.toEqual(bagBefore);
        const bagBeforeSorted = [...bagBefore].sort();
        const randomBagSorted = [...tetrominoFactory.randomBag].sort();
        expect(bagBeforeSorted).toEqual(randomBagSorted);
    });
});
