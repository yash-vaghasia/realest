import * as migration_20260528_115405_initial_phase_1 from './20260528_115405_initial_phase_1';

export const migrations = [
  {
    up: migration_20260528_115405_initial_phase_1.up,
    down: migration_20260528_115405_initial_phase_1.down,
    name: '20260528_115405_initial_phase_1'
  },
];
