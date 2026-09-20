

export interface ErrataEvent {
  type: 'capture' | 'check_match' | 'check_new';
  errorClassId: string;
  title: string;
  occurrenceCount: number;
  project?: string;
  technologies?: string[];
  timestamp: string;
}

type Listener = (event: ErrataEvent) => void;


declare global {
  var __errata_event_bus: {
    listeners: Set<Listener>;
    emit: (event: ErrataEvent) => void;
    subscribe: (cb: Listener) => () => void;
  } | undefined;
}

function createBus() {
  const listeners = new Set<Listener>();
  return {
    listeners,
    emit(event: ErrataEvent) {
      listeners.forEach((cb) => {
        try {
          cb(event);
        } catch {

        }
      });
    },
    subscribe(cb: Listener) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

if (!global.__errata_event_bus) {
  global.__errata_event_bus = createBus();
}

export const eventBus = global.__errata_event_bus;
