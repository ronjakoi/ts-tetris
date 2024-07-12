import { describe, expect, test } from "vitest";
import { TileMatrix, Playfield, Tetromino, tetrominoFactory, transpose, rotate90CW } from "./game";
import { Orientation, Tile } from "./types";

describe("utility", () => {
    test("transpose 2d array", () => {
        const arr = [
            [1,0,2],
            [0,3,0],
            [4,0,5],
            ];
        expect(transpose(arr)).toEqual([
            [1,0,4],
            [0,3,0],
            [2,0,5],
        ])
    });
    test("rotate 2d array 90° clockwise", () => {
        const arr = [
            [1,0,2],
            [0,3,0],
            [4,0,5],
            ];
        expect(rotate90CW(arr)).toEqual([
            [4,0,1],
            [0,3,0],
            [5,0,2]
        ]);
    })
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
        const t = tetrominoFactory.getByIdx(3);
        const correctArr = [Tile.DarkBlue, Tile.DarkBlue, Tile.DarkBlue,
                            Tile.Empty, Tile.DarkBlue, Tile.Empty];
        t.rotate(90);
        expect(t.orientation).toEqual(Orientation.East);
        expect(t.tiles[t.orientation].tiles).toEqual(correctArr);
    })
});

describe("gameplay events", () => {
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
        mtx.clearRows([5,6,7]);
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
            ]
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
        expect(fullRows).toEqual([5,6,7]);
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
    })
});
