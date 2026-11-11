/**
 * @file ObjectPool.js
 * High-performance pre-allocated Object Pool to eliminate runtime garbage collection spikes.
 */

export class ObjectPool {
  /**
   * @param {() => any} factoryFn
   * @param {(item: any) => void} resetFn
   * @param {number} initialCapacity
   */
  constructor(factoryFn, resetFn, initialCapacity = 64) {
    this.factoryFn = factoryFn;
    this.resetFn = resetFn;
    this.freeList = [];
    this.activeList = [];

    for (let i = 0; i < initialCapacity; i++) {
      const item = this.factoryFn();
      this.freeList.push(item);
    }
  }

  acquire() {
    const item = this.freeList.length > 0 ? this.freeList.pop() : this.factoryFn();
    this.activeList.push(item);
    return item;
  }

  release(item) {
    const idx = this.activeList.indexOf(item);
    if (idx !== -1) {
      // Fast swap-and-pop removal
      const last = this.activeList.pop();
      if (idx < this.activeList.length) {
        this.activeList[idx] = last;
      }
    }
    this.resetFn(item);
    this.freeList.push(item);
  }

  releaseAll() {
    while (this.activeList.length > 0) {
      const item = this.activeList.pop();
      this.resetFn(item);
      this.freeList.push(item);
    }
  }
}
