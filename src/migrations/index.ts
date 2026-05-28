import * as migration_20260528_115405_initial_phase_1 from './20260528_115405_initial_phase_1';
import * as migration_20260528_125136_relax_project_hero_image_optional from './20260528_125136_relax_project_hero_image_optional';

export const migrations = [
  {
    up: migration_20260528_115405_initial_phase_1.up,
    down: migration_20260528_115405_initial_phase_1.down,
    name: '20260528_115405_initial_phase_1',
  },
  {
    up: migration_20260528_125136_relax_project_hero_image_optional.up,
    down: migration_20260528_125136_relax_project_hero_image_optional.down,
    name: '20260528_125136_relax_project_hero_image_optional'
  },
];
