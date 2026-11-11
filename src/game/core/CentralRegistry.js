/**
 * @file CentralRegistry.js
 * Central Registry pattern decoupling chassis definitions, mutations, supply drops, and AI strategies.
 */

class RegistryStore {
  constructor() {
    this.chassis = new Map();
    this.innateMutations = new Map();
    this.supplyMutagens = new Map();
    this.targetStrategies = new Map();
    this.motionStrategies = new Map();
    this.textures = new Map();
  }

  registerChassis(id, spec) {
    this.chassis.set(id, spec);
  }

  getChassis(id) {
    return this.chassis.get(id);
  }

  getAllChassis() {
    return Array.from(this.chassis.values());
  }

  registerInnateMutation(id, spec) {
    this.innateMutations.set(id, spec);
  }

  getInnateMutation(id) {
    return this.innateMutations.get(id);
  }

  getAllInnateMutations() {
    return Array.from(this.innateMutations.values());
  }

  registerSupplyMutagen(id, spec) {
    this.supplyMutagens.set(id, spec);
  }

  getSupplyMutagen(id) {
    return this.supplyMutagens.get(id);
  }

  getAllSupplyMutagens() {
    return Array.from(this.supplyMutagens.values());
  }

  registerTargetStrategy(id, strategyInstance) {
    this.targetStrategies.set(id, strategyInstance);
  }

  getTargetStrategy(id) {
    return this.targetStrategies.get(id);
  }

  getAllTargetStrategies() {
    return Array.from(this.targetStrategies.keys());
  }

  registerMotionStrategy(id, strategyInstance) {
    this.motionStrategies.set(id, strategyInstance);
  }

  getMotionStrategy(id) {
    return this.motionStrategies.get(id);
  }

  getAllMotionStrategies() {
    return Array.from(this.motionStrategies.keys());
  }

  registerTexture(key, renderTexture) {
    this.textures.set(key, renderTexture);
  }

  getTexture(key) {
    return this.textures.get(key);
  }
}

export const CentralRegistry = new RegistryStore();
