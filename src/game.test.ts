import { describe, expect, test } from "vitest";
import { TileMatrix, Playfield, Tetromino, tetrominoFactory } from "./game";

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
])("overlay $t.name at origin", ({ pf, t, mtx }) => {
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
])("overlay $t.name at (2,1)", ({ pf, t, mtx }) => {
    expect(pf.overlay(t, [2, 1]).tiles).toEqual(mtx);
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
});
