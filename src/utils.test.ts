import {arrayElementsEqual, retryUntil, waitWithTimeout} from "./utils";

jest.mock("./info");

test("waitWithTimeout - timeout", async () => {
    const res = await waitWithTimeout(new Promise(res => setTimeout(() => res(true), 1000)), 50);
    expect(res).toBeUndefined();
});

test("waitWithTimeout - resolve", async () => {
    const res = await waitWithTimeout(new Promise(res => setTimeout(() => res(true), 50)), 200);
    expect(res).toBe(true);
});

function retryTest(index: number): any {
    return index >= 5;
}

test("retryUntil - timeout", async () => {
    const fn = jest.fn(retryTest);
    const res = await retryUntil(fn, {interval: 40, timeout: 30});

    // wait a bit to properly check whether the retry loop has stopped
    await new Promise(res => setTimeout(res, 70));

    expect(fn).toBeCalledTimes(1);
    expect(fn).lastCalledWith(0);
    expect(res).toBeUndefined();
});

test("retryUntil - success", async () => {
    const fn = jest.fn(retryTest);
    const res = await retryUntil(fn, {interval: 10});

    expect(fn).lastCalledWith(5);
    expect(res).toBe(true);
});

test("arrayElementsEqual", () => {
    const a = [1, 2, 3];
    const b = [1, 2, 3];
    const c = [1, 2, 3, 4];
    const d = [3, 2, 1];

    expect(a).not.toBe(b);
    expect(arrayElementsEqual(a, a)).toBeTruthy();
    expect(arrayElementsEqual(a, b)).toBeTruthy();
    expect(arrayElementsEqual(b, a)).toBeTruthy();

    expect(arrayElementsEqual(a, c)).toBeFalsy();
    expect(arrayElementsEqual(a, d)).toBeFalsy();
});
