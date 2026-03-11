// ============================================================
// src/services/eventBus.ts — In-process EventEmitter-based Event Bus
// ============================================================

import { EventEmitter } from 'events'

export type EventTopic =
  | 'patient.diagnosis'
  | 'hospital.admission'
  | 'lab.result'
  | 'prescription.update'
  | 'pharmacy.purchase'
  | 'outbreak.alert'

export type SubscribableTopic = EventTopic | '*'

export interface EventPayload {
  topic: EventTopic
  id: string
  timestamp: string
  data: Record<string, unknown>
  source?: string
}

export type EventHandler = (payload: EventPayload) => void

// ── Event history ring buffer ─────────────────────────────────
const EVENT_HISTORY_SIZE = 500
const eventHistory: EventPayload[] = []
let eventCounter = 0

function recordEvent(payload: EventPayload): void {
  if (eventHistory.length >= EVENT_HISTORY_SIZE) {
    eventHistory.shift()
  }
  eventHistory.push(payload)
}

// ── EventBus class (Kafka-compatible interface) ───────────────
class EventBus {
  private readonly emitter = new EventEmitter()

  constructor() {
    // Allow many listeners (one per SSE client)
    this.emitter.setMaxListeners(200)
  }

  publish(topic: EventTopic, data: Record<string, unknown>, source?: string): EventPayload {
    const payload: EventPayload = {
      topic,
      id: `evt-${++eventCounter}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data,
      source,
    }

    recordEvent(payload)
    this.emitter.emit(topic, payload)
    this.emitter.emit('*', payload)  // wildcard for SSE streams

    return payload
  }

  subscribe(topic: SubscribableTopic, handler: EventHandler): () => void {
    this.emitter.on(topic, handler)
    // Return unsubscribe function
    return () => this.emitter.off(topic, handler)
  }

  once(topic: EventTopic, handler: EventHandler): void {
    this.emitter.once(topic, handler)
  }

  getEventHistory(limit = 50): EventPayload[] {
    return eventHistory.slice(-Math.min(limit, EVENT_HISTORY_SIZE))
  }

  getEventsByTopic(topic: EventTopic, limit = 50): EventPayload[] {
    return eventHistory.filter(e => e.topic === topic).slice(-limit)
  }

  listenerCount(topic: SubscribableTopic): number {
    return this.emitter.listenerCount(topic)
  }
}

export const eventBus = new EventBus()
