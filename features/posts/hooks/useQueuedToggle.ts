"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface QueuedToggleState {
  enabled: boolean;
  count: number;
}

interface UseQueuedToggleOptions {
  initialEnabled: boolean;
  initialCount: number;
  request: (enabled: boolean) => Promise<QueuedToggleState>;
  onChange?: (state: QueuedToggleState) => void;
  onError?: (error: unknown) => void;
}

export function useQueuedToggle({
  initialEnabled,
  initialCount,
  request,
  onChange,
  onError,
}: UseQueuedToggleOptions) {
  const [state, setState] = useState<QueuedToggleState>({
    enabled: initialEnabled,
    count: Math.max(0, initialCount),
  });
  const stateRef = useRef(state);
  const targetRef = useRef(initialEnabled);
  const confirmedRef = useRef(state);
  const processingRef = useRef(false);
  const requestRef = useRef(request);
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);

  requestRef.current = request;
  onChangeRef.current = onChange;
  onErrorRef.current = onError;

  const publish = useCallback((next: QueuedToggleState) => {
    const normalized = { ...next, count: Math.max(0, next.count) };
    stateRef.current = normalized;
    setState(normalized);
    onChangeRef.current?.(normalized);
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      while (true) {
        const requestedState = targetRef.current;
        const response = await requestRef.current(requestedState);
        confirmedRef.current = {
          enabled: response.enabled,
          count: Math.max(0, response.count),
        };
        if (targetRef.current === requestedState) {
          publish(confirmedRef.current);
          break;
        }
      }
    } catch (error) {
      targetRef.current = confirmedRef.current.enabled;
      publish(confirmedRef.current);
      onErrorRef.current?.(error);
    } finally {
      processingRef.current = false;
    }
  }, [publish]);

  const toggle = useCallback(() => {
    const nextEnabled = !targetRef.current;
    targetRef.current = nextEnabled;
    publish({
      enabled: nextEnabled,
      count: stateRef.current.count + (nextEnabled ? 1 : -1),
    });
    void processQueue();
  }, [processQueue, publish]);

  useEffect(() => {
    if (processingRef.current) return;
    const next = { enabled: initialEnabled, count: Math.max(0, initialCount) };
    targetRef.current = initialEnabled;
    confirmedRef.current = next;
    stateRef.current = next;
    setState(next);
  }, [initialCount, initialEnabled]);

  return { ...state, toggle };
}
