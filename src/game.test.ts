import { describe, expect, test } from 'vitest';
import { TileMatrix, Playfield, Tetromino, tetrominoFactory } from "./game";

test.each([
    { pf: new Playfield(5, 8),
    t: tetrominoFactory.getByIdx(2),
    mtx: [
        4,4,0,0,0,0,0,0,
        4,4,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0
    ]},
    { pf: new Playfield(5, 8),
    t: tetrominoFactory.getByIdx(0),
    mtx: [
        0,7,0,0,0,0,0,0,
        7,7,7,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0
    ]}
])('overlay $t.name at origin', ({pf, t, mtx}) => {
    expect(pf.overlay(t).tiles).toEqual(mtx);
});

test.each([
    { pf: new Playfield(5, 8),
    t: tetrominoFactory.getByIdx(2),
    // prettier-ignore
    mtx: [
        0,0,0,0,0,0,0,0,
        0,0,4,4,0,0,0,0,
        0,0,4,4,0,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
    ]},
    { pf: new Playfield(5, 8),
    t: tetrominoFactory.getByIdx(0),
    // prettier-ignore
    mtx: [
        0,0,0,0,0,0,0,0,
        0,0,0,7,0,0,0,0,
        0,0,7,7,7,0,0,0,
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
    ]}
])('overlay $t.name at (2,1)', ({pf, t, mtx}) => {
    expect(pf.overlay(t, [2,1]).tiles).toEqual(mtx);
});
