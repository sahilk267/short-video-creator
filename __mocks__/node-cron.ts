type ScheduledTask = {
  stop: () => void;
};

function schedule(_expression: string, _callback: () => void): ScheduledTask {
  return {
    stop: () => undefined,
  };
}

function validate(_expression: string): boolean {
  return true;
}

export default {
  schedule,
  validate,
};

export { schedule, validate };
