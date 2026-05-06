export class DependencyGraph {
  constructor() {
    this.dependsOn = new Map();
    this.dependents = new Map();
  }
  setDependencies(cellId, refs) {
    this.clearDependencies(cellId);
    const refSet = new Set(refs);
    this.dependsOn.set(cellId, refSet);
    for (const ref of refSet) {
      if (!this.dependents.has(ref)) {
        this.dependents.set(ref, new Set());
      }
      this.dependents.get(ref).add(cellId);
    }
  }
  clearDependencies(cellId) {
    const oldRefs = this.dependsOn.get(cellId);
    if (oldRefs) {
      for (const ref of oldRefs) {
        const revSet = this.dependents.get(ref);
        if (revSet) {
          revSet.delete(cellId);
          if (revSet.size === 0) this.dependents.delete(ref);
        }
      }
    }
    this.dependsOn.delete(cellId);
  }
  wouldCreateCycle(cellId, refs) {
    if (refs.includes(cellId)) return true;
    const visited = new Set();
    const stack = [...refs];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === cellId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const deps = this.dependsOn.get(current);
      if (deps) {
        for (const dep of deps) {
          if (!visited.has(dep)) {
            stack.push(dep);
          }
        }
      }
    }

    return false;
  }

  getRecalcOrder(cellId) {
    const affected = new Set();
    const queue = [cellId];

    while (queue.length > 0) {
      const current = queue.shift();
      const deps = this.dependents.get(current);
      if (deps) {
        for (const dep of deps) {
          if (!affected.has(dep)) {
            affected.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    if (affected.size === 0) return [];
    const inDegree = new Map();
    for (const id of affected) {
      inDegree.set(id, 0);
    }

    for (const id of affected) {
      const refs = this.dependsOn.get(id);
      if (refs) {
        for (const ref of refs) {
          if (affected.has(ref)) {
            inDegree.set(id, (inDegree.get(id) || 0) + 1);
          }
        }
      }
    }

    const sorted = [];
    const topoQueue = [];

    for (const [id, deg] of inDegree) {
      if (deg === 0) topoQueue.push(id);
    }

    while (topoQueue.length > 0) {
      const current = topoQueue.shift();
      sorted.push(current);

      const deps = this.dependents.get(current);
      if (deps) {
        for (const dep of deps) {
          if (affected.has(dep)) {
            const newDeg = inDegree.get(dep) - 1;
            inDegree.set(dep, newDeg);
            if (newDeg === 0) {
              topoQueue.push(dep);
            }
          }
        }
      }
    }

    if (sorted.length < affected.size) {
      for (const id of affected) {
        if (!sorted.includes(id)) {
          sorted.push(id);
        }
      }
    }

    return sorted;
  }

  getDependencies(cellId) {
    return this.dependsOn.get(cellId) || new Set();
  }

  getDependents(cellId) {
    return this.dependents.get(cellId) || new Set();
  }
}
