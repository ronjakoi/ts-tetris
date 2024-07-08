//import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from "../src/constants";
import { TileMatrix, Playfield, Tetromino, tetrominoFactory } from "./game";

// No idea why this doesn't work:
// import { describe, test, expect } from "@jest/globals";
const { describe, test, expect } = require('@jest/globals');

const pf = new Playfield(5, 8);
//const o = tetrominoFactory.get("O")!;
const o = tetrominoFactory.getByIdx(2);

describe('overlay tetromino on empty 5x8 playfield', () => {
    test('O at origin', () => {
        const oAtOrigin = [
            4,4,0,0,0,0,0,0,
            4,4,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0
        ];
        expect(pf.overlay(o).tiles).toEqual(oAtOrigin);
    });
});