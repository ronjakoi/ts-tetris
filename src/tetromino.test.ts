import { describe, expect, test } from "vitest";
import { tetrominoFactory } from "./tetromino.js";

describe("tetrominoFactory methods", () => {
    test.each([
        { name: "T", idx: 0 },
        { name: "I", idx: 1 },
        { name: "O", idx: 2 },
        { name: "J", idx: 3 },
        { name: "L", idx: 4 },
        { name: "S", idx: 5 },
        { name: "Z", idx: 6 },
    ])("getByName($name) == getByIdx($idx)", ({ name, idx }) => {
        const tByName = tetrominoFactory.getByName(name);
        const tByIdx = tetrominoFactory.getByIdx(idx);
        expect(tByName).toBeDefined();
        expect(tByIdx).toBeDefined();
        expect(JSON.stringify(tByName)).toEqual(JSON.stringify(tByIdx));
    });
});
